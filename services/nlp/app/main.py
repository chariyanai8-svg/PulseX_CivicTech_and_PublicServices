"""CivicPulse NLP Service — FastAPI Application Entry Point.

This module creates and configures the FastAPI application.
Models are loaded during the application lifespan (startup).

To run locally:
    cd services/nlp
    uvicorn app.main:app --reload --port 8000

To run in production:
    uvicorn app.main:app --host 0.0.0.0 --port 8000
"""

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import settings
from app.core.logging import setup_logging

logger = logging.getLogger(__name__)


from app.services.pipeline import InferencePipeline
from app.services.similarity import SemanticSimilarity

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan manager.

    Startup: load NLP models into memory.
    Shutdown: release model resources.

    Using lifespan (not @app.on_event) because on_event is deprecated
    in modern FastAPI.
    """
    # --- Startup ---
    setup_logging()
    logger.info("CivicPulse NLP Service starting up...")
    logger.info("Environment: %s", settings.app_env)
    logger.info("Model version: %s", settings.model_version)

    try:
        app.state.pipeline = InferencePipeline()
        app.state.similarity = SemanticSimilarity()
        logger.info("NLP models loaded successfully!")
    except Exception as e:
        logger.error(f"Failed to load NLP models: {e}")
        app.state.pipeline = None
        app.state.similarity = None

    logger.info("NLP Service ready at http://%s:%d", settings.app_host, settings.app_port)
    logger.info("API docs available at http://%s:%d/docs", settings.app_host, settings.app_port)

    yield  # Application runs here

    # --- Shutdown ---
    logger.info("CivicPulse NLP Service shutting down...")
    app.state.pipeline = None
    app.state.similarity = None


def create_app() -> FastAPI:
    """Create and configure the FastAPI application.

    This factory pattern makes testing easier — tests can call
    create_app() to get a fresh application instance.
    """
    app = FastAPI(
        title="CivicPulse NLP Service",
        description=(
            "NLP backend for the CivicPulse civic issue platform. "
            "Provides text classification, entity extraction, and "
            "semantic similarity for civic reports in English, "
            "Bahasa Malaysia, and mixed-language input."
        ),
        version=settings.model_version,
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # --- CORS ---
    # NOTE: Authentication is NOT handled here. Another team member
    # or an API gateway should handle auth. To add auth middleware:
    #   app.add_middleware(AuthMiddleware, ...)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # --- Routes ---
    app.include_router(api_router)

    return app


# Application instance — used by uvicorn.
app = create_app()
