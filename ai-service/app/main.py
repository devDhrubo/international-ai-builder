from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .inference import run_inference
from .model_loader import registry
from .schemas import HealthResponse, PredictRequest, PredictResponse


@asynccontextmanager
async def lifespan(app: FastAPI):
    registry.load()
    yield


app = FastAPI(
    title="FraudShield DistilBERT Inference Service",
    description="Independent FastAPI inference wrapper for the trained DistilBERT behavioral fraud detection model.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    vocab_size = len(registry.tokenizer) if registry.tokenizer is not None else 0
    return HealthResponse(
        status="healthy" if registry.is_ready() else "unhealthy",
        model_loaded=registry.is_ready(),
        model_name=registry.model_name,
        model_version=registry.model_version,
        model_dir=str(registry.model_dir),
        device=str(registry.device),
        max_sequence_length=registry.max_length,
        calibrated_threshold=registry.calibrated_threshold,
        vocab_size=vocab_size,
    )


@app.post("/api/v1/predict", response_model=PredictResponse)
def predict(request: PredictRequest) -> PredictResponse:
    if not registry.is_ready():
        raise HTTPException(status_code=503, detail="DistilBERT model is not loaded")
    try:
        return run_inference(request)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Inference failed: {exc}") from exc
