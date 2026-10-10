import pytest
from app.services.fusion import fuse_scores
from app.services.llm import generate_offline_explanation
from app.services.rules import evaluate_rules
from app.services.preprocess import preprocess
from app.routers.analyze import analyze_content
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_identical_inputs_deterministic():
    text = "Please verify your account immediately at http://parcel-update.com"
    prep1 = preprocess(text)
    prep2 = preprocess(text)
    
    assert prep1 == prep2
    
    rules1 = evaluate_rules(prep1["cleaned_text"], False)
    rules2 = evaluate_rules(prep2["cleaned_text"], False)
    
    assert rules1 == rules2
    
def test_trust_score_conversion():
    # rules=30, ml=40, links=50 (RISK scores)
    # w_rules=0.35, w_ml=0.40, w_links=0.25
    # Risk = 30*0.35 + 40*0.40 + 50*0.25 = 10.5 + 16.0 + 12.5 = 39
    # Trust = 100 - 39 = 61
    res = fuse_scores(30, 40, 50, True, False)
    assert res["trust_score"] == 61
    # Check that breakdown contains trust scores
    assert res["breakdown"]["rules"]["score"] == 70
    assert res["breakdown"]["ml"]["score"] == 60
    assert res["breakdown"]["links"]["score"] == 50

def test_verdict_boundaries():
    # Trust scores and expected verdicts
    
    # 0 = Dangerous
    res_0 = fuse_scores(100, 100, 100, True, False) # Risk 100 -> Trust 0
    assert res_0["trust_score"] == 0
    assert res_0["verdict"] == "Dangerous"
    
    # 39 = Dangerous
    res_39 = fuse_scores(61, 61, 61, True, False) # Risk 61 -> Trust 39
    assert res_39["trust_score"] == 39
    assert res_39["verdict"] == "Dangerous"
    
    # 40 = Suspicious
    res_40 = fuse_scores(60, 60, 60, True, False) # Risk 60 -> Trust 40
    assert res_40["trust_score"] == 40
    assert res_40["verdict"] == "Suspicious"
    
    # 69 = Suspicious
    res_69 = fuse_scores(31, 31, 31, True, False) # Risk 31 -> Trust 69
    assert res_69["trust_score"] == 69
    assert res_69["verdict"] == "Suspicious"
    
    # 70 = Safe
    res_70 = fuse_scores(30, 30, 30, True, False) # Risk 30 -> Trust 70
    assert res_70["trust_score"] == 70
    assert res_70["verdict"] == "Safe"
    
    # 100 = Safe
    res_100 = fuse_scores(0, 0, 0, True, False) # Risk 0 -> Trust 100
    assert res_100["trust_score"] == 100
    assert res_100["verdict"] == "Safe"

def test_explanation_punctuation():
    rule_findings = [
        {"match": "act now", "reason": "Creates artificial urgency and pressures users to act before independently verifying the message."},
        {"match": "password", "reason": "Requests authentication information or security codes that legitimate organizations will never ask you to disclose."}
    ]
    expl = generate_offline_explanation(rule_findings, "Phishing / Scam", "Dangerous", {}, False)
    
    assert expl.endswith("factual verification was not performed.")
    assert ".." not in expl
    assert "and requests authentication" in expl
    
def test_url_only_handling():
    res = fuse_scores(100, 100, 50, True, True) # is_url_only=True
    assert res["breakdown"]["rules"]["weight"] == 0
    assert res["breakdown"]["ml"]["weight"] == 0
    assert res["breakdown"]["links"]["weight"] == 100
    # Risk = 50*1.0 = 50 -> Trust 50
    assert res["trust_score"] == 50

def test_no_url_handling():
    res = fuse_scores(20, 30, 100, False, False) # has_links=False
    assert res["breakdown"]["links"]["weight"] == 0
    assert res["breakdown"]["rules"]["weight"] == 46 # int(0.35/0.75 * 100)
    assert res["breakdown"]["ml"]["weight"] == 53 # int(0.40/0.75 * 100)

