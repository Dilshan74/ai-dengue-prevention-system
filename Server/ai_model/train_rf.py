import os
import random
import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, mean_squared_error, r2_score

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(BASE_DIR, "dengue_data.csv")
MODEL_SAVE_PATH = os.path.join(BASE_DIR, "risk_model.pkl")

def generate_sample_dataset(filename=CSV_PATH, num_samples=600):
    """
    Generates a realistic synthetic dataset for Dengue Risk Scoring based on:
    - AI Visual Severity Score (0-100)
    - AI Confidence Score (0-100)
    - Recent 7-Day Rainfall in mm (0-200mm)
    - NDCU Historical District Dengue Cases (0-1500)
    - Local Report Density in 2km radius (0-25)
    """
    print(f"[Dataset] Generating synthetic Dengue Risk Dataset ({num_samples} records)...")
    np.random.seed(42)
    random.seed(42)

    data = []
    for _ in range(num_samples):
        # Feature 1: AI Visual Severity (Tire=95, Coconut=90, Drain=75, Vase=70, Bottle=60, Clean=0)
        severity_choices = [0, 60, 70, 75, 90, 95]
        ai_severity = float(np.random.choice(severity_choices, p=[0.2, 0.15, 0.15, 0.2, 0.15, 0.15]))
        
        # Feature 2: AI Confidence (25% to 99%)
        if ai_severity == 0:
            ai_conf = float(np.round(np.random.uniform(70, 98), 1))
        else:
            ai_conf = float(np.round(np.random.uniform(40, 99), 1))
            
        # Feature 3: Recent Rainfall (mm)
        rainfall = float(np.round(np.random.uniform(0, 180), 1))
        
        # Feature 4: NDCU District Dengue Cases
        ndcu_cases = int(np.random.randint(10, 1200))
        
        # Feature 5: Nearby Report Density
        density = int(np.random.randint(0, 20))

        # Weighted calculation with weights aligned with project proposal:
        # AI Detection: 40%, Weather/Rainfall: 20%, Past Dengue Cases: 25%, Report Density: 15%
        ai_component = (ai_severity * 0.75 + ai_conf * 0.25) * 0.40
        rain_component = min(100.0, (rainfall / 150.0) * 100.0) * 0.20
        ndcu_component = min(100.0, (ndcu_cases / 1000.0) * 100.0) * 0.25
        density_component = min(100.0, (density / 15.0) * 100.0) * 0.15

        # Raw risk score + slight random noise (+/- 4)
        noise = np.random.normal(0, 2.5)
        raw_score = ai_component + rain_component + ndcu_component + density_component + noise
        risk_score = float(np.clip(np.round(raw_score, 1), 0, 100))

        # Risk Classification Level
        if risk_score >= 70:
            risk_level = "High"
        elif risk_score >= 40:
            risk_level = "Medium"
        else:
            risk_level = "Low"

        data.append({
            "ai_severity_score": ai_severity,
            "ai_confidence": ai_conf,
            "recent_rainfall_mm": rainfall,
            "ndcu_district_cases": ndcu_cases,
            "report_density": density,
            "risk_score": risk_score,
            "risk_level": risk_level
        })

    df = pd.DataFrame(data)
    df.to_csv(filename, index=False)
    print(f"[Dataset] Saved to {filename}")
    return df

def train_models():
    # 1. Load or Generate Dataset
    if not os.path.exists(CSV_PATH) or os.path.getsize(CSV_PATH) < 100:
        df = generate_sample_dataset()
    else:
        print(f"[DataLoader] Loading dataset from {CSV_PATH}...")
        df = pd.read_csv(CSV_PATH)

    # 2. Features and Targets
    feature_cols = [
        "ai_severity_score",
        "ai_confidence",
        "recent_rainfall_mm",
        "ndcu_district_cases",
        "report_density"
    ]
    
    X = df[feature_cols]
    y_class = df["risk_level"]
    y_reg = df["risk_score"]

    # Split dataset (80% train, 20% test)
    X_train, X_test, y_train_clf, y_test_clf, y_train_reg, y_test_reg = train_test_split(
        X, y_class, y_reg, test_size=0.2, random_state=42, stratify=y_class
    )

    print("\n=======================================================")
    print("[Train] Training Random Forest Classifier (Risk Level)...")
    print("=======================================================")
    clf = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42)
    clf.fit(X_train, y_train_clf)
    
    y_pred_clf = clf.predict(X_test)
    accuracy = accuracy_score(y_test_clf, y_pred_clf)
    print(f"[Results] Classification Accuracy: {accuracy * 100:.2f}%\n")
    print("Classification Report:")
    print(classification_report(y_test_clf, y_pred_clf))
    print("Confusion Matrix:")
    print(confusion_matrix(y_test_clf, y_pred_clf))

    print("\n=======================================================")
    print("[Train] Training Random Forest Regressor (Risk Score 0-100)...")
    print("=======================================================")
    reg = RandomForestRegressor(n_estimators=100, max_depth=8, random_state=42)
    reg.fit(X_train, y_train_reg)

    y_pred_reg = reg.predict(X_test)
    mse = mean_squared_error(y_test_reg, y_pred_reg)
    r2 = r2_score(y_test_reg, y_pred_reg)
    print(f"[Results] Mean Squared Error (MSE): {mse:.2f}")
    print(f"[Results] R2 Score: {r2:.4f}")

    # Feature Importance Analysis
    print("\n=======================================================")
    print("[Analysis] Feature Importance Analysis (Random Forest)")
    print("=======================================================")
    importances = clf.feature_importances_
    for name, importance in zip(feature_cols, importances):
        print(f" - {name:22s}: {importance * 100:6.2f}%")

    # 3. Save Model Bundle
    model_payload = {
        "classifier": clf,
        "regressor": reg,
        "feature_cols": feature_cols,
        "classes": clf.classes_.tolist()
    }
    
    joblib.dump(model_payload, MODEL_SAVE_PATH)
    print(f"\n[Success] Models saved successfully to: {MODEL_SAVE_PATH}")
    print("Ready to integrate with FastAPI / ai_service.py!")

if __name__ == "__main__":
    train_models()
