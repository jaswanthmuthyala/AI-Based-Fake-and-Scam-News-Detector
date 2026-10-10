from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class Highlight(BaseModel):
    phrase: str
    start: int = 0
    end: int = 0
    reason: str

class Entities(BaseModel):
    urls: List[str]
    phone_numbers: List[str]
    upi_ids: List[str]
    amounts: List[str]

class EngineBreakdownItem(BaseModel):
    weight: int
    score: int
    contribution: float
    reason: Optional[str] = None

class EngineBreakdown(BaseModel):
    rules: EngineBreakdownItem
    ml: EngineBreakdownItem
    links: EngineBreakdownItem

class AnalyzeRequest(BaseModel):
    text: str
    input_type: str  # message, news, link
    save_history: bool = False
    mask_sensitive: bool = False

class AnalyzeResponse(BaseModel):
    id: str
    trust_score: int
    verdict: str
    category: str
    language: str
    original_text: str
    highlights: List[Highlight]
    explanation: str
    advice: List[str]
    entities: Entities
    breakdown: EngineBreakdown
    secondary_categories: List[str] = []
    confidence: str = "Standard"
    claims_requiring_verification: List[str] = []
    verification_status: str = "Assessed from text. Factual verification not performed."

class HistoryResponse(AnalyzeResponse):
    created_at: str

class StatsResponse(BaseModel):
    total_scans: int
    scams_caught: int
    average_trust_score: float
    most_common_category: str
    verdict_counts: Dict[str, int]
    category_counts: Dict[str, int]
