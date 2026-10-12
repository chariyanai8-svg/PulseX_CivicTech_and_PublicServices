# CivicPulse NLP Engine — Integration Guide

Welcome to the NLP engine! This microservice provides machine learning intelligence to the rest of the CivicPulse platform. It handles text classification, Named Entity Recognition (NER), and semantic embeddings. 

This guide is for frontend and backend teammates who need to consume the NLP APIs.

## 🚀 Running the Service

You do not need to install Python or PyTorch on your machine to use this! We have Dockerized the entire pipeline.

Make sure you have Docker Desktop installed, then run:
```bash
docker-compose up --build -d
```
The service will be available at `http://localhost:8000`. 
Interactive API documentation (Swagger UI) is available at `http://localhost:8000/docs`.

---

## 📡 API Endpoints

All NLP routes are mounted directly under `/nlp`:
- `GET  /nlp/health` (also accessible at `/health`): Service health status and uptime
- `POST /nlp/analyze`: Text classification and information extraction
- `POST /nlp/similarity`: Compare semantic similarity between two civic reports
- `POST /nlp/embed`: Dense 384-dimensional vector embedding

### 1. Analyze a Civic Report

Extracts categories and specific issue entities from raw text. This handles code-switched text (English/Bahasa Malaysia) natively.

**Endpoint:** `POST /nlp/analyze`

**Request:**
```json
{
  "text": "Jalan berlubang dan bahaya sangat depan sekolah. Tolong repair."
}
```

**Response:**
```json
{
  "original_text": "Jalan berlubang dan bahaya sangat depan sekolah. Tolong repair.",
  "clean_text": "Jalan berlubang dan bahaya sangat depan sekolah. Tolong repair.",
  "language": "MIXED",
  "has_code_switching": true,
  "category": "ROADS",
  "confidence": 0.998,
  "extracted_info": {
    "issue": ["Jalan berlubang", "repair"],
    "location": ["sekolah"],
    "severity": ["bahaya sangat"],
    "timing": [],
    "symptom": []
  }
}
```

### 2. Compare Semantic Similarity

Useful for checking if a newly submitted report is a duplicate of an existing report.

**Endpoint:** `POST /nlp/similarity`

**Request:**
```json
{
  "text1": "There is a massive pothole in front of the school.",
  "text2": "Jalan berlubang dan bahaya sangat depan sekolah."
}
```

**Response:**
```json
{
  "similarity_score": 0.8923
}
```
*(Scores above 0.75 generally indicate highly similar semantic meaning, even across languages).*

### 3. Generate Vector Embedding

Converts a string of text into a 384-dimensional array of floats. Useful if you want to store representations in a vector database (like pgvector) for semantic search.

**Endpoint:** `POST /nlp/embed`

**Request:**
```json
{
  "text": "Flooded street"
}
```

**Response:**
```json
{
  "embedding": [0.123, -0.456, 0.789, ...] 
}
```

## 🧠 Model Pipeline Details
- **Classification & NER**: Fine-tuned `xlm-roberta-base`.
- **Similarity/Embeddings**: `paraphrase-multilingual-MiniLM-L12-v2`.
- **Text preprocessing**: Light heuristics handle URL stripping and language detection to reduce model hallucination.
