def fuse_scores(rules_score: int, ml_score: int, links_score: int, has_links: bool, is_url_only: bool = False):
    # Weights
    w_rules = 0.35
    w_ml = 0.40
    w_links = 0.25
    
    if is_url_only:
        w_rules = 0.0
        w_ml = 0.0
        w_links = 1.0
    elif not has_links:
        # If no links, redistribute the link weight to avoid artificially increasing trust
        w_rules = 0.35 / 0.75
        w_ml = 0.40 / 0.75
        w_links = 0.0
        links_score = 0
    
    # Calculate weighted risk
    risk_score = (rules_score * w_rules) + (ml_score * w_ml) + (links_score * w_links)
    
    # Contextual check: If rules didn't find any concrete evidence, ML needs to be highly confident
    if rules_score == 0 and links_score == 0 and not is_url_only:
        if ml_score < 75:
            # Evidence is too weak/ambiguous to justify a suspicious classification
            # Cap risk score at 30 to keep it Safe / Genuine
            risk_score = min(risk_score, 30)
            
    # Trust score is inverse of risk
    trust_score = 100 - risk_score
    trust_score = max(0, min(100, round(trust_score)))
    
    if trust_score >= 70:
        verdict = "Safe"
    elif trust_score >= 40:
        verdict = "Suspicious"
    else:
        verdict = "Dangerous"
        
    return {
        "trust_score": trust_score,
        "verdict": verdict,
        "breakdown": {
            "rules": {
                "weight": int(w_rules * 100),
                "score": 100 - rules_score,
                "contribution": round(rules_score * w_rules, 1),
                "reason": "Not applicable. No text content was submitted." if is_url_only else None
            },
            "ml": {
                "weight": int(w_ml * 100),
                "score": 100 - ml_score,
                "contribution": round(ml_score * w_ml, 1),
                "reason": "Limited. URL-only input; text classifier has limited evidence." if is_url_only else None
            },
            "links": {
                "weight": int(w_links * 100),
                "score": 100 - links_score,
                "contribution": round(links_score * w_links, 1),
                "reason": "URL-only input. Link Checker is the primary evidence source." if is_url_only else None
            }
        },
        "risk_score": risk_score
    }

def determine_category(risk_score, rule_findings, input_type, is_url_only=False, link_analyses=None):
    if risk_score <= 30:
        return "Genuine / informational"
        
    if is_url_only and link_analyses:
        for analysis in link_analyses:
            if "kyc" in analysis.get("suspicious_keywords", []) or "bank" in analysis.get("domain", ""):
                return "KYC/Bank Fraud"
            if "login" in analysis.get("suspicious_keywords", []) or "verify" in analysis.get("suspicious_keywords", []):
                return "Phishing / Scam"
        return "Phishing / Scam"
        
    categories = [f["category"] for f in rule_findings]
    
    if "health_hoax" in categories:
        return "Health Hoax"
    elif "financial_scam" in categories:
        return "Financial Scam"
    elif "kyc_bank" in categories:
        return "KYC/Bank Fraud"
    elif "job_scam" in categories:
        return "Job Offer Scam"
    elif "prize_lottery" in categories:
        return "Lottery Scam"
    elif "credential_request" in categories:
        return "OTP Phishing"
    elif "clickbait" in categories:
        return "Clickbait"
    elif "manipulation" in categories and input_type == "news":
        return "Political Misinformation"
        
    # If risk is high but we have no specific rule categories (i.e. ML pushed it up highly)
    if len(rule_findings) == 0:
        return "Ambiguous / Unverified"
        
    return "Phishing / Scam"
