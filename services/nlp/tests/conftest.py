"""CivicPulse NLP Service — Test Configuration.

Shared pytest fixtures used across all test modules.
"""

import pytest
from fastapi.testclient import TestClient

from app.main import create_app


@pytest.fixture
def client() -> TestClient:
    """Create a test client with a fresh FastAPI app instance.

    Uses the synchronous TestClient (from Starlette) which handles
    the async lifespan context automatically.
    """
    app = create_app()
    with TestClient(app) as test_client:
        yield test_client
