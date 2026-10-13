"""CivicPulse NLP Service — Health Check Endpoint."""

import time

from fastapi import APIRouter, Request

from app.core.config import settings

router = APIRouter()

# Record application start time (set when this module is first imported).
_start_time = time.time()


@router.get(
    "/nlp/health",
    summary="Health check",
    description="Returns the service health status and whether NLP models are loaded.",
    tags=["System"],
)
@router.get(
    "/health",
    summary="Health check (alias)",
    description="Returns the service health status and whether NLP models are loaded.",
    tags=["System"],
)
async def health_check(request: Request) -> dict:
    """Check if the NLP service is healthy and models are loaded.

    This endpoint is intended for:
    - Teammates verifying the service is running
    - Load balancers / container orchestrators (future)
    - Monitoring dashboards (future)
    """
    uptime_seconds = int(time.time() - _start_time)

    pipeline = getattr(request.app.state, "pipeline", None)
    similarity = getattr(request.app.state, "similarity", None)

    pipeline_loaded = bool(
        pipeline is not None
        and getattr(pipeline, "classifier", None) is not None
        and getattr(pipeline, "ner", None) is not None
    )
    similarity_loaded = bool(
        similarity is not None
        and getattr(similarity, "model", None) is not None
    )

    models_loaded = pipeline_loaded and similarity_loaded
    status = "healthy" if models_loaded else "degraded"

    return {
        "status": status,
        "models_loaded": models_loaded,
        "model_version": settings.model_version,
        "uptime_seconds": uptime_seconds,
        "environment": settings.app_env,
    }
