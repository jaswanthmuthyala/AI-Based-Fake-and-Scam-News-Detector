import pytest
from app.routers.analyze import router
from app.models.schemas import AnalyzeRequest
from app.services.preprocess import preprocess
from app.services.fusion import fuse_scores
from app.services.links import evaluate_links

def test_url_only_fusion():
    url = "http://parcel-verification.xyz"
    prep = preprocess(url)
    assert len(prep["entities"]["urls"]) == 1
    
    links_res = evaluate_links(prep["cleaned_text"], prep["entities"]["urls"])
    
    res = fuse_scores(rules_score=0, ml_score=0, links_score=links_res["score"], has_links=True, is_url_only=True)
    
    assert res["breakdown"]["rules"]["weight"] == 0
    assert res["breakdown"]["ml"]["weight"] == 0
    assert res["breakdown"]["links"]["weight"] == 100
    assert res["trust_score"] < 70
    assert res["verdict"] in ["Suspicious", "Dangerous"]

def test_no_url_fusion():
    text = "Just a normal text."
    prep = preprocess(text)
    
    res = fuse_scores(rules_score=20, ml_score=30, links_score=0, has_links=False, is_url_only=False)
    
    # 20 * (0.35/0.75) + 30 * (0.40/0.75) = 9.33 + 16 = 25.33
    # Trust = 100 - 25.33 = 75
    assert res["breakdown"]["links"]["weight"] == 0
    assert res["breakdown"]["rules"]["weight"] == 46
    assert res["breakdown"]["ml"]["weight"] == 53
    assert res["trust_score"] >= 70

def test_mixed_fusion():
    text = "Click here https://google.com"
    res = fuse_scores(rules_score=10, ml_score=10, links_score=0, has_links=True, is_url_only=False)
    
    # 10 * 0.35 + 10 * 0.40 + 0 * 0.25 = 3.5 + 4.0 + 0 = 7.5
    # Trust = 100 - 7.5 = 92
    assert res["breakdown"]["links"]["weight"] == 25
    assert res["breakdown"]["rules"]["weight"] == 35
    assert res["breakdown"]["ml"]["weight"] == 40
    assert res["trust_score"] == 92