def test_health_misinformation_categorization():
    text = "BREAKING: Lemon water cures cancer, diabetes and heart disease! 98% recovery! Stop prescribed medicines immediately. There is a cover-up by hospitals. Forward to everyone!"
    from app.services.rules import evaluate_rules
    from app.services.fusion import determine_category, fuse_scores
    
    rules_res = evaluate_rules(text, False, "news")
    assert rules_res["score"] >= 80  # Strong indicators
    
    cat = determine_category(100, rules_res["findings"], "news")
    assert cat == "Health Hoax"
    
    # Simulate fusion with neutral ML
    res = fuse_scores(rules_res["score"], 50, 0, False, False)
    assert res["trust_score"] < 40
    assert res["verdict"] == "Dangerous"

def test_diabetes_miracle_cure():
    text = 'A new unnamed natural drink reverses diabetes in 14 days. Reports 96% recovery. It is a pharmaceutical cover-up. Stop prescribed medication immediately before government removes this.'
    from app.services.rules import evaluate_rules
    from app.services.fusion import determine_category, fuse_scores
    
    rules_res = evaluate_rules(text, False, "news")
    cat = determine_category(100, rules_res["findings"], "news")
    assert cat == "Health Hoax"
    assert rules_res["score"] >= 80

def test_genuine_medical_article():
    text = 'BREAKING: New clinical trial shows promising results for diabetes management. Always consult your doctor before changing treatments.'
    from app.services.rules import evaluate_rules
    rules_res = evaluate_rules(text, False, "news")
    # Only clickbait rule (BREAKING) should trigger, not health hoaxes
    assert rules_res["score"] == 15
    cats = [f["category"] for f in rules_res["findings"]]
    assert "health_hoax" not in cats

def test_debunking_article():
    text = 'Myth: There is a false claim that lemon water cures cancer. There is no evidence for this miracle cure.'
    from app.services.rules import evaluate_rules
    rules_res = evaluate_rules(text, False, "news")
    cats = [f["category"] for f in rules_res["findings"]]
    assert "health_hoax" not in cats

def test_repeated_analysis_stability():
    text = 'A new unnamed natural drink reverses diabetes in 14 days. Reports 96% recovery.'
    from app.services.rules import evaluate_rules
    from app.services.fusion import determine_category
    
    res1 = evaluate_rules(text, False, "news")
    cat1 = determine_category(100, res1["findings"], "news")
    
    res2 = evaluate_rules(text, False, "news")
    cat2 = determine_category(100, res2["findings"], "news")
    
    assert res1["score"] == res2["score"]
    assert cat1 == cat2
    assert len(res1["findings"]) == len(res2["findings"])

def test_diabetes_miracle_cure():
    text = 'A new unnamed natural drink reverses diabetes in 14 days. Reports 96% recovery. It is a pharmaceutical cover-up. Stop prescribed medication immediately before government removes this.'
    from app.services.rules import evaluate_rules
    from app.services.fusion import determine_category, fuse_scores
    
    rules_res = evaluate_rules(text, False, "news")
    cat = determine_category(100, rules_res["findings"], "news")
    assert cat == "Health Hoax"
    assert rules_res["score"] >= 80

def test_genuine_medical_article():
    text = 'BREAKING: New clinical trial shows promising results for diabetes management. Always consult your doctor before changing treatments.'
    from app.services.rules import evaluate_rules
    rules_res = evaluate_rules(text, False, "news")
    # Only clickbait rule (BREAKING) should trigger, not health hoaxes
    assert rules_res["score"] == 15
    cats = [f["category"] for f in rules_res["findings"]]
    assert "health_hoax" not in cats

def test_debunking_article():
    text = 'Myth: There is a false claim that lemon water cures cancer. There is no evidence for this miracle cure.'
    from app.services.rules import evaluate_rules
    rules_res = evaluate_rules(text, False, "news")
    cats = [f["category"] for f in rules_res["findings"]]
    assert "health_hoax" not in cats

