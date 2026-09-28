import os
import sys
import uuid
import shutil
from pathlib import Path
from typing import Optional

import cv2
import uvicorn
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO

app = FastAPI(title="DengueGuard AI Inference Service", version="1.0.0")

# Enable CORS for frontend and Express backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import joblib

# Paths
BASE_DIR = Path(__file__).resolve().parent
SERVER_DIR = BASE_DIR.parent
UPLOADS_DIR = SERVER_DIR / "uploads"
MODEL_PATH = BASE_DIR / "best.pt"
RF_MODEL_PATH = BASE_DIR / "risk_model.pkl"

# Ensure uploads directory exists
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

# Load YOLO model
if not MODEL_PATH.exists():
    raise FileNotFoundError(f"Model file not found at: {MODEL_PATH}")

print(f"[AI Service] Loading YOLO model from {MODEL_PATH}...")
model = YOLO(str(MODEL_PATH))
print(f"[AI Service] YOLO Model loaded successfully! Classes: {model.names}")

# Load Random Forest Model dynamically
_rf_cache = {"bundle": None, "mtime": 0}

def get_rf_model():
    if not RF_MODEL_PATH.exists():
        return None
    try:
        mtime = RF_MODEL_PATH.stat().st_mtime
        if _rf_cache["bundle"] is None or mtime != _rf_cache["mtime"]:
            _rf_cache["bundle"] = joblib.load(RF_MODEL_PATH)
            _rf_cache["mtime"] = mtime
            print(f"[AI Service] Loaded/Reloaded Random Forest Risk Model from {RF_MODEL_PATH} (mtime={mtime})")
        return _rf_cache["bundle"]
    except Exception as e:
        print(f"[AI Service] Could not load RF Model: {e}")
        return _rf_cache["bundle"]

# Pre-load on startup
get_rf_model()

# Severity scores per detected object
CLASS_SEVERITIES = {
    "Tire": 95.0,
    "Coconut-Exocarp": 90.0,
    "Drain-Inlet": 75.0,
    "Vase": 70.0,
    "Bottle": 60.0,
}

# Breeding site risk rules
HIGH_RISK_CLASSES = {"Tire", "Coconut-Exocarp"}
MEDIUM_RISK_CLASSES = {"Bottle", "Drain-Inlet", "Vase"}

RECOMMENDATIONS = {
    "Tire": "Discard or store tires in dry, sheltered areas. Drill drainage holes if used for barriers.",
    "Coconut-Exocarp": "Collect and safely dispose of or shred coconut shells to avoid collecting rainwater.",
    "Bottle": "Crush and dispose of or recycle empty plastic/glass bottles.",
    "Drain-Inlet": "Unclog drain inlets and clear leaf debris to maintain free-flowing water.",
    "Vase": "Empty and scrub flower vases, changing water at least every 3 to 5 days.",
}

@app.get("/health")
def health():
    bundle = get_rf_model()
    return {
        "status": "online",
        "service": "DengueGuard AI Model",
        "yolo_classes": model.names,
        "rf_model_loaded": bundle is not None,
        "rf_classes": bundle["classes"] if bundle else [],
    }

