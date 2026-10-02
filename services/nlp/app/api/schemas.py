"""Pydantic schemas for NLP API endpoints."""

from pydantic import BaseModel, Field
from typing import Dict, List

class AnalyzeRequest(BaseModel):
    text: str = Field(..., description="The raw civic issue report text submitted by the user.", example="Jalan berlubang sangat teruk depan kedai runcit.")

class AnalyzeResponse(BaseModel):
    original_text: str
    clean_text: str
    language: str = Field(..., description="Detected language (MS, EN, MIXED, or UNKNOWN)")
    has_code_switching: bool
    category: str
    confidence: float
    extracted_info: Dict[str, List[str]] = Field(
        ..., 
        description="Extracted entities grouped by type: issue, location, severity, timing, symptom"
    )

class EmbedRequest(BaseModel):
    text: str = Field(..., description="Text to encode into a vector.", example="Pothole on main street.")

class EmbedResponse(BaseModel):
    embedding: List[float] = Field(..., description="384-dimensional dense vector representation.")

class SimilarityRequest(BaseModel):
    text1: str = Field(..., example="There is a pothole on the road")
    text2: str = Field(..., example="Terdapat lubang di jalan raya")

class SimilarityResponse(BaseModel):
    similarity_score: float = Field(..., description="Cosine similarity between -1.0 and 1.0. Higher means more similar.")
