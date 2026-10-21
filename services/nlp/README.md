# CivicPulse NLP Service

NLP backend module for the CivicPulse civic issue platform. Provides text classification, entity extraction, and semantic similarity for civic reports written in English, Bahasa Malaysia, and mixed-language input.

## Quick Start

### Prerequisites

- Python 3.11+
- pip

### Setup

```bash
# Navigate to the NLP service directory
cd services/nlp

# Create a virtual environment
python -m venv .venv

# Activate the virtual environment
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install runtime + dev dependencies
pip install -e ".[dev]"

# Copy environment template
copy .env.example .env        # Windows
# cp .env.example .env        # macOS/Linux
```

### Run the Service

```bash
uvicorn app.main:app --reload --port 8000
```

Then open: [http://localhost:8000/docs](http://localhost:8000/docs) for the interactive API documentation.

### Run Tests

```bash
pytest -v
```

## Project Structure

```
services/nlp/
├── app/                  # FastAPI application (runtime)
│   ├── api/              # API endpoints
│   ├── core/             # Configuration, logging
│   ├── models/           # ML model wrapper classes
│   ├── schemas/          # Pydantic request/response models
│   ├── services/         # Business logic / NLP pipeline
│   └── utils/            # Utilities
├── training/             # Offline model training pipeline
│   ├── data/             # Datasets (raw, processed, annotations)
│   ├── scripts/          # Training, evaluation scripts
│   └── configs/          # Hyperparameter configs
├── models/               # Trained model weights (git-ignored)
├── tests/                # Unit and integration tests
└── scripts/              # Utility scripts
```

## API Endpoints

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/nlp/health` | Health check | ✅ Available |
| POST | `/nlp/analyze` | Classify + extract entities | 🚧 Coming |
| POST | `/nlp/embed` | Generate embedding vector | 🚧 Coming |
| POST | `/nlp/similarity` | Compare text similarity | 🚧 Coming |

## Models

| Model | Purpose | Base | Status |
|-------|---------|------|--------|
| Category Classifier | Classify reports into 11 civic categories | XLM-RoBERTa base | 🚧 Not trained |
| Entity Extractor | Extract issue, location, severity, timing | XLM-RoBERTa base (NER) | 🚧 Not trained |
| Embedding Model | Semantic similarity embeddings | paraphrase-multilingual-MiniLM-L12-v2 | 🚧 Not downloaded |

## Integration

This service runs as a standalone HTTP API. The main CivicPulse backend calls it via HTTP:

```
Main Backend  ──POST /nlp/analyze──▶  NLP Service (port 8000)
              ◀──structured JSON────
```

The NLP service does NOT access the database, authenticate users, or make routing decisions. It only provides language understanding.

## Team

This module is maintained as part of the CivicPulse university project.
