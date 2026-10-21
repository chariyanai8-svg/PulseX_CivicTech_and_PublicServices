"""CivicPulse NLP Service — Semantic Similarity.

Wraps the SentenceTransformers library to generate dense vector embeddings
and compute cosine similarities between civic reports.
"""

from typing import List
import torch
from sentence_transformers import SentenceTransformer, util

class SemanticSimilarity:
    """Generates embeddings and computes similarities for multilingual text."""

    def __init__(self, model_name: str = "paraphrase-multilingual-MiniLM-L12-v2"):
        """Initialize the sentence transformer model.
        
        Args:
            model_name: The HuggingFace model hub name. Defaults to the fast multilingual MiniLM.
        """
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        # sentence-transformers automatically downloads and caches the model
        self.model = SentenceTransformer(model_name, device=self.device)

    @property
    def is_loaded(self) -> bool:
        """Returns True if the similarity model is loaded."""
        return self.model is not None
        
    def get_embedding(self, text: str) -> List[float]:
        """Generates a dense vector embedding for the input text.
        
        Args:
            text: The civic report string.
            
        Returns:
            A list of floats representing the embedding vector.
        """
        if not text.strip():
            return []
        
        # The model returns a numpy array by default
        embedding = self.model.encode(text, convert_to_numpy=True)
        # Convert to standard Python float list so it can be serialized directly into JSON by FastAPI
        return embedding.tolist()
        
    def compute_similarity(self, text1: str, text2: str) -> float:
        """Computes cosine similarity between two text strings.
        
        Args:
            text1: The first text string.
            text2: The second text string.
            
        Returns:
            A float between -1.0 and 1.0 (though practically 0.0 to 1.0 for these embeddings)
        """
        if not text1.strip() or not text2.strip():
            return 0.0
            
        # We need PyTorch tensors to use the built-in util.cos_sim
        emb1 = self.model.encode(text1, convert_to_tensor=True)
        emb2 = self.model.encode(text2, convert_to_tensor=True)
        
        # Compute cosine similarity
        cosine_score = util.cos_sim(emb1, emb2)
        
        # Extract the scalar float value
        return float(cosine_score[0][0].item())
