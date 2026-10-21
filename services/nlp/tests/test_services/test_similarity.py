"""Tests for the Semantic Similarity module."""

import pytest
from app.services.similarity import SemanticSimilarity

# We use module scope so we only download/load the model once for all tests
@pytest.fixture(scope="module")
def similarity_service() -> SemanticSimilarity:
    return SemanticSimilarity("paraphrase-multilingual-MiniLM-L12-v2")

def test_get_embedding_returns_correct_dimension(similarity_service: SemanticSimilarity):
    text = "Tolong perbaiki jalan ini."
    embedding = similarity_service.get_embedding(text)
    
    # Check that it's a list of floats
    assert isinstance(embedding, list)
    assert len(embedding) > 0
    assert isinstance(embedding[0], float)
    
    # MiniLM-L12 generates 384-dimensional vectors
    assert len(embedding) == 384

def test_get_embedding_empty_string(similarity_service: SemanticSimilarity):
    embedding = similarity_service.get_embedding("   ")
    assert embedding == []

def test_cross_lingual_similarity(similarity_service: SemanticSimilarity):
    """Test that translations of the same concept get a high similarity score."""
    en_text = "There is a large pothole on the road"
    ms_text = "Terdapat lubang besar di jalan raya"
    mixed_text = "Ada pothole besar gila kat jalan"
    
    unrelated = "The streetlight is broken and blinking"
    
    # Compute similarity between exact translations
    sim_en_ms = similarity_service.compute_similarity(en_text, ms_text)
    sim_en_mixed = similarity_service.compute_similarity(en_text, mixed_text)
    
    # Compute similarity with unrelated text
    sim_unrelated = similarity_service.compute_similarity(en_text, unrelated)
    
    # The matching concepts should be much more similar than the unrelated one
    assert sim_en_ms > sim_unrelated
    assert sim_en_mixed > sim_unrelated
    
    # Multilingual models generally score translations very high (>0.7)
    assert sim_en_ms > 0.7
    assert sim_en_mixed > 0.7

def test_compute_similarity_empty_string(similarity_service: SemanticSimilarity):
    assert similarity_service.compute_similarity("", "test") == 0.0
    assert similarity_service.compute_similarity("test", "   ") == 0.0
