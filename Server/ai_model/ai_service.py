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

# Paths
BASE_DIR = Path(__file__).resolve().parent
SERVER_DIR = BASE_DIR.parent
UPLOADS_DIR = SERVER_DIR / "uploads"
MODEL_PATH = BASE_DIR / "best.pt"

# Ensure uploads directory exists
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

# Load YOLO model
if not MODEL_PATH.exists():
    raise FileNotFoundError(f"Model file not found at: {MODEL_PATH}")

print(f"[AI Service] Loading model from {MODEL_PATH}...")
model = YOLO(str(MODEL_PATH))
print(f"[AI Service] Model loaded successfully! Classes: {model.names}")

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
    return {
        "status": "online",
        "service": "DengueGuard AI Model",
        "classes": model.names,
    }

@app.post("/predict")
async def predict(
    file: Optional[UploadFile] = File(None),
    image_path: Optional[str] = Form(None),
):
    """
    Runs YOLOv8 object detection on an uploaded image or an existing image on disk.
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

    if result.boxes is not None and len(result.boxes) > 0:
        for box in result.boxes:
            cls_id = int(box.cls[0].item())
            class_name = model.names.get(cls_id, f"Class_{cls_id}")
            conf = float(box.conf[0].item()) * 100
            coords = [round(x, 1) for x in box.xyxy[0].tolist()]

            detected_objects.append({
                "label": class_name,
                "conf": round(conf, 1),
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
        risk = "Low"
        primary_label = "Clean / No Breeding Site Detected"
        max_conf = 95.0
        recommendations.append("No obvious dengue breeding sites detected. Keep surrounding areas clean and free of water-holding debris.")
    elif any(l in HIGH_RISK_CLASSES for l in labels_found) or len(detected_objects) >= 2:
        risk = "High"
        primary_label = f"High Risk: {', '.join(unique_labels)} detected"
    else:
        risk = "Medium"
        primary_label = f"Medium Risk: {', '.join(unique_labels)} detected"

    return {
        "label": primary_label,
        "risk": risk,
        "confidence": round(max_conf, 1),
        "detectedObjects": detected_objects,
        "annotatedImage": f"/uploads/{annotated_filename}",
        "originalImage": f"/uploads/{filename}",
        "recommendations": recommendations,
        "totalDetected": len(detected_objects),
    }

if __name__ == "__main__":
    port = int(os.environ.get("AI_PORT", 5001))
    print(f"[AI Service] Starting server on http://127.0.0.1:{port} ...")
    uvicorn.run(app, host="127.0.0.1", port=port)