@app.post("/retrain")
def retrain():
    """
    Retrains the Random Forest models on dengue_data.csv and reloads the active model.
    """
    try:
        from train_rf import train_models
        train_models()
        bundle = get_rf_model()
        return {
            "status": "success",
            "message": "Models successfully retrained and reloaded from dengue_data.csv",
            "classes": bundle["classes"] if bundle else []
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Retraining failed: {str(e)}")

@app.post("/predict")
async def predict(
    file: Optional[UploadFile] = File(None),
    image_path: Optional[str] = Form(None),
    rainfall_mm: float = Form(45.0),
    ndcu_cases: int = Form(320),
    report_density: int = Form(3),
):
    """
    Runs YOLOv8 object detection on an image and predicts overall dengue risk score using Random Forest.
    """
    target_path = None
    filename = None

    if file:
        file_ext = Path(file.filename).suffix if file.filename else ".jpg"
        filename = f"ai-{uuid.uuid4().hex[:8]}{file_ext}"
        target_path = UPLOADS_DIR / filename
        with target_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    elif image_path:
        # Resolve path across potential base directories
        p = Path(image_path)
        candidate = None
        for base in [Path.cwd(), SERVER_DIR, SERVER_DIR.parent]:
            test_p = p if p.is_absolute() else (base / p)
            if test_p.exists():
                candidate = test_p
                break

        if not candidate or not candidate.exists():
            raise HTTPException(status_code=400, detail=f"Image path does not exist: {image_path}")
        target_path = candidate
        filename = target_path.name
    else:
        raise HTTPException(status_code=400, detail="Provide an image file or image_path")

    # Run YOLO inference
    results = model(str(target_path), conf=0.25)
    result = results[0]

    detected_objects = []
    max_conf = 0.0
    max_severity = 0.0

    if result.boxes is not None and len(result.boxes) > 0:
        for box in result.boxes:
            cls_id = int(box.cls[0].item())
            class_name = model.names.get(cls_id, f"Class_{cls_id}")
            conf = float(box.conf[0].item()) * 100
            coords = [round(x, 1) for x in box.xyxy[0].tolist()]

            severity = CLASS_SEVERITIES.get(class_name, 50.0)
            if severity > max_severity:
                max_severity = severity

            detected_objects.append({
                "label": class_name,
                "conf": round(conf, 1),
                "severity": severity,
                "bbox": coords
            })

            if conf > max_conf:
                max_conf = conf

    # Generate annotated image with bounding boxes drawn
    annotated_filename = f"annotated-{filename}"
    annotated_save_path = UPLOADS_DIR / annotated_filename
    plotted_img = result.plot()  # BGR numpy array
    cv2.imwrite(str(annotated_save_path), plotted_img)

    # Determine risk assessment
    labels_found = [obj["label"] for obj in detected_objects]
    unique_labels = list(dict.fromkeys(labels_found))

    recommendations = []
    for label in unique_labels:
        if label in RECOMMENDATIONS:
            recommendations.append(RECOMMENDATIONS[label])

    if not detected_objects:
        initial_risk = "Low"
        primary_label = "Clean / No Breeding Site Detected"
        max_conf = 95.0
        max_severity = 0.0
        recommendations.append("No obvious dengue breeding sites detected. Keep surrounding areas clean and free of water-holding debris.")
    elif any(l in HIGH_RISK_CLASSES for l in labels_found) or len(detected_objects) >= 2:
        initial_risk = "High"
        primary_label = f"High Hazard: {', '.join(unique_labels)} detected"
    else:
        initial_risk = "Medium"
        primary_label = f"Medium Hazard: {', '.join(unique_labels)} detected"

    # Multi-Factor Random Forest Risk Score Calculation
    rf_score = None
    rf_level = initial_risk

    rf_bundle = get_rf_model()
    if rf_bundle is not None:
        try:
            import pandas as pd
            reg = rf_bundle["regressor"]
            clf = rf_bundle["classifier"]
            cols = rf_bundle.get("feature_cols", [
                "ai_severity_score",
                "ai_confidence",
                "recent_rainfall_mm",
                "ndcu_district_cases",
                "report_density"
            ])
            features_df = pd.DataFrame([{
                "ai_severity_score": max_severity,
                "ai_confidence": max_conf,
                "recent_rainfall_mm": rainfall_mm,
                "ndcu_district_cases": ndcu_cases,
                "report_density": report_density
            }], columns=cols)
            rf_score = round(float(reg.predict(features_df)[0]), 1)
            rf_level = str(clf.predict(features_df)[0])
        except Exception as err:
            print(f"[AI Service] RF prediction error: {err}")

    # Synchronize final composite risk level with the ML model
    final_risk = rf_level if rf_score is not None else initial_risk

    return {
        "label": primary_label,
        "risk": final_risk,
        "rfRiskScore": rf_score if rf_score is not None else (85.0 if final_risk == "High" else 55.0 if final_risk == "Medium" else 20.0),
        "rfRiskLevel": rf_level,
        "confidence": round(max_conf, 1),
        "aiSeverityScore": max_severity,
        "detectedObjects": detected_objects,
        "annotatedImage": f"/uploads/{annotated_filename}",
        "originalImage": f"/uploads/{filename}",
        "recommendations": recommendations,
        "totalDetected": len(detected_objects),
        "riskFactors": {
            "aiSeverity": max_severity,
            "aiConfidence": round(max_conf, 1),
            "rainfallMm": rainfall_mm,
            "ndcuCases": ndcu_cases,
            "reportDensity": report_density,
        }
    }

if __name__ == "__main__":
    port = int(os.environ.get("AI_PORT", 5001))
    print(f"[AI Service] Starting server on http://127.0.0.1:{port} ...")
    uvicorn.run(app, host="127.0.0.1", port=port)
