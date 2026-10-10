import pytest
from app.services.rules import evaluate_rules

def test_urgency():
    res = evaluate_rules("You must act now before it expires today!")
    findings = [f["rule"] for f in res["findings"]]
    assert "Urgency / Deadline" in findings
    
def test_otp_credential():
    res = evaluate_rules("Please share your OTP and PIN.")
    findings = [f["rule"] for f in res["findings"]]
    assert "OTP / Credential Request" in findings

def test_kyc_bank():
    res = evaluate_rules("Your account suspended. Please verify account.")
    findings = [f["rule"] for f in res["findings"]]
    assert "KYC / Bank Threat" in findings

def test_prize():
    res = evaluate_rules("You are a lucky winner of a prize!")
    findings = [f["rule"] for f in res["findings"]]
    assert "Prize / Lottery" in findings

def test_job_scam():
    res = evaluate_rules("You are selected for job and pay joining fee.")
    findings = [f["rule"] for f in res["findings"]]
    assert "Job Scam" in findings

def test_health_hoax():
    res = evaluate_rules("This miracle cure will completely prevent cancer.")
    findings = [f["rule"] for f in res["findings"]]
    assert "Health Hoax - Absolute Claim" in findings

def test_clickbait():
    res = evaluate_rules("SHOCKING: You won't believe this!")
    findings = [f["rule"] for f in res["findings"]]
    assert "Clickbait Headline" in findings

def test_genuine():
    res = evaluate_rules("Please review the quarterly report.")
    findings = [f["rule"] for f in res["findings"]]
    assert len(findings) == 0
    assert res["score"] == 0
