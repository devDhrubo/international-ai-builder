from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field


class PredictRequest(BaseModel):
    transaction_id: str = Field(..., min_length=1, description="Unique transaction reference")
    sequence: Union[str, List[str]] = Field(
        ...,
        description="Anonymized banking API action sequence (space/newline-joined string or list of action tokens)",
    )
    metadata: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Optional non-identifying simulation metadata for logging",
    )


class PredictResponse(BaseModel):
    transaction_id: str
    model_name: str
    model_version: str
    prediction: str  # "FRAUD" | "LEGITIMATE"
    fraud_probability: float
    legitimate_probability: float
    calibrated_threshold: float
    token_count: int
    max_sequence_length: int
    sequence_preview: str
    latency_ms: float
    timestamp: str


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    model_name: str
    model_version: str
    model_dir: str
    device: str
    max_sequence_length: int
    calibrated_threshold: float
    vocab_size: int
