import os
import pickle
import pandas as pd
import numpy as np

MODEL_CACHE = None

def load_model():
    global MODEL_CACHE
    if MODEL_CACHE is not None:
        return MODEL_CACHE
        
    base_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(base_dir, "risk_model.pkl")
    
    if os.path.exists(model_path):
        try:
            with open(model_path, "rb") as f:
                MODEL_CACHE = pickle.load(f)
            return MODEL_CACHE
        except Exception as e:
            print(f"Error loading model: {e}")
            return None
    return None

def predict_recovery_probability(payment_data):
    """
    Accepts payment dictionary:
    {
      "amount": float,
      "failure_reason": str,
      "payment_method": str,
      "retry_count": int,
      "customer_tenure_days": int,
      "customer_success_rate": float,
      "hour_of_day": int
    }
    Returns probability float (0.0 to 100.0) and risk level ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL').
    """
    model_obj = load_model()
    
    if model_obj is not None:
        model = model_obj["model"]
        columns_list = model_obj["feature_columns"]
        
        df_single = pd.DataFrame([{
            "amount": float(payment_data.get("amount", 2000)),
            "failure_reason": str(payment_data.get("failure_reason", "BANK_TIMEOUT")),
            "payment_method": str(payment_data.get("payment_method", "UPI")),
            "retry_count": int(payment_data.get("retry_count", 0)),
            "customer_tenure_days": int(payment_data.get("customer_tenure_days", 30)),
            "customer_success_rate": float(payment_data.get("customer_success_rate", 0.7)),
            "hour_of_day": int(payment_data.get("hour_of_day", 14))
        }])
        
        df_encoded = pd.get_dummies(df_single, columns=["failure_reason", "payment_method"])
        
        # Align columns with training set
        for col in columns_list:
            if col not in df_encoded.columns:
                df_encoded[col] = 0
        df_encoded = df_encoded[columns_list]
        
        proba = float(model.predict_proba(df_encoded)[0, 1]) * 100.0
    else:
        # Rules-based heuristic fallback if pickle not loaded
        base_prob = 50.0
        reason = payment_data.get("failure_reason", "")
        if reason in ["BANK_TIMEOUT", "NETWORK_ERROR"]:
            base_prob += 25.0
        elif reason in ["CHECKOUT_ABANDONED", "AUTHENTICATION_FAILED"]:
            base_prob += 15.0
        elif reason == "CARD_EXPIRED":
            base_prob -= 30.0
        elif reason == "INSUFFICIENT_FUNDS":
            base_prob -= 15.0
            
        retry = payment_data.get("retry_count", 0)
        if retry == 0:
            base_prob += 10.0
        elif retry >= 2:
            base_prob -= 25.0
            
        success_rate = payment_data.get("customer_success_rate", 0.7)
        if success_rate > 0.75:
            base_prob += 15.0
        elif success_rate < 0.3:
            base_prob -= 20.0
            
        amount = payment_data.get("amount", 0)
        if amount > 25000:
            base_prob -= 15.0
            
        proba = max(5.0, min(95.0, base_prob))
        
    proba = round(proba, 1)
    
    # Calculate risk score (inverse of recovery probability)
    risk_score = round(100.0 - proba, 1)
    
    if proba >= 75.0:
        risk_level = "LOW"
    elif proba >= 50.0:
        risk_level = "MEDIUM"
    elif proba >= 25.0:
        risk_level = "HIGH"
    else:
        risk_level = "CRITICAL"
        
    return proba, risk_score, risk_level

if __name__ == "__main__":
    test_sample = {
        "amount": 2499.00,
        "failure_reason": "BANK_TIMEOUT",
        "payment_method": "UPI",
        "retry_count": 0,
        "customer_tenure_days": 120,
        "customer_success_rate": 0.85,
        "hour_of_day": 14
    }
    prob, risk_score, risk_lvl = predict_recovery_probability(test_sample)
    print(f"Sample Recovery Probability: {prob}% | Risk Score: {risk_score} | Level: {risk_lvl}")