def test_repeated_analysis_stability():
    text = 'A new unnamed natural drink reverses diabetes in 14 days. Reports 96% recovery.'
    from app.services.rules import evaluate_rules
    from app.services.fusion import determine_category
    
    res1 = evaluate_rules(text, False, "news")
    cat1 = determine_category(100, res1["findings"], "news")
    
    res2 = evaluate_rules(text, False, "news")
    cat2 = determine_category(100, res2["findings"], "news")
    
    assert res1["score"] == res2["score"]
    assert cat1 == cat2
    assert len(res1["findings"]) == len(res2["findings"])

def test_investment_scam():
    text = 'Invest now for guaranteed 400% returns risk-free!'
    from app.services.rules import evaluate_rules
    from app.services.fusion import determine_category
    
    rules_res = evaluate_rules(text, False, "news")
    cat = determine_category(100, rules_res["findings"], "news")
    assert cat == "Financial Scam"
    assert rules_res["score"] >= 35

def test_banking_otp_message():
    text = 'Dear customer, your SBI account is blocked. Please share your OTP to verify your account.'
    from app.services.rules import evaluate_rules
    from app.services.fusion import determine_category
    
    rules_res = evaluate_rules(text, False, "message")
    cat = determine_category(100, rules_res["findings"], "message")
    # Matches OTP / Credential Request, KYC / Bank Threat
    assert "credential_request" in [f["category"] for f in rules_res["findings"]]
    assert cat in ["OTP Phishing", "KYC/Bank Fraud"]
    assert rules_res["score"] > 50

def test_genuine_security_notification():
    text = 'Your bank will never ask for your OTP. Please stay safe.'
    from app.services.rules import evaluate_rules
    rules_res = evaluate_rules(text, False, "message")
    cats = [f["category"] for f in rules_res["findings"]]
    assert "credential_request" not in cats

def test_legitimate_https_website():
    from app.services.links import evaluate_links
    res = evaluate_links("", ["https://example.com/about"])
    assert res["score"] == 0
    assert "HTTPS" in res["analyses"][0]["findings"][0]["reason"]
    assert "does not guarantee" in res["analyses"][0]["findings"][0]["reason"]

def test_suspicious_reserved_url():
    from app.services.links import evaluate_links
    res = evaluate_links("", ["http://localhost:3000/admin"])
    assert res["analyses"][0]["risk_score"] >= 50
    assert "reserved or local" in res["analyses"][0]["findings"][0]["reason"]

def test_deceptive_authority_url():
    from app.services.links import evaluate_links
    res = evaluate_links("", ["https://sbi-secure-login.example.com@evil.example.net/verify-account?session=expired&action=restore&otp=required"])
    analysis = res["analyses"][0]
    assert analysis["domain"] == "evil.example.net"
    assert analysis["risk_score"] > 30
    
    reasons = [f["reason"] for f in analysis["findings"]]
    # Check for misleading authority
    assert any("misleading authority" in r.lower() for r in reasons)
    # Check for suspicious wording
    assert any("verify" in r.lower() for r in reasons)
    # Check for credential parameters
    assert any("credential-entry or account-restoration" in r.lower() for r in reasons)

def test_url_with_harmless_query():
    from app.services.links import evaluate_links
    res = evaluate_links("", ["https://example.com/shop?item=123&color=blue"])
    assert res["analyses"][0]["risk_score"] <= 30
    
def test_malformed_url():
    from app.services.links import evaluate_links
    res = evaluate_links("", ["http://[invalid-url]"])
    # Parsing will likely fail or treat [invalid-url] specially
    assert res["analyses"][0]["risk_score"] > 0

def test_college_workshop_safe():
    text = "Hi everyone! Our college coding club is organizing a free programming workshop this Saturday from 10 AM to 1 PM in the computer lab. The session will cover basic Python programming, problem-solving techniques, and an introduction to web development. Students who are interested can register through the official college notice or contact the faculty coordinator for more information. Participation is optional, and no payment is required. Please bring your laptop if you have one. The workshop is open to all students, including beginners. Feel free to share this announcement with classmates who may be interested. We look forward to seeing you there!"
    from app.services.rules import evaluate_rules
    from app.services.ml import evaluate_ml
    from app.services.fusion import fuse_scores, determine_category
    
    rules = evaluate_rules(text, False, "message")
    ml = evaluate_ml(text)
    
    fusion = fuse_scores(rules["score"], ml["score"], 0, False)
    cat = determine_category(fusion["risk_score"], rules["findings"], "message")
    
    assert fusion["trust_score"] >= 70
    assert fusion["verdict"] == "Safe"
    assert cat == "Genuine / informational"

