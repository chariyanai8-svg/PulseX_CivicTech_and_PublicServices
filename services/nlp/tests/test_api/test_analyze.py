"""Tests for the NLP API endpoints."""

import pytest
from fastapi.testclient import TestClient

from app.main import app

# Create a test client. The context manager triggers the lifespan events,
# which loads the NLP models into memory.
@pytest.fixture(scope="module")
def client() -> TestClient:
    with TestClient(app) as client:
        yield client

def test_analyze_endpoint(client: TestClient):
    response = client.post(
        "/nlp/analyze",
        json={"text": "Jalan berlubang dan berbahaya depan sekolah."}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert "clean_text" in data
    assert data["language"] in ["MS", "EN", "MIXED"]
    assert "category" in data
    assert isinstance(data["confidence"], float)
    assert "extracted_info" in data
    assert "issue" in data["extracted_info"]

def test_embed_endpoint(client: TestClient):
    response = client.post(
        "/nlp/embed",
        json={"text": "Pothole problem"}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert "embedding" in data
    assert len(data["embedding"]) == 384
    assert isinstance(data["embedding"][0], float)

def test_similarity_endpoint(client: TestClient):
    response = client.post(
        "/nlp/similarity",
        json={
            "text1": "Pothole on the road",
            "text2": "Jalan berlubang"
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert "similarity_score" in data
    assert data["similarity_score"] > 0.5  # Should be highly similar cross-lingual

def test_analyze_long_text_truncation(client: TestClient):
    long_text = "Jalan berlubang dan berbahaya dekat simpang ini. " * 50
    response = client.post("/nlp/analyze", json={"text": long_text})
    assert response.status_code == 200
    data = response.json()
    assert "category" in data
    assert data["category"] is not None
