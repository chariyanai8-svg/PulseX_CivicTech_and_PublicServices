FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies (build-essential for compiling some Python packages)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy configuration files
COPY pyproject.toml ./

# Install core runtime dependencies only (excludes dev/training tools to keep image lean)
RUN pip install --no-cache-dir .

# Copy application source code and pre-trained models
COPY app/ ./app/
COPY models/ ./models/

# Set HuggingFace cache directory inside the container
ENV HF_HOME=/app/.cache/huggingface

# Pre-download the SentenceTransformer multilingual model to bake it into the Docker image.
# This ensures the container boots up instantly without needing to download 471MB at runtime.
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')"

# Expose the API port
EXPOSE 8000

# Start the FastAPI server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