def test_routine_bank_statement():
    text = "Your bank statement for the month of October is now available. We will never ask for your OTP or password. Please stay safe."
    from app.services.rules import evaluate_rules
    from app.services.fusion import determine_category
    rules = evaluate_rules(text, False, "message")
    cat = determine_category(rules["score"], rules["findings"], "message")
    
    cats = [f["category"] for f in rules["findings"]]
    assert "credential_request" not in cats

def test_fraudulent_otp_request():
    text = "Dear customer, your account is suspended. Share your OTP and UPI PIN immediately to unlock it."
    from app.services.rules import evaluate_rules
    from app.services.fusion import determine_category
    rules = evaluate_rules(text, False, "message")
    cat = determine_category(100, rules["findings"], "message")
    assert cat in ["OTP Phishing", "KYC/Bank Fraud"]
    
def test_phishing_account_suspension():
    text = "Immediate action required: your Netflix account will be suspended. Click here to verify your account."
    from app.services.rules import evaluate_rules
    rules = evaluate_rules(text, False, "message")
    cats = [f["category"] for f in rules["findings"]]
    assert "manipulation" in cats or "urgency" in [f.get("category", "") for f in rules["findings"]] or len(cats) > 0

def test_free_legitimate():
    text = "Join us for a free community yoga class tomorrow morning!"
    from app.services.rules import evaluate_rules
    from app.services.ml import evaluate_ml
    from app.services.fusion import fuse_scores
    rules = evaluate_rules(text, False, "message")
    ml = evaluate_ml(text)
    fusion = fuse_scores(rules["score"], ml["score"], 0, False)
    assert fusion["trust_score"] >= 70
    assert fusion["verdict"] == "Safe"

def test_ambiguous_message():
    text = "We found something interesting. Can you check this?"
    from app.services.rules import evaluate_rules
    from app.services.ml import evaluate_ml
    from app.services.fusion import fuse_scores, determine_category
    
    # Force high ML score artificially to simulate ambiguity override
    fusion = fuse_scores(0, 85, 0, False)
    cat = determine_category(fusion["risk_score"], [], "message")
    assert cat == "Ambiguous / Unverified"

def test_genuine_job_ad():
    text = "We are hiring! Software Engineer position open. Please apply on our careers page. No fees required."
    from app.services.rules import evaluate_rules
    rules = evaluate_rules(text, False, "message")
    cats = [f["category"] for f in rules["findings"]]
    assert "job_scam" not in cats

def test_fraudulent_job_offer():
    text = "You are selected for job! Pay the joining fee of $50 to apply."
    from app.services.rules import evaluate_rules
    rules = evaluate_rules(text, False, "message")
    cats = [f["category"] for f in rules["findings"]]
    assert "job_scam" in cats

def test_promotional_message():
    text = "Get 20% off your next purchase with code SPRING20."
    from app.services.rules import evaluate_rules
    from app.services.ml import evaluate_ml
    from app.services.fusion import fuse_scores
    rules = evaluate_rules(text, False, "message")
    ml = evaluate_ml(text)
    fusion = fuse_scores(rules["score"], ml["score"], 0, False)
    assert fusion["trust_score"] >= 70
    assert fusion["verdict"] == "Safe"

def test_consecutive_scans():
    text1 = "You are selected for job and pay joining fee."
    text2 = "Hi mom, see you tomorrow."
    
    from app.services.rules import evaluate_rules
    res1 = evaluate_rules(text1, False, "message")
    res2 = evaluate_rules(text2, False, "message")
    
    assert "job_scam" in [f["category"] for f in res1["findings"]]
    assert len(res2["findings"]) == 0
