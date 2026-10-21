"""FastAPI routes for the NLP models."""

from fastapi import APIRouter, Request, HTTPException
from app.api.schemas import (
    AnalyzeRequest, AnalyzeResponse,
    EmbedRequest, EmbedResponse,
    SimilarityRequest, SimilarityResponse
)

router = APIRouter()

@router.post("/analyze", response_model=AnalyzeResponse, summary="Analyze civic report")
async def analyze_text(request: Request, payload: AnalyzeRequest):
    """
    Run the end-to-end NLP pipeline on a raw text submission.
    
    This endpoint:
    1. Cleans the text and detects language
    2. Predicts the civic issue category
    3. Extracts relevant entities (locations, severities, etc.)
    """
    pipeline = getattr(request.app.state, "pipeline", None)
    if not pipeline:
        raise HTTPException(status_code=503, detail="NLP pipeline model is not initialized.")
        
    try:
        result = pipeline.analyze(payload.text)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

@router.post("/embed", response_model=EmbedResponse, summary="Get semantic embedding")
async def embed_text(request: Request, payload: EmbedRequest):
    """
    Convert text into a 384-dimensional dense vector using multilingual MiniLM.
    Useful for populating vector databases for semantic search.
    """
    sim_service = getattr(request.app.state, "similarity", None)
    if not sim_service:
        raise HTTPException(status_code=503, detail="Similarity service is not initialized.")
        
    try:
        emb = sim_service.get_embedding(payload.text)
        return {"embedding": emb}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding error: {str(e)}")

@router.post("/similarity", response_model=SimilarityResponse, summary="Compare two reports")
async def compute_similarity(request: Request, payload: SimilarityRequest):
    """
    Compute cosine similarity between two civic reports. 
    Can handle mixed languages seamlessly (e.g. comparing English and Malay).
    """
    sim_service = getattr(request.app.state, "similarity", None)
    if not sim_service:
        raise HTTPException(status_code=503, detail="Similarity service is not initialized.")
        
    try:
        score = sim_service.compute_similarity(payload.text1, payload.text2)
        return {"similarity_score": score}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Similarity computation error: {str(e)}")
