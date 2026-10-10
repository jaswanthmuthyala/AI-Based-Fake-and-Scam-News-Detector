from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from ..models.schemas import HistoryResponse, StatsResponse
from ..models.db import get_db, ScanHistory
from ..core.security import get_current_user_id
import json

router = APIRouter()

def get_user_id(request: Request):
    session_token = request.cookies.get("session_token")
    return get_current_user_id(session_token)

@router.get("/history", response_model=List[HistoryResponse])
def get_history(request: Request, db: Session = Depends(get_db)):
    user_id = get_user_id(request)
    records = db.query(ScanHistory).filter(ScanHistory.user_id == user_id).order_by(ScanHistory.created_at.desc()).limit(100).all()
    results = []
    for r in records:
        results.append({
            "id": r.id,
            "created_at": r.created_at.isoformat(),
            "trust_score": r.trust_score,
            "verdict": r.verdict,
            "category": r.category,
            "language": r.language,
            "original_text": r.original_text,
            "highlights": json.loads(r.highlights),
            "explanation": r.explanation,
            "advice": json.loads(r.advice),
            "entities": json.loads(r.entities),
            "breakdown": json.loads(r.breakdown)
        })
    return results

@router.delete("/history")
def clear_history(request: Request, db: Session = Depends(get_db)):
    user_id = get_user_id(request)
    db.query(ScanHistory).filter(ScanHistory.user_id == user_id).delete()
    db.commit()
    return {"status": "success", "message": "History cleared"}

@router.get("/stats", response_model=StatsResponse)
def get_stats(request: Request, db: Session = Depends(get_db)):
    user_id = get_user_id(request)
    total = db.query(ScanHistory).filter(ScanHistory.user_id == user_id).count()
    if total == 0:
        return {
            "total_scans": 0,
            "scams_caught": 0,
            "average_trust_score": 0,
            "most_common_category": "None",
            "verdict_counts": {"Safe": 0, "Suspicious": 0, "Dangerous": 0},
            "category_counts": {}
        }
        
    scams = db.query(ScanHistory).filter(ScanHistory.user_id == user_id, ScanHistory.verdict == "Dangerous").count()
    avg_score = db.query(func.avg(ScanHistory.trust_score)).filter(ScanHistory.user_id == user_id).scalar()
    
    most_common_cat = db.query(ScanHistory.category, func.count(ScanHistory.category).label('c')) \
                        .filter(ScanHistory.user_id == user_id) \
                        .group_by(ScanHistory.category).order_by(func.count(ScanHistory.category).desc()).first()
                        
    verdicts = db.query(ScanHistory.verdict, func.count(ScanHistory.verdict)).filter(ScanHistory.user_id == user_id).group_by(ScanHistory.verdict).all()
    verdict_counts = {v: c for v, c in verdicts}
    
    categories = db.query(ScanHistory.category, func.count(ScanHistory.category)).filter(ScanHistory.user_id == user_id).group_by(ScanHistory.category).all()
    category_counts = {v: c for v, c in categories}
    
    return {
        "total_scans": total,
        "scams_caught": scams,
        "average_trust_score": round(avg_score, 1) if avg_score else 0,
        "most_common_category": most_common_cat[0] if most_common_cat else "None",
        "verdict_counts": {
            "Safe": verdict_counts.get("Safe", 0),
            "Suspicious": verdict_counts.get("Suspicious", 0),
            "Dangerous": verdict_counts.get("Dangerous", 0)
        },
        "category_counts": category_counts
    }
