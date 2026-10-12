"""Tests for the health check endpoint."""

from fastapi.testclient import TestClient


def test_health_returns_200(client: TestClient) -> None:
    """Health endpoint should return 200 even when models aren't loaded."""
    response = client.get("/nlp/health")
    assert response.status_code == 200


def test_health_alias_root_returns_200(client: TestClient) -> None:
    """Root alias /health should also return 200."""
    response = client.get("/health")
    assert response.status_code == 200


def test_health_response_structure(client: TestClient) -> None:
    """Health response should contain all expected fields."""
    response = client.get("/nlp/health")
    data = response.json()

    assert "status" in data
    assert "models_loaded" in data
    assert "model_version" in data
    assert "uptime_seconds" in data
    assert "environment" in data


def test_health_models_not_loaded_yet(client: TestClient) -> None:
    """Before models are trained, models_loaded should be False."""
    response = client.get("/nlp/health")
    data = response.json()

    assert data["models_loaded"] is False
    assert data["status"] == "degraded"


def test_health_shows_model_version(client: TestClient) -> None:
    """Health should report the configured model version."""
    response = client.get("/nlp/health")
    data = response.json()

    assert data["model_version"] is not None
    assert isinstance(data["model_version"], str)


def test_health_uptime_is_non_negative(client: TestClient) -> None:
    """Uptime should be a non-negative integer."""
    response = client.get("/nlp/health")
    data = response.json()

    assert isinstance(data["uptime_seconds"], int)
    assert data["uptime_seconds"] >= 0
