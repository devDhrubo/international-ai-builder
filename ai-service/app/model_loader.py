import os
import json
from pathlib import Path
from typing import Optional, Tuple
import torch
from transformers import AutoTokenizer, DistilBertForSequenceClassification


DEFAULT_MODEL_DIR = Path(__file__).resolve().parents[2] / "fraud_artifacts" / "distilbert"
METRICS_PATH = Path(__file__).resolve().parents[2] / "fraud_artifacts" / "metrics.json"


class ModelRegistry:
    def __init__(self) -> None:
        self.model: Optional[DistilBertForSequenceClassification] = None
        self.tokenizer = None
        self.device: torch.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model_dir: Path = Path(os.environ.get("MODEL_DIR", str(DEFAULT_MODEL_DIR)))
        self.model_name: str = "DistilBERT"
        self.model_version: str = "distilbert-behavioral-v1"
        self.max_length: int = 256
        self.calibrated_threshold: float = 0.4375680983066559

    def load(self) -> None:
        if not self.model_dir.exists():
            raise FileNotFoundError(f"DistilBERT model directory not found: {self.model_dir}")

        if METRICS_PATH.exists():
            try:
                metrics = json.loads(METRICS_PATH.read_text(encoding="utf-8"))
                distil_metrics = metrics.get("text_models", {}).get("DistilBERT", {})
                if "threshold" in distil_metrics:
                    self.calibrated_threshold = float(distil_metrics["threshold"])
            except Exception:
                pass

        self.tokenizer = AutoTokenizer.from_pretrained(str(self.model_dir), local_files_only=True)
        self.model = DistilBertForSequenceClassification.from_pretrained(
            str(self.model_dir), local_files_only=True
        )
        self.model.to(self.device)
        self.model.eval()

    def is_ready(self) -> bool:
        return self.model is not None and self.tokenizer is not None

    def get_components(self) -> Tuple[DistilBertForSequenceClassification, object]:
        if not self.is_ready():
            raise RuntimeError("DistilBERT model is not loaded")
        return self.model, self.tokenizer


registry = ModelRegistry()
