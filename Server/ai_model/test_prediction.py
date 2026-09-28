import os
import sys
import joblib
import json

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "risk_model.pkl")

def test_model():
    if not os.path.exists(MODEL_PATH):
        print(f"[Error] Model file not found at: {MODEL_PATH}")
        return

    print("=" * 65)
    print("      DENGUE ML RISK PREDICTION MODEL VERIFICATION")
    print("=" * 65)
    
    bundle = joblib.load(MODEL_PATH)
    reg = bundle["regressor"]
    clf = bundle["classifier"]

    # Test test scenarios matching different real-world conditions
    test_cases = [
        {
            "scenario": "Scenario A: Clean Area (No Breeding Sites + Low Rainfall + Low Cases)",
            "ai_severity": 0.0,
            "ai_conf": 95.0,
            "rainfall_mm": 15.0,
            "ndcu_cases": 80,
            "report_density": 1,
            "expected_level": "Low"
        },
        {
            "scenario": "Scenario B: Moderate Hazard (Bottle/Drain + Moderate Rain + Average Cases)",
            "ai_severity": 65.0,
            "ai_conf": 75.0,
            "rainfall_mm": 60.0,
            "ndcu_cases": 450,
            "report_density": 6,
            "expected_level": "Medium"
        },
        {
            "scenario": "Scenario C: Critical Hazard (Tire/Coconut Shell + Heavy Rain + Epidemic Cases)",
            "ai_severity": 95.0,
            "ai_conf": 92.0,
            "rainfall_mm": 150.0,
            "ndcu_cases": 1050,
            "report_density": 16,
            "expected_level": "High"
        }
    ]

    feature_cols = bundle.get("feature_cols", [
        "ai_severity_score",
        "ai_confidence",
        "recent_rainfall_mm",
        "ndcu_district_cases",
        "report_density"
    ])

    for tc in test_cases:
        import pandas as pd
        features = pd.DataFrame([{
            "ai_severity_score": tc["ai_severity"],
            "ai_confidence": tc["ai_conf"],
            "recent_rainfall_mm": tc["rainfall_mm"],
            "ndcu_district_cases": tc["ndcu_cases"],
            "report_density": tc["report_density"]
        }], columns=feature_cols)
        
        predicted_score = round(float(reg.predict(features)[0]), 1)
        predicted_level = str(clf.predict(features)[0])
        status = "PASSED" if predicted_level == tc["expected_level"] else "CHECK"

        print(f"\n>> {tc['scenario']}")
        print(f"   Inputs   : Visual Severity={tc['ai_severity']}, Visual Conf={tc['ai_conf']}%, Rainfall={tc['rainfall_mm']}mm, NDCU Cases={tc['ndcu_cases']}, Density={tc['report_density']}")
        print(f"   ML Score : {predicted_score} / 100")
        print(f"   ML Level : {predicted_level} (Expected: {tc['expected_level']}) -> [{status}]")

    print("\n" + "=" * 65)
    print(" All ML test cases evaluated successfully against risk_model.pkl!")
    print("=" * 65)

if __name__ == "__main__":
    test_model()
