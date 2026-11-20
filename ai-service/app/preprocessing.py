from typing import List, Union


def normalize_action_sequence(sequence: Union[str, List[str]]) -> str:
    """Normalize an anonymized banking API action sequence into a clean string."""
    if isinstance(sequence, list):
        tokens = [str(item).strip() for item in sequence if str(item).strip()]
        normalized = " ".join(tokens)
    else:
        normalized = " ".join(str(sequence).split())

    if not normalized:
        raise ValueError("Behavioral action sequence cannot be empty")
    return normalized


def tokenize_sequence(tokenizer, sequence_text: str, max_length: int = 256):
    """Tokenize using the exact DistilBERT tokenizer with max_length=256."""
    encoded = tokenizer(
        sequence_text,
        truncation=True,
        max_length=max_length,
        padding="max_length",
        return_tensors="pt",
    )
    non_pad_tokens = int((encoded["attention_mask"][0] == 1).sum().item())
    return encoded, non_pad_tokens
