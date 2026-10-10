import os
import joblib
import pandas as pd
from typing import Dict, Any

MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "models")
VECTORIZER_PATH = os.path.join(MODEL_DIR, "tfidf_vectorizer.joblib")
MODEL_PATH = os.path.join(MODEL_DIR, "logistic_model.joblib")

class MLEngine:
    def __init__(self):
        self.vectorizer = None
        self.model = None
        self.load_model()

    def load_model(self):
        try:
            if os.path.exists(VECTORIZER_PATH) and os.path.exists(MODEL_PATH):
                self.vectorizer = joblib.load(VECTORIZER_PATH)
                self.model = joblib.load(MODEL_PATH)
            else:
                print("Model files not found. They should be generated via train_model.py.")
        except Exception as e:
            print(f"Error loading model: {e}")

    def evaluate(self, text: str, is_url_only: bool = False) -> Dict[str, Any]:
        if is_url_only:
            return {
                "score": 0,
                "reason": "Limited. URL-only input; text classifier has limited evidence."
            }
        
        if not self.vectorizer or not self.model:
            # Fallback if model isn't loaded
            return {"score": 50, "reason": "ML model unavailable. Returning neutral score."}
        
        try:
            vec_text = self.vectorizer.transform([text])
            prob = self.model.predict_proba(vec_text)[0]
            
            # Retrieve probability for class 1 (Scam / Risk)
            classes = list(self.model.classes_)
            risk_idx = classes.index(1) if 1 in classes else 1
            risk_prob = prob[risk_idx]
            
            # Convert to explicit risk score
            ml_risk_score = int(risk_prob * 100)
            
            reason = "Text patterns resemble known scam or fake messages." if ml_risk_score > 50 else "Text patterns appear normal."
            
            return {
                "score": ml_risk_score,
                "reason": reason
            }
        except Exception as e:
            print(f"ML evaluation error: {e}")
            return {"score": 50, "reason": "Error during ML analysis."}

ml_engine = MLEngine()

def evaluate_ml(text: str, is_url_only: bool = False):
    return ml_engine.evaluate(text, is_url_only)
