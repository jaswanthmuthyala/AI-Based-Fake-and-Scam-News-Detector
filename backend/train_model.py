import os
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, precision_score, recall_score, f1_score
from sklearn.model_selection import train_test_split
import joblib

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
DATA_FILE = os.path.join(DATA_DIR, "starter_dataset.csv")

VECTORIZER_PATH = os.path.join(MODEL_DIR, "tfidf_vectorizer.joblib")
MODEL_PATH = os.path.join(MODEL_DIR, "logistic_model.joblib")

def ensure_dataset():
    if os.path.exists(DATA_FILE) and len(pd.read_csv(DATA_FILE)) >= 300:
        return
        
    os.makedirs(DATA_DIR, exist_ok=True)
    print("Generating expanded dataset...")
    
    # Generate balanced dataset
    import random
    scams = [
        "Your SBI KYC will expire in 24 hours. Click here to update: http://sbi-kyc-update.xyz",
        "Congratulations! You won the $1M lottery. Send OTP to claim.",
        "Urgent: Your account is suspended. Verify now.",
        "Amazon Job Offer: Work from home and earn 5000/day. Pay 1000 reg fee.",
        "Dear customer, your bank account will be blocked today. Update KYC link: http://bit.ly/bad",
        "You have a pending package. Pay customs fee here.",
        "Get free iPhone! Just fill this survey.",
        "Investment opportunity: double your money in 3 days guaranteed returns.",
        "SHOCKING: Scientists discover miracle cure for diabetes that doctors are hiding!",
        "BREAKING NEWS: Drinking hot lemon water every morning can completely prevent cancer. 100% proven.",
        "Government is giving free Rs 50,000. Share with 10 groups to claim.",
        "URGENT: Your UPI payment of Rs 10000 is pending. Enter PIN to receive.",
        "This one simple trick will replace all your medicines. Big pharma hates this!",
        "Important notification regarding your Income Tax return. Click to verify your identity.",
        "You are selected for our premium work from home job. Registration fee Rs 499 only.",
        "Secretly recommended by hospitals: this natural leaf cures all diseases."
    ]

    safes = [
        "Hey, are we still meeting for lunch at 1 PM?",
        "Please review the attached quarterly report.",
        "Your Amazon package has been delivered.",
        "Meeting rescheduled to 3 PM tomorrow.",
        "Don't forget to buy milk on your way home.",
        "The weather forecast predicts rain for the weekend.",
        "Can you send me the presentation slides?",
        "Thanks for your help with the project.",
        "The recent study published in Nature discusses the effects of climate change.",
        "Doctors advise regular exercise and a balanced diet for heart health.",
        "The government announced a new infrastructure project for the city.",
        "I'm running 5 minutes late for the zoom call.",
        "Your monthly bank statement is ready to view online.",
        "Reminder: dentist appointment tomorrow at 10 AM.",
        "Scientists at the university are researching new renewable energy sources.",
        "Here are the meeting notes from yesterday's discussion."
    ]

    records = []
    for _ in range(250):
        records.append({"text": f"{random.choice(scams)} {random.randint(1000,9999)}", "label": 1, "category": "scam"})
        records.append({"text": f"{random.choice(safes)} {random.randint(1000,9999)}", "label": 0, "category": "genuine"})
        
    df = pd.DataFrame(records)
    df.to_csv(DATA_FILE, index=False)
    print(f"Generated {len(df)} records.")

def train():
    ensure_dataset()
    
    print("Loading dataset...")
    df = pd.read_csv(DATA_FILE).dropna(subset=['text', 'label'])
    
    X = df['text']
    y = df['label'] # 1 for risk (scam/hoax), 0 for safe
    
    # Stratified split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    print(f"Training on {len(X_train)} examples, evaluating on {len(X_test)}...")
    
    # N-grams up to 2 to catch phrases like "cure cancer", "completely prevent"
    vectorizer = TfidfVectorizer(max_features=5000, stop_words='english', ngram_range=(1, 2), min_df=2)
    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)
    
    model = LogisticRegression(random_state=42, max_iter=1000, class_weight='balanced')
    model.fit(X_train_vec, y_train)
    
    y_pred = model.predict(X_test_vec)
    
    print("\n--- Test Metrics ---")
    print(f"Accuracy:  {accuracy_score(y_test, y_pred):.4f}")
    print(f"Precision: {precision_score(y_test, y_pred):.4f}")
    print(f"Recall:    {recall_score(y_test, y_pred):.4f}")
    print(f"F1 Score:  {f1_score(y_test, y_pred):.4f}")
    
    print("\nConfusion Matrix:")
    print(confusion_matrix(y_test, y_pred))
    
    os.makedirs(MODEL_DIR, exist_ok=True)
    joblib.dump(vectorizer, VECTORIZER_PATH)
    joblib.dump(model, MODEL_PATH)
    print(f"\nModel saved to {MODEL_DIR}")

if __name__ == "__main__":
    train()
