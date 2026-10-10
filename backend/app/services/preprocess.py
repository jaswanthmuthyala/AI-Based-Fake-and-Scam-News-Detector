import re

def detect_language(text: str) -> str:
    hindi_pattern = re.compile(r'[\u0900-\u097F]')
    telugu_pattern = re.compile(r'[\u0C00-\u0C7F]')
    
    if hindi_pattern.search(text):
        if re.search(r'[a-zA-Z]', text):
            return "Hinglish"
        return "Hindi"
    elif telugu_pattern.search(text):
        return "Telugu"
    return "English"

def extract_entities(text: str):
    urls = re.findall(r'(https?://[^\s]+|www\.[^\s]+)', text)
    
    # Simple Indian phone number regex
    phone_numbers = re.findall(r'(?:\+91|91)?[-\s]?[6-9]\d{9}', text)
    # Filter out potential amounts matching phone patterns if they have currency symbols around them, simple approach:
    phone_numbers = list(set([re.sub(r'[-\s+]', '', p)[-10:] for p in phone_numbers]))
    phone_numbers = [f"+91{p}" for p in phone_numbers if len(p) == 10]
    
    upi_ids = re.findall(r'[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}', text)
    
    amounts = re.findall(r'(?:Rs\.?|INR|₹)\s*(\d+(?:,\d+)*(?:\.\d{1,2})?)', text, re.IGNORECASE)
    
    return {
        "urls": list(set(urls)),
        "phone_numbers": list(set(phone_numbers)),
        "upi_ids": list(set(upi_ids)),
        "amounts": list(set(amounts))
    }

def preprocess(text: str):
    cleaned_text = " ".join(text.split())
    language = detect_language(cleaned_text)
    entities = extract_entities(cleaned_text)
    
    return {
        "cleaned_text": cleaned_text,
        "language": language,
        "entities": entities
    }
