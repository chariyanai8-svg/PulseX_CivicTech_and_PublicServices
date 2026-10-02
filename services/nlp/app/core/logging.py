"""CivicPulse NLP Service — Logging Configuration."""

import logging
import sys

from app.core.config import settings


def setup_logging() -> None:
    """Configure application-wide logging.

    Uses standard Python logging. In production, structured JSON logging
    can be added here without changing any calling code.
    """
    log_level = getattr(logging, settings.app_log_level.upper(), logging.INFO)

    # Root logger configuration
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
        handlers=[logging.StreamHandler(sys.stdout)],
        force=True,
    )

    # Reduce noise from third-party libraries
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("transformers").setLevel(logging.WARNING)
    logging.getLogger("sentence_transformers").setLevel(logging.WARNING)
