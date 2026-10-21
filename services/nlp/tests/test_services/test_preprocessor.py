"""Tests for the text preprocessor pipeline."""

import pytest
from app.services.preprocessor import Preprocessor

@pytest.fixture
def preprocessor() -> Preprocessor:
    return Preprocessor()

def test_clean_text_removes_extra_whitespace(preprocessor: Preprocessor):
    text = "  Jalan   berlubang \n\n sangat   teruk  "
    assert preprocessor.clean_text(text) == "Jalan berlubang sangat teruk"

def test_clean_text_removes_urls(preprocessor: Preprocessor):
    text = "Pothole here https://maps.google.com/123 please fix"
    assert preprocessor.clean_text(text) == "Pothole here please fix"
    
    text2 = "Check www.example.com for info"
    assert preprocessor.clean_text(text2) == "Check for info"

def test_clean_text_normalizes_unicode(preprocessor: Preprocessor):
    # Full-width characters often typed by mistake
    text = "Ｊａｌａｎ rosak"
    assert preprocessor.clean_text(text) == "Jalan rosak"

def test_detect_language_english(preprocessor: Preprocessor):
    assert preprocessor.detect_language("The road is very bad") == "en"
    assert preprocessor.detect_language("Please fix this broken streetlight") == "en"

def test_detect_language_malay(preprocessor: Preprocessor):
    assert preprocessor.detect_language("Jalan kat sini rosak teruk") == "ms"
    assert preprocessor.detect_language("Lampu jalan tak menyala dari semalam") == "ms"

def test_detect_language_mixed(preprocessor: Preprocessor):
    assert preprocessor.detect_language("Pothole ni bahaya sangat") == "mixed"
    assert preprocessor.detect_language("The longkang is tersumbat and very smelly") == "mixed"
    assert preprocessor.detect_language("Tolong fix streetlight tu") == "mixed"

def test_detect_language_unknown(preprocessor: Preprocessor):
    assert preprocessor.detect_language("??? 12345") == "unknown"

def test_process_pipeline(preprocessor: Preprocessor):
    result = preprocessor.process("  Pothole ni sangat teruk http://link.com  ")
    assert result["cleaned_text"] == "Pothole ni sangat teruk"
    assert result["language"] == "mixed"
    assert result["original_text"] == "  Pothole ni sangat teruk http://link.com  "
