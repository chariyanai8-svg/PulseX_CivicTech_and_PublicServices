"""CivicPulse NLP Service — Text Preprocessing.

Handles text normalisation and basic language detection.
The language detection is used purely for metadata/analytics,
NOT for routing (the XLM-R model handles all languages natively).
"""

import re
import unicodedata
from typing import Dict, Any

class Preprocessor:
    """Handles text cleaning and language detection."""

    def __init__(self):
        # A simple heuristic dictionary to detect language and code-switching.
        # Standard libraries (like langdetect) often fail on Manglish/mixed text.
        # This approach is lightweight and easily adjustable.
        self.ms_markers = {
            "yang", "di", "dan", "ini", "itu", "pada", "ke", "dari", 
            "untuk", "dengan", "kat", "ni", "tu", "dah", "tak", "ada", 
            "buat", "rosak", "jalan", "teruk", "sangat", "banyak", "tolong", "longkang"
        }
        self.en_markers = {
            "the", "is", "in", "and", "to", "of", "it", "that", 
            "on", "for", "with", "this", "are", "very", "too", 
            "broken", "road", "bad", "many", "please", "fix", "pothole", "smelly"
        }

    def clean_text(self, text: str) -> str:
        """Normalize text by cleaning up whitespace and special characters."""
        if not text:
            return ""
            
        # Normalize unicode (e.g. convert full-width chars to standard)
        text = unicodedata.normalize("NFKC", text)
        
        # Remove URLs (often included if users copy-paste locations)
        text = re.sub(r'https?://\S+|www\.\S+', '', text)
        
        # Normalize whitespace (replace tabs/newlines/multiple spaces with single space)
        text = re.sub(r'\s+', ' ', text).strip()
        
        return text

    def detect_language(self, text: str) -> str:
        """Detect language, specifically handling mixed code-switching.
        
        Returns:
            "en", "ms", "mixed", or "unknown"
        """
        if not text:
            return "unknown"

        # Tokenize simply for marker counting
        words = set(re.findall(r'\b[a-z]+\b', text.lower()))
        
        ms_count = len(words.intersection(self.ms_markers))
        en_count = len(words.intersection(self.en_markers))

        # If we see clear markers from both languages, it's mixed
        if ms_count > 0 and en_count > 0:
            return "mixed"
        elif ms_count > 0:
            return "ms"
        elif en_count > 0:
            return "en"
        else:
            return "unknown"

    def process(self, text: str) -> Dict[str, Any]:
        """Run the full preprocessing pipeline on a string."""
        cleaned = self.clean_text(text)
        lang = self.detect_language(cleaned)
        
        return {
            "original_text": text,
            "cleaned_text": cleaned,
            "language": lang
        }
