"""CivicPulse NLP Service — FastAPI Dependencies.

Shared dependencies injected into endpoint functions via FastAPI's
Depends() mechanism. Model instances will be injected here once
ModelManager is implemented.
"""

# Placeholder — model injection dependencies will be added in Step 12
# when the full pipeline is wired together.
#
# Example (future):
#
#   from app.models.model_manager import ModelManager
#
#   def get_model_manager() -> ModelManager:
#       return app.state.model_manager
