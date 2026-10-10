def generate_advice(category: str, verdict: str):
    if verdict == "Safe":
        return [
            "This content appears normal, but always stay vigilant.",
            "Verify the sender if the message asks for unusual requests.",
            "Keep your software and apps updated."
        ]
        
    if category in ["KYC/Bank Fraud", "OTP Phishing"]:
        return [
            "Do not click any links or share OTP/PIN/CVV information.",
            "Verify the claim through the bank's official website or app.",
            "Contact your bank's customer service immediately if you shared details."
        ]
    elif category == "Lottery Scam":
        return [
            "Never pay a fee or share banking details to claim a 'prize'.",
            "Remember that legitimate lotteries don't contact you unexpectedly.",
            "Block the sender and report the message as spam."
        ]
    elif category == "Job Offer Scam":
        return [
            "Do not pay recruitment or registration fees.",
            "Verify the employer using official channels.",
            "Avoid sharing identity/banking documents prematurely."
        ]
    elif category == "Health hoax":
        return [
            "Do not stop prescribed medication based on an unverified claim.",
            "Verify the health information using trusted medical or government sources.",
            "Avoid forwarding the claim until it has been independently verified."
        ]
    elif category in ["Political Misinformation", "Clickbait"]:
        return [
            "Do not share or forward this information without verification.",
            "Check established, reputable news sources for this claim.",
            "Look for official statements regarding this topic."
        ]
    else:
        return [
            "Do not interact with suspicious links or attachments.",
            "Verify the sender's identity through an independent channel.",
            "Report or block the sender if the message is suspicious."
        ]
