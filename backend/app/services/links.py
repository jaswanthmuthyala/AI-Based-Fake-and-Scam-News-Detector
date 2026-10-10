import re
import urllib.parse
from typing import List, Dict, Any

def evaluate_links(text: str, extracted_urls: List[str]) -> Dict[str, Any]:
    if not extracted_urls:
        return {
            "score": 0,
            "reason": "No text content submitted." if not text.strip() else "No links to check.",
            "analyses": []
        }
        
    suspicious_tlds = ['.xyz', '.cc', '.tk', '.ml', '.ga', '.cf', '.gq', '.top', '.buzz']
    shorteners = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd', 't.me', 'wa.me']
    suspicious_keywords = ['verification', 'secure', 'login', 'update', 'kyc', 'account', 'verify', 'support', 'parcel', 'payment', 'refund']
    known_brands = ['sbi', 'hdfc', 'icici', 'axis', 'rbi', 'uidai', 'post', 'epfo', 'amazon', 'flipkart']
    
    total_risk = 0
    analyses = []
    
    for url in extracted_urls:
        url = url.strip()
        if not url.startswith('http'):
            url = 'http://' + url
            
        analysis = {
            "url": url,
            "https": False,
            "domain": "",
            "suspicious_tld": False,
            "ip_based": False,
            "shortened": False,
            "lookalike": False,
            "suspicious_keywords": [],
            "domain_age": "unavailable",
            "risk_score": 0,
            "findings": []
        }
        
        try:
            parsed = urllib.parse.urlsplit(url)
            hostname = parsed.hostname.lower() if parsed.hostname else ""
            analysis["domain"] = hostname
            
            # Reserved / Local
            if hostname == "localhost" or hostname.endswith(".local") or hostname.endswith(".test") or hostname.endswith(".example") or hostname == "example.net" or hostname == "example.com":
                # Wait, example.net is a reserved example domain. We still scan its structure, but we add a note.
                is_example = "example." in hostname or hostname == "localhost"
            else:
                is_example = False
                
            if hostname == "localhost" or hostname.endswith(".local"):
                analysis["risk_score"] = 50
                analysis["findings"].append({
                    "severity": "medium",
                    "reason": "This is a reserved or local test URL. It is nonfunctional on the public internet."
                })
                total_risk = max(total_risk, analysis["risk_score"])
                analyses.append(analysis)
                continue
                
            # Deceptive Authority Check (username@hostname)
            if parsed.username:
                # If username looks like a domain or has brands
                username_lower = parsed.username.lower()
                if "." in username_lower or any(b in username_lower for b in known_brands):
                    analysis["risk_score"] += 60
                    analysis["findings"].append({
                        "severity": "high",
                        "reason": f"Misleading authority information detected. The URL uses a deceptive '@' symbol to hide the real destination ({hostname}) behind a fake trusted name ({username_lower})."
                    })
            
            # HTTPS check
            if parsed.scheme == 'https':
                analysis["https"] = True
                analysis["findings"].append({
                    "severity": "low",
                    "reason": "Uses HTTPS encryption, but this does not guarantee the site is safe from phishing."
                })
            else:
                analysis["risk_score"] += 20
                analysis["findings"].append({
                    "severity": "medium",
                    "reason": "The URL does not use HTTPS, which is standard for secure sites."
                })
                
            # Suspicious TLD
            if any(hostname.endswith(tld) for tld in suspicious_tlds):
                analysis["suspicious_tld"] = True
                analysis["risk_score"] += 30
                analysis["findings"].append({
                    "severity": "medium",
                    "reason": "The domain uses a less common TLD frequently seen in disposable or suspicious links."
                })
                
            # IP based
            if re.match(r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$", hostname):
                analysis["ip_based"] = True
                analysis["risk_score"] += 60
                analysis["findings"].append({
                    "severity": "high",
                    "reason": "URL uses an IP address instead of a domain name, hiding its origin."
                })
                
            # Shortener
            if any(shortener in hostname for shortener in shorteners):
                analysis["shortened"] = True
                analysis["risk_score"] += 30
                analysis["findings"].append({
                    "severity": "medium",
                    "reason": "Uses a link shortener to obscure the final destination."
                })
                
            # Suspicious keywords in hostname, path, or query
            query_str = parsed.query.lower()
            path_str = parsed.path.lower()
            found_keywords = [kw for kw in suspicious_keywords if kw in hostname or kw in path_str or kw in query_str]
            if found_keywords:
                found_keywords = list(set(found_keywords))
                analysis["suspicious_keywords"] = found_keywords
                analysis["risk_score"] += 30
                analysis["findings"].append({
                    "severity": "medium",
                    "reason": f"The URL uses suspicious banking or verification wording commonly found in phishing links: {', '.join(found_keywords)}."
                })
                
            # Suspicious query parameters
            query_params = urllib.parse.parse_qs(query_str)
            suspicious_params = []
            for param, values in query_params.items():
                if "otp" in param or "password" in param or any("expire" in v for v in values) or any("restore" in v for v in values):
                    suspicious_params.append(param)
            
            if suspicious_params:
                analysis["risk_score"] += 40
                analysis["findings"].append({
                    "severity": "high",
                    "reason": "Contains suspicious credential-entry or account-restoration parameters (e.g., OTP, expired session flags) typical of credential harvesting."
                })
                
            # Lookalike brand detection in hostname
            found_brands = [b for b in known_brands if b in hostname]
            if found_brands and not analysis["shortened"]:
                official_domains = ['sbi.co.in', 'onlinesbi.sbi', 'hdfcbank.com', 'icicibank.com', 'uidai.gov.in', 'indiapost.gov.in', 'amazon.in', 'amazon.com']
                is_official = any(hostname == d or hostname.endswith('.' + d) for d in official_domains)
                
                if not is_official:
                    analysis["lookalike"] = True
                    analysis["risk_score"] += 50
                    analysis["findings"].append({
                        "severity": "high",
                        "reason": f"The hostname resembles a generic page attempting to impersonate an organization: {', '.join(found_brands)}."
                    })
                    
        except Exception as e:
            analysis["risk_score"] += 50
            analysis["findings"].append({
                "severity": "medium",
                "reason": "Could not fully parse the URL structure. It may be malformed."
            })
            
        analysis["risk_score"] = min(analysis["risk_score"], 100)
        total_risk = max(total_risk, analysis["risk_score"])
        analyses.append(analysis)
        
    reason = "The URL does not exhibit overt structural signs of phishing."
    if total_risk > 70:
        reason = "Links contain severe risk indicators such as impersonation, IP hosting, or deceptive URL structures."
    elif total_risk > 30:
        reason = "Links have minor to moderate risk indicators (e.g., missing HTTPS, suspicious terminology)."
        
    reason += " Note: Analysis is based on structural patterns; live malicious reputation verification was not performed."

    return {
        "score": total_risk,
        "reason": reason,
        "analyses": analyses
    }
