"""CivicPulse NLP Service — API Router.

Mounts all endpoint routers under a single root router.
New endpoints are added here as the project progresses.
"""

from fastapi import APIRouter

from app.api.endpoints import health

# Root router — all endpoint routers are included here.
api_router = APIRouter()

# --- System endpoints ---
api_router.include_router(health.router)

# --- NLP endpoints ---
from app.api.endpoints import analyze
api_router.include_router(analyze.router, prefix="/nlp")
