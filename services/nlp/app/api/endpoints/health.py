"""CivicPulse NLP Service — Health Check Endpoint."""

import time

from fastapi import APIRouter

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
async def health_check() -> dict:
    """Check if the NLP service is healthy and models are loaded.

    This endpoint is intended for:
    - Teammates verifying the service is running
    - Load balancers / container orchestrators (future)
    - Monitoring dashboards (future)
    """
    uptime_seconds = int(time.time() - _start_time)

    # TODO: Check actual model loading status once ModelManager is implemented (Step 12).
    # For now, models_loaded is False since no models are loaded yet.
    models_loaded = False

    status = "healthy" if models_loaded else "degraded"

    return {
        "status": status,
        "models_loaded": models_loaded,
        "model_version": settings.model_version,
        "uptime_seconds": uptime_seconds,
        "environment": settings.app_env,
    }
