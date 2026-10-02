"""CivicPulse NLP Service — Main Inference Pipeline.

This orchestrator wires together the preprocessor, text classification model,
and the token classification (NER) model to execute the end-to-end inference
flow, converting a raw user string into a structured JSON payload.
"""

import logging
from pathlib import Path
from typing import Dict, Any

from transformers import pipeline
from app.services.preprocessor import Preprocessor

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent.parent.parent
CLASSIFIER_DIR = BASE_DIR / "models" / "classifier" / "v0.1.0"
NER_DIR = BASE_DIR / "models" / "ner" / "v0.1.0"


class InferencePipeline:
    """End-to-end CivicPulse NLP Pipeline."""

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
        cls_result = self.classifier(clean_text)[0]
        category = cls_result["label"]
        category_confidence = float(cls_result["score"])
        
        # 3. Entity Extraction
        ner_results = self.ner(clean_text)
        
        # 4. Format Extracted Information
        for ent in ner_results:
            group = ent["entity_group"].lower()
            # Clean up the stitched word (sometimes HuggingFace leaves leading spaces '_' or ' ')
            word = ent["word"].replace(" ", "").strip()
            
            if group in extracted_info and word:
                extracted_info[group].append(word)
                
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
