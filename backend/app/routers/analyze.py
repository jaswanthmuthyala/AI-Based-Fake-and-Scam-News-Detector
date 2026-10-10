from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from ..models.schemas import AnalyzeRequest, AnalyzeResponse, Highlight, Entities, EngineBreakdown, EngineBreakdownItem
from ..models.db import get_db, ScanHistory
from ..services.preprocess import preprocess
from ..services.rules import evaluate_rules
from ..services.ml import evaluate_ml
from ..services.links import evaluate_links
from ..services.fusion import fuse_scores, determine_category
from ..services.llm import get_explanation
from ..services.advice import generate_advice
from ..services.masking import mask_sensitive_data
from ..core.security import get_current_user_id
import uuid
import json

router = APIRouter()

def get_user_id(request: Request):
    session_token = request.cookies.get("session_token")
    return get_current_user_id(session_token)

@router.post("/analyze", response_model=AnalyzeResponse)
def analyze_content(request_data: AnalyzeRequest, request: Request, db: Session = Depends(get_db)):
    user_id = get_user_id(request)
    
    if len(request_data.text) > 5000:
        raise HTTPException(status_code=400, detail="Text exceeds 5000 characters limit.")
    if not request_data.text.strip():
         raise HTTPException(status_code=400, detail="Text cannot be empty.")
        
    # 1. Preprocess
    prep_data = preprocess(request_data.text)
    
    # Determine if it's primarily a URL-only scan
    text_without_urls = request_data.text
    for url in prep_data["entities"]["urls"]:
        text_without_urls = text_without_urls.replace(url, "")
    is_url_only = len(text_without_urls.strip()) < 10 and len(prep_data["entities"]["urls"]) > 0
    
    # 2. Parallel Engines (simulated sequentially here)
    rule_result = evaluate_rules(prep_data["cleaned_text"], is_url_only, request_data.input_type)
    ml_result = evaluate_ml(prep_data["cleaned_text"], is_url_only)
    links_result = evaluate_links(prep_data["cleaned_text"], prep_data["entities"]["urls"])
    
    # 3. Fusion
    has_links = len(prep_data["entities"]["urls"]) > 0
    fusion_result = fuse_scores(rule_result["score"], ml_result["score"], links_result["score"], has_links, is_url_only)
    
    # Add link analyses to breakdown for frontend display
    fusion_result["breakdown"]["links"]["analyses"] = links_result.get("analyses", [])
    
    category = determine_category(fusion_result["risk_score"], rule_result["findings"], request_data.input_type, is_url_only, links_result.get("analyses", []))
    fusion_result["category"] = category
    
    # 4. LLM Explainer
    llm_result = get_explanation(
        request_data.text, 
        prep_data, 
        rule_result["findings"], 
        ml_result, 
        links_result, 
        fusion_result["category"],
        fusion_result["verdict"],
        is_url_only
    )
    
    # 5. Generate Advice
    advice = generate_advice(fusion_result["category"], fusion_result["verdict"])
    
    response_id = str(uuid.uuid4())
    
    # 6. Save History if requested
    if request_data.save_history:
        text_to_save = request_data.text
        if request_data.mask_sensitive:
            text_to_save = mask_sensitive_data(request_data.text)
            
        db_history = ScanHistory(
            id=response_id,
            user_id=user_id,
            input_type=request_data.input_type,
            original_text=text_to_save,
            trust_score=fusion_result["trust_score"],
            verdict=fusion_result["verdict"],
            category=fusion_result["category"],
            language=prep_data["language"],
            explanation=llm_result["explanation"],
            highlights=json.dumps([h for h in llm_result["highlights"]]),
            advice=json.dumps(advice),
            entities=json.dumps(prep_data["entities"]),
            breakdown=json.dumps(fusion_result["breakdown"])
        )
        db.add(db_history)
        db.commit()

    return {
        "id": response_id,
        "trust_score": fusion_result["trust_score"],
        "verdict": fusion_result["verdict"],
        "category": fusion_result["category"],
        "language": prep_data["language"],
        "original_text": request_data.text,
        "highlights": llm_result["highlights"],
        "explanation": llm_result["explanation"],
        "advice": advice,
        "entities": prep_data["entities"],
        "breakdown": fusion_result["breakdown"]
    }
