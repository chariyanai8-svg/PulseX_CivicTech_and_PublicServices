"""CivicPulse NLP Service — Main Inference Pipeline.

This orchestrator wires together the preprocessor, text classification model,
and the token classification (NER) model to execute the end-to-end inference
flow, converting a raw user string into a structured JSON payload.
"""

import logging
import string
from pathlib import Path
from typing import Dict, Any

from transformers import pipeline
from app.core.config import settings
from app.services.preprocessor import Preprocessor

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent.parent.parent
_classifier_path = Path(settings.model_classifier_path)
CLASSIFIER_DIR = _classifier_path if _classifier_path.is_absolute() else (BASE_DIR / _classifier_path).resolve()

_ner_path = Path(settings.model_extractor_path)
NER_DIR = _ner_path if _ner_path.is_absolute() else (BASE_DIR / _ner_path).resolve()


class InferencePipeline:
    """End-to-end CivicPulse NLP Pipeline."""

    @property
    def is_loaded(self) -> bool:
        """Returns True if both classifier and NER models are loaded."""
        return getattr(self, "classifier", None) is not None and getattr(self, "ner", None) is not None


    def __init__(self):
        """Initializes all sub-modules and loads ML models into memory."""
        logger.info("Initializing Preprocessor...")
        self.preprocessor = Preprocessor()
        
        logger.info(f"Loading Classifier from {CLASSIFIER_DIR}...")
        try:
            self.classifier = pipeline(
                "text-classification", 
                model=str(CLASSIFIER_DIR), 
                tokenizer=str(CLASSIFIER_DIR)
            )
        except Exception as e:
            logger.error(f"Failed to load classifier: {e}")
            raise RuntimeError("Classifier model not found. Ensure training completed.") from e
            
        logger.info(f"Loading NER Extractor from {NER_DIR}...")
        try:
            # aggregation_strategy="simple" is the heuristic post-processor!
            # It automatically stitches BPE subword tokens and consecutive B/I tags
            # back into full words, saving us from writing manual heuristic logic.
            self.ner = pipeline(
                "token-classification", 
                model=str(NER_DIR), 
                tokenizer=str(NER_DIR),
                aggregation_strategy="simple" 
            )
        except Exception as e:
            logger.error(f"Failed to load NER model: {e}")
            raise RuntimeError("NER model not found. Ensure training completed.") from e

    def _postprocess_entities(self, text: str, ner_results: list) -> Dict[str, list]:
        """Post-process raw NER results with word-boundary snapping, span merging, and punctuation trimming.

        Handles subword tokenization artifacts where SentencePiece splits words into subwords
        (e.g. 'Lampu' -> 'Lamp' + 'u', 'pothole' -> 'pot' + 'hole', or 'rosak' -> 'rosa')
        and strips trailing punctuation from extracted spans.
        """
        extracted_info = {
            "issue": [],
            "location": [],
            "severity": [],
            "timing": [],
            "symptom": []
        }
        if not ner_results:
            return extracted_info

        text_len = len(text)
        chars_to_strip = string.punctuation + " \t\n\r"

        # 1. Snap each entity span to word boundaries if cut mid-word by subword tokenization
        snapped = []
        for ent in ner_results:
            group = ent.get("entity_group", "").lower()
            if group not in extracted_info:
                continue

            start = ent.get("start")
            end = ent.get("end")

            # Fallback if offsets are missing (e.g. mock outputs in unit tests)
            if start is None or end is None:
                word = " ".join(ent.get("word", "").replace("\u2581", " ").split()).strip(chars_to_strip)
                if word and word not in extracted_info[group]:
                    extracted_info[group].append(word)
                continue

            # Expand start leftward if boundary falls inside an alphanumeric word
            while start > 0 and text[start - 1].isalnum() and text[start].isalnum():
                start -= 1

            # Expand end rightward if boundary falls inside an alphanumeric word
            while end < text_len and text[end - 1].isalnum() and text[end].isalnum():
                end += 1

            snapped.append({
                "group": group,
                "start": start,
                "end": end,
                "score": float(ent.get("score", 0.0))
            })

        # 2. Merge overlapping or adjacent spans of the SAME entity group
        merged = []
        for ent in snapped:
            if not merged:
                merged.append(ent)
                continue

            prev = merged[-1]
            if ent["group"] == prev["group"]:
                gap = text[prev["end"]:ent["start"]] if ent["start"] >= prev["end"] else ""
                # Directly touching, overlapping, or separated only by whitespace
                if ent["start"] <= prev["end"] or gap.strip() == "":
                    prev["end"] = max(prev["end"], ent["end"])
                    prev["score"] = max(prev["score"], ent["score"])
                    continue

            merged.append(ent)

        # 3. Clean span text, strip trailing/leading punctuation, and deduplicate
        for ent in merged:
            group = ent["group"]
            span_text = text[ent["start"]:ent["end"]]
            cleaned = span_text.strip(chars_to_strip)
            # Normalize internal whitespace
            cleaned = " ".join(cleaned.split())
            if cleaned and cleaned not in extracted_info[group]:
                extracted_info[group].append(cleaned)

        return extracted_info

    def analyze(self, raw_text: str) -> Dict[str, Any]:
        """Runs the complete end-to-end NLP analysis.
        
        Args:
            raw_text: The raw user-submitted string.
            
        Returns:
            A structured dictionary containing language metadata, classification,
            and extracted entities.
        """
        # 1. Preprocess & Extract Language Metadata
        prep_result = self.preprocessor.process(raw_text)
        clean_text = prep_result["cleaned_text"]
        lang = prep_result["language"].upper()
        
        # Default empty output
        extracted_info = {
            "issue": [],
            "location": [],
            "severity": [],
            "timing": [],
            "symptom": []
        }
        
        if not clean_text:
            return {
                "original_text": raw_text,
                "clean_text": clean_text,
                "language": lang,
                "has_code_switching": False,
                "category": "OTHER",
                "confidence": 1.0,
                "extracted_info": extracted_info
            }
            
        # 2. Category Classification
        cls_result = self.classifier(clean_text, truncation=True, max_length=512)[0]
        category = cls_result["label"]
        category_confidence = float(cls_result["score"])
        
        # 3. Entity Extraction
        ner_results = self.ner(clean_text)
        
        # 4. Format Extracted Information with Offset Alignment & Boundary Snapping
        extracted_info = self._postprocess_entities(clean_text, ner_results)
                
        # 5. Construct Final Output Payload
        return {
            "original_text": raw_text,
            "clean_text": clean_text,
            "language": lang,
            "has_code_switching": lang == "MIXED",
            "category": category,
            "confidence": category_confidence,
            "extracted_info": extracted_info
        }
