import re

# Structured Rules for detection
RULES = [
      {
          "name": "Financial Misinformation / Scam",
          "category": "financial_scam",
          "pattern": r"(?i)\b(guaranteed returns?|risk[- ]free|double your money|[0-9]{3,}% returns?|make money fast|get rich quick|passive income system|secret investment)\b",
          "reason": "Promotes highly unrealistic financial returns or 'get rich quick' schemes typical of investment scams.",
          "score": 35,
          "severity": "high",
          "input_types": ["message", "news"]
      },
    {
        "name": "Urgency / Deadline",
        "category": "urgency",
        "pattern": r"(?i)\b(act now|act immediately|urgent|immediately|within 24 hours|within 48 hours|in 24 hours|last chance|expires today|do it now|limited time|immediate action required)\b",
        "reason": "Creates artificial urgency and pressures users to act before independently verifying the message.",
        "score": 20,
        "severity": "medium",
        "input_types": ["message", "news"]
    },
    {
        "name": "OTP / Credential Request",
        "category": "credential_request",
        "pattern": r"(?i)\b(otp|one time password|pin|upi pin|cvv|password|card number|verification code|security code)\b",
        "negative_lookbehind": r"(?i)(never share|don\'t share|do not share|never tell|nobody will ask|we will never ask|bank will never ask).{0,40}",
        "reason": "Requests authentication information or security codes that legitimate organizations will never ask you to disclose.",
        "score": 35,
        "severity": "high",
        "input_types": ["message"]
    },
    {
        "name": "KYC / Bank Threat",
        "category": "kyc_bank",
        "pattern": r"(?i)\b(kyc expired|kyc update|account suspended|verify account|bank update|bank account|reactivate account|account blocked|block.*account)\b",
        "reason": "Impersonates banking support to induce panic, threatening account access to steal credentials.",
        "score": 30,
        "severity": "high",
        "input_types": ["message"]
    },
    {
        "name": "Prize / Lottery",
        "category": "prize_lottery",
        "pattern": r"(?i)\b(you won|winner|lucky winner|lottery|prize|reward|cashback|claim your prize|processing fee)\b",
        "reason": "Promises unexpected financial gain, a common hook for advance-fee and phishing scams.",
        "score": 25,
        "severity": "high",
        "input_types": ["message"]
    },
    {
        "name": "Job Scam",
        "category": "job_scam",
        "pattern": r"(?i)\b(selected for job|registration fee for job|joining fee|guaranteed salary|pay to apply|interview fee)\b",
        "reason": "Offers dubious employment opportunities, often requiring an upfront payment or personal data.",
        "score": 30,
        "severity": "high",
        "input_types": ["message"]
    },
    {
        "name": "Health Hoax - Absolute Claim",
        "category": "health_hoax",
        "pattern": r"(?i)\b(completely prevent|cures? cancer|cures? diabetes|reverses? diabetes|reverses? cancer|reverses? diabetes|reverses? cancer|miracle cure|100% proven|guaranteed cure|cures? heart disease|9[0-9]% recovery)\b",
        "negative_lookbehind": r"(?i)(false claim|myth|debunked|no evidence|warning|falsely claim).{0,40}",
        "negative_lookbehind": r"(?i)(false claim|myth|debunked|no evidence|warning|falsely claim).{0,40}",
        "reason": "Makes an absolute medical claim without supporting evidence, a strong indicator of health misinformation.",
        "score": 35,
        "severity": "high",
        "input_types": ["message", "news"]
    },
    {
        "name": "Health Hoax - Medical Replacement",
        "category": "health_hoax",
        "pattern": r"(?i)\b(never need medicines|never need medication|no medicine required|replace medicines|stop prescribed medicin|stop prescribed medication|stop taking medicin|stop taking medication|stop your medication|stop medication)\b",
        "reason": "CRITICAL SAFETY WARNING: Advises stopping prescribed medication in favor of an unverified remedy. The article provides no reliable evidence for this advice. Never stop or change prescribed medication without consulting a certified doctor.",
        "score": 40,
        "severity": "high",
        "input_types": ["message", "news"]
    },
    {
        "name": "Health Hoax - Secrecy",
        "category": "health_hoax",
        "pattern": r"(?i)\b(secretly recommended|doctors don't want you to know|hospitals are hiding|hidden treatment|miracle treatment|one simple trick|scientists discovered|unnamed research|unnamed scientists|cover-up|pharmaceutical cover-up|pharmaceutical cover-up|media coverup)\b",
        "reason": "Uses conspiracy language and unsupported authority claims to manipulate readers.",
        "score": 25,
        "severity": "medium",
        "input_types": ["message", "news"]
    },
    {
        "name": "Forwarding Pressure",
        "category": "manipulation",
        "pattern": r"(?i)\b(before the government removes|before it gets deleted|share before deleted|share with everyone|share before removal|forward to everyone|pressures readers to forward)\b",
        "reason": "Creates pressure to share information virally before independent verification.",
        "score": 25,
        "severity": "medium",
        "input_types": ["message", "news"]
    },
    {
        "name": "Clickbait Headline",
        "category": "clickbait",
        "pattern": r"(?i)\b(shocking|breaking|you won't believe|secret revealed|must see|this changes everything|exposed|hidden truth|urgent breaking)\b",
        "reason": "Uses highly sensationalized language to bait engagement.",
        "score": 15,
        "severity": "low",
        "input_types": ["message", "news"]
    },
    {
        "name": "Conspiracy Claims",
        "category": "manipulation",
        "pattern": r"(?i)\b(they don't want you to know|government is hiding|media won't show this|mainstream media hiding)\b",
        "reason": "Relies on conspiracy framing rather than verifiable facts.",
        "score": 20,
        "severity": "medium",
        "input_types": ["message", "news"]
    }
]

def evaluate_rules(text: str, is_url_only: bool = False, input_type: str = "message"):
    if is_url_only:
        return {
            "findings": [],
            "score": 0,
            "reason": "Not applicable. No text content was submitted."
        }
    findings = []
    total_score = 0
    
    for rule in RULES:
        if input_type not in rule.get("input_types", ["message"]):
            continue
            
        # Handle negative lookbehind conceptually by checking context
        pattern = rule["pattern"]
        for m in re.finditer(pattern, text):
            match_str = m.group(0)
            start = m.start()
            end = m.end()
            
            # Check negation
            neg_pattern = rule.get("negative_lookbehind")
            is_negated = False
            if neg_pattern:
                context_start = max(0, start - 40)
                context_before = text[context_start:start]
                if re.search(neg_pattern + r"$", context_before):
                    is_negated = True
                    
            if is_negated:
                continue
            
            # Check for deduplication
            existing = [f for f in findings if f["match"] == match_str and f["rule"] == rule["name"]]
            if not existing:
                findings.append({
                    "rule": rule["name"],
                    "category": rule["category"],
                    "match": match_str,
                    "reason": rule["reason"],
                    "score": rule["score"],
                    "severity": rule["severity"],
                    "start": start,
                    "end": end
                })
                total_score += rule["score"]
    
    # Cap total rule risk score to 100
    normalized_score = min(total_score, 100)
    
    return {
        "findings": findings,
        "score": normalized_score
    }
