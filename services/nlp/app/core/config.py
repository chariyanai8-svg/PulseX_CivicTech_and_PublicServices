"""CivicPulse NLP Service — Application Configuration.

All settings are loaded from environment variables (or .env file).
See .env.example for the full list of configurable values.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables.

    Pydantic-settings automatically reads from the .env file and
    environment variables. Environment variables take precedence.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # --- Application ---
    app_env: str = "development"
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    app_log_level: str = "INFO"

    # --- Model Paths ---
    model_classifier_path: str = "models/classifier/v0.1.0"
    model_extractor_path: str = "models/extractor/v0.1.0"
    model_embedder_path: str = "models/embedder/v0.1.0"

    # --- Model Version ---
    model_version: str = "0.1.0"

    # --- Confidence Thresholds ---
    confidence_high_threshold: float = 0.7
    confidence_low_threshold: float = 0.4

    # --- Input Constraints ---
    max_input_length: int = 2000
    max_similarity_targets: int = 50

    # --- CORS ---
    cors_origins: str = "*"

    @property
    def cors_origin_list(self) -> list[str]:
        """Parse comma-separated CORS origins into a list."""
        return [origin.strip() for origin in self.cors_origins.split(",")]


# Singleton instance — import this wherever settings are needed.
settings = Settings()
