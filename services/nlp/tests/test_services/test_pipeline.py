"""Tests for the main NLP Inference Pipeline."""

import pytest
from app.services.pipeline import InferencePipeline

@pytest.fixture(scope="module")
def nlp_pipeline() -> InferencePipeline:
    return InferencePipeline()

def test_pipeline_end_to_end(nlp_pipeline: InferencePipeline):
    # Test with messy input containing whitespace and code-switching
    text = "   Tolong baiki streetlight depan sekolah rosak teruk dari semalam.   "
    
    result = nlp_pipeline.analyze(text)
    
    # Assert structural integrity of the output JSON payload
    assert "original_text" in result
    assert result["original_text"] == text
    
    assert "clean_text" in result
    assert result["clean_text"] == "Tolong baiki streetlight depan sekolah rosak teruk dari semalam."
    
    assert "language" in result
    assert result["language"] in ["MS", "EN", "MIXED"]
    
    assert "category" in result
    assert isinstance(result["confidence"], float)
    
    assert "extracted_info" in result
    extracted = result["extracted_info"]
    assert isinstance(extracted["location"], list)
    assert isinstance(extracted["issue"], list)
    assert isinstance(extracted["severity"], list)
    assert isinstance(extracted["timing"], list)
    assert isinstance(extracted["symptom"], list)

def test_pipeline_empty_string(nlp_pipeline: InferencePipeline):
    result = nlp_pipeline.analyze("   ")
    
    # Should safely process and return default fallback values rather than crashing
    assert result["clean_text"] == ""
    assert "category" in result
    assert len(result["extracted_info"]["issue"]) == 0
