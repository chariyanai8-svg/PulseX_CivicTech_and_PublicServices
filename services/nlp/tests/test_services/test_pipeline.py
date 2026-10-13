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

def test_pipeline_ner_entity_boundaries(nlp_pipeline: InferencePipeline):
    """Verify v0.2.0 NER disentangles action verbs from location entities."""
    text = "Tolong baiki lampu jalan rosak teruk di Jalan SS2 semalam."
    result = nlp_pipeline.analyze(text)

    assert result["category"] == "LIGHTING"
    # Action verb must not be collapsed into location entity
    for loc in result["extracted_info"]["location"]:
        assert "Tolong" not in loc
        assert "baiki" not in loc

    # Verify correct entity extraction
    assert any("SS2" in loc for loc in result["extracted_info"]["location"])
    assert any("lampu" in issue for issue in result["extracted_info"]["issue"])
    assert any("semalam" in t for t in result["extracted_info"]["timing"])

def test_pipeline_obstruction_classification(nlp_pipeline: InferencePipeline):
    """Verify v0.2.0 classifies vehicle blockage as OBSTRUCTION rather than HAZARD."""
    text = "Kenderaan rosak ditinggalkan menghalang laluan keluar masuk lorong."
    result = nlp_pipeline.analyze(text)
    assert result["category"] == "OBSTRUCTION"

def test_pipeline_other_signboard_classification(nlp_pipeline: InferencePipeline):
    """Verify v0.2.0 classifies faded signboard as OTHER rather than FALLEN_TREES."""
    text = "Permohonan semakan papan tanda nama taman yang telah pudar."
    result = nlp_pipeline.analyze(text)
    assert result["category"] == "OTHER"

