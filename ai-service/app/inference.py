from datetime import datetime, timezone
import time
import torch

from .model_loader import registry
from .preprocessing import normalize_action_sequence, tokenize_sequence
from .schemas import PredictRequest, PredictResponse


def run_inference(payload: PredictRequest) -> PredictResponse:
    start = time.perf_counter()
    model, tokenizer = registry.get_components()

    sequence_text = normalize_action_sequence(payload.sequence)
    encoded, token_count = tokenize_sequence(
        tokenizer, sequence_text, max_length=registry.max_length
    )

    inputs = {k: v.to(registry.device) for k, v in encoded.items()}

    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits

        if logits.shape[-1] == 1:
            fraud_prob = float(torch.sigmoid(logits.squeeze()).item())
            legit_prob = float(1.0 - fraud_prob)
        else:
            probs = torch.softmax(logits, dim=-1)[0]
            legit_prob = float(probs[0].item())
            fraud_prob = float(probs[1].item())

    prediction = "FRAUD" if fraud_prob >= registry.calibrated_threshold else "LEGITIMATE"
    latency_ms = round((time.perf_counter() - start) * 1000.0, 2)

    preview = sequence_text if len(sequence_text) <= 180 else f"{sequence_text[:177]}..."

    return PredictResponse(
        transaction_id=payload.transaction_id,
        model_name=registry.model_name,
        model_version=registry.model_version,
        prediction=prediction,
        fraud_probability=round(fraud_prob, 6),
        legitimate_probability=round(legit_prob, 6),
        calibrated_threshold=round(registry.calibrated_threshold, 6),
        token_count=token_count,
        max_sequence_length=registry.max_length,
        sequence_preview=preview,
        latency_ms=latency_ms,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )
