import re

def mask_sensitive_data(text: str) -> str:
    # Mask phone numbers
    text = re.sub(r'(?:\+91|91)?[-\s]?([6-9]\d{9})', lambda m: '+91 \u2022\u2022\u2022\u2022\u2022\u2022' + m.group(1)[-4:], text)
    
    # Mask UPI IDs
    text = re.sub(r'([a-zA-Z0-9.\-_]{2,256})@([a-zA-Z]{2,64})', lambda m: '\u2022\u2022\u2022\u2022@' + m.group(2), text)
    
    return text
