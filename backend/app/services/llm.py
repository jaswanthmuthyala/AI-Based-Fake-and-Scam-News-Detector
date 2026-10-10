import json

def generate_offline_explanation(rule_findings, category, verdict, links_result, is_url_only):
    if verdict == "Safe":
        return "The analysis engines did not detect any significant indicators of a scam or fake news."
        
    explanation = f"This content has been flagged as {verdict.lower()} ({category}). "
    
    if is_url_only:
        # Create an explanation based on links
        analyses = links_result.get("analyses", [])
        if not analyses:
            explanation += "The structural patterns of the link closely resemble known suspicious content."
            return explanation
            
        analysis = analyses[0] # Pick the first URL to explain
        reasons = [f["reason"].rstrip('.') for f in analysis.get("findings", [])]
        
        if reasons:
            explanation += f"This URL shows several characteristics associated with suspicious links: "
            explanation += ", and ".join(reasons) + "."
            if analysis.get("domain_age") == "unavailable":
                explanation += " Domain-age information was unavailable, so that signal could not be confirmed."
        else:
            explanation += "The structural patterns of the link closely resemble known suspicious content."
            
        return explanation
    
    if rule_findings:
        # Sort by severity (high > medium > low) and then by score
        severity_map = {"high": 3, "medium": 2, "low": 1}
        sorted_findings = sorted(rule_findings, key=lambda x: (severity_map.get(x.get("severity", "low"), 0), x.get("score", 0)), reverse=True)
        
        unique_reasons = []
        seen = set()
        for f in sorted_findings:
            reason = f["reason"].rstrip('.')
            if not reason.startswith("CRITICAL"):
                reason = reason.lower()
            if reason not in seen:
                seen.add(reason)
                unique_reasons.append(reason)
                
        # Use up to 4 reasons
        unique_reasons = unique_reasons[:4]
        
        if unique_reasons:
            if len(unique_reasons) == 1:
                explanation += f"It contains linguistic patterns that {unique_reasons[0]}."
            elif len(unique_reasons) == 2:
                explanation += f"It contains linguistic patterns that {unique_reasons[0]}, and {unique_reasons[1]}."
            else:
                last = unique_reasons.pop()
                explanation += f"It contains linguistic patterns that {', '.join(unique_reasons)}, and {last}."
    else:
        explanation += "The structural and linguistic patterns closely resemble known suspicious content."
        
    # Add a disclaimer to distinguish language from facts
    if verdict != "Safe" and not is_url_only:
        explanation += " The article was assessed from its text and factual verification was not performed."
        
    return explanation

def get_explanation(text: str, preprocess_data: dict, rule_findings: list, ml_result: dict, links_result: dict, category: str, verdict: str, is_url_only: bool = False):
    
    explanation_text = generate_offline_explanation(rule_findings, category, verdict, links_result, is_url_only)
    
    highlights = []
    for finding in rule_findings:
        highlights.append({
            "phrase": finding["match"],
            "reason": finding["reason"].rstrip('.'),
            "start": finding.get("start", 0),
            "end": finding.get("end", 0)
        })
        
    return {
        "explanation": explanation_text,
        "highlights": highlights
    }
