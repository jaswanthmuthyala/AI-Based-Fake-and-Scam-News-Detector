
import json
from collections import Counter
from datetime import datetime, timezone
from typing import Any, Dict, List

from fastapi import APIRouter, Request

from ..core.security import get_current_user_id, get_token_from_request
from ..models.schemas import HistoryResponse, StatsResponse
from ..mongodb import scan_history_collection

router = APIRouter()


def get_user_id(request: Request) -> str:
    session_token = get_token_from_request(request)
    return get_current_user_id(session_token)


def serialize_scan(record: Dict[str, Any]) -> Dict[str, Any]:
    """Ensures every single field required by HistoryResponse is properly formatted."""
    created_at_val = record.get("created_at")
    if isinstance(created_at_val, datetime):
        created_at_str = created_at_val.isoformat()
    elif created_at_val:
        created_at_str = str(created_at_val)
    else:
        created_at_str = datetime.now(timezone.utc).isoformat()

    highlights = record.get("highlights", [])
    if isinstance(highlights, str):
        try:
            highlights = json.loads(highlights)
        except Exception:
            highlights = []
    if not isinstance(highlights, list):
        highlights = []

    advice = record.get("advice", [])
    if isinstance(advice, str):
        try:
            advice = json.loads(advice)
        except Exception:
            advice = []
    if not isinstance(advice, list):
        advice = []

    entities = record.get("entities", {})
    if isinstance(entities, str):
        try:
            entities = json.loads(entities)
        except Exception:
            entities = {}
    if not isinstance(entities, dict):
        entities = {}
    entities.setdefault("urls", [])
    entities.setdefault("phone_numbers", [])
    entities.setdefault("upi_ids", [])
    entities.setdefault("amounts", [])

    breakdown = record.get("breakdown", {})
    if isinstance(breakdown, str):
        try:
            breakdown = json.loads(breakdown)
        except Exception:
            breakdown = {}
    if not isinstance(breakdown, dict):
        breakdown = {}

    # Guarantee engine items exist
    for engine_key in ("rules", "ml", "links"):
        if engine_key not in breakdown or not isinstance(breakdown[engine_key], dict):
            breakdown[engine_key] = {
                "weight": 0,
                "score": 0,
                "contribution": 0.0,
                "reason": None,
                "analyses": [] if engine_key == "links" else None,
            }

    return {
        "id": str(record.get("id", "")),
        "created_at": created_at_str,
        "trust_score": int(record.get("trust_score", 0)),
        "verdict": str(record.get("verdict", "Suspicious")),
        "category": str(record.get("category", "General")),
        "language": str(record.get("language", "en")),
        "original_text": str(record.get("original_text", "")),
        "highlights": highlights,
        "explanation": str(record.get("explanation", "")),
        "advice": advice,
        "entities": entities,
        "breakdown": breakdown,
        "secondary_categories": record.get("secondary_categories") or [],
        "confidence": str(record.get("confidence", "Standard")),
        "claims_requiring_verification": record.get("claims_requiring_verification") or [],
        "verification_status": str(
            record.get(
                "verification_status",
                "Assessed from text. Factual verification not performed.",
            )
        ),
    }


@router.get("/history", response_model=List[HistoryResponse])
def get_history(request: Request):
    user_id = get_user_id(request)
    records = scan_history_collection.find(
        {"user_id": user_id}
    ).sort("created_at", -1).limit(100)

    return [serialize_scan(record) for record in records]


@router.delete("/history")
def clear_history(request: Request):
    user_id = get_user_id(request)
    scan_history_collection.delete_many({"user_id": user_id})
    return {"status": "success", "message": "History cleared"}


@router.get("/stats", response_model=StatsResponse)
def get_stats(request: Request):
    user_id = get_user_id(request)
    records = list(scan_history_collection.find({"user_id": user_id}))

    if not records:
        return {
            "total_scans": 0,
            "scams_caught": 0,
            "average_trust_score": 0.0,
            "most_common_category": "None",
            "verdict_counts": {"Safe": 0, "Suspicious": 0, "Dangerous": 0},
            "category_counts": {},
        }

    verdict_counts = Counter(r.get("verdict", "Unknown") for r in records)
    category_counts = Counter(r.get("category", "Unknown") for r in records)
    average_score = sum(r.get("trust_score", 0) for r in records) / len(records)

    return {
        "total_scans": len(records),
        "scams_caught": verdict_counts.get("Dangerous", 0),
        "average_trust_score": round(average_score, 1),
        "most_common_category": category_counts.most_common(1)[0][0],
        "verdict_counts": {
            "Safe": verdict_counts.get("Safe", 0),
            "Suspicious": verdict_counts.get("Suspicious", 0),
            "Dangerous": verdict_counts.get("Dangerous", 0),
        },
        "category_counts": dict(category_counts),
    }

