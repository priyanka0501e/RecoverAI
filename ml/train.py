import os
import pickle
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, roc_auc_score, accuracy_score

def train_model():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(base_dir, "transactions_10k.csv")
    
    if not os.path.exists(csv_path):
        from dataset_generator import generate_synthetic_data
        generate_synthetic_data(10000)
        
    df = pd.read_csv(csv_path)
    
    # Preprocessing
    feature_cols = [
        "amount", 
        "failure_reason", 
        "payment_method", 
        "retry_count", 
        "customer_tenure_days", 
        "customer_success_rate", 
        "hour_of_day"
    ]
    
    X_raw = df[feature_cols]
    y = df["is_recovered"]
    
    # One-hot encoding for categorical variables
    X = pd.get_dummies(X_raw, columns=["failure_reason", "payment_method"])
    columns_list = X.columns.tolist()
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    clf = RandomForestClassifier(
        n_estimators=120,
        max_depth=8,
        min_samples_split=5,
        random_state=42
    )
    clf.fit(X_train, y_train)
    
    y_pred = clf.predict(X_test)
    y_proba = clf.predict_proba(X_test)[:, 1]
    
    acc = accuracy_score(y_test, y_pred)
    roc_auc = roc_auc_score(y_test, y_proba)
    
    print(f"ML Model Trained Successfully!")
    print(f"Accuracy: {acc:.4f}")
    print(f"ROC-AUC: {roc_auc:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    
    model_data = {
        "model": clf,
        "feature_columns": columns_list,
        "metrics": {
            "accuracy": float(acc),
            "roc_auc": float(roc_auc)
        }
    }
    
    model_path = os.path.join(base_dir, "risk_model.pkl")
    with open(model_path, "wb") as f:
        pickle.dump(model_data, f)
        
    print(f"Saved trained model to {model_path}")

if __name__ == "__main__":
    train_model()
