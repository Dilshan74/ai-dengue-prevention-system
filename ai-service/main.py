from fastapi import FastAPI, UploadFile, File, HTTPException
import uvicorn
from ultralytics import YOLO
from PIL import Image
import io
import os
import logging

app = FastAPI(title="DengueGuard AI Service")

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Constants
MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "best.pt")

# Attempt to load model
try:
    if os.path.exists(MODEL_PATH):
        model = YOLO(MODEL_PATH)
        logger.info("Successfully loaded YOLO model")
    else:
        model = None
        logger.warning(f"Model file not found at {MODEL_PATH}. Inference will fail until model is provided.")
except Exception as e:
    model = None
    logger.error(f"Error loading model: {e}")

@app.get("/")
async def root():
    return {
        "service": "DengueGuard AI Service",
        "status": "online",
        "model_loaded": model is not None,
        "endpoints": {
            "docs": "/docs",
            "predict": "POST /predict"
        }
    }

def assess_risk(predictions_list):
    weights = {
        "Tire": 0.40,
        "Drain-Inlet": 0.30,
        "Vase": 0.20,
        "Coconut-Exocarp": 0.15,
        "Bottle": 0.10
    }
    
    score = 0.0
    for p in predictions_list:
        cls_name = p["class"]
        conf = p["confidence"]
        weight = weights.get(cls_name, 0.0)
        score += (weight * conf)
        
    if len(predictions_list) > 1:
        score *= 1.25
        
    # Categorize score
    if score >= 0.70:
        return "High", "Urgent Breeding Risk Detected"
    elif score >= 0.35:
        return "Medium", "Potential Breeding Site Detected"
    else:
        return "Low", "No Breeding Site Indicators"

@app.post("/predict")
async def predict(image: UploadFile = File(...)):
    if model is None:
        raise HTTPException(status_code=503, detail="Model is not loaded. Please provide best.pt in models folder.")

    try:
        # Read image
        contents = await image.read()
        img = Image.open(io.BytesIO(contents)).convert("RGB")
        
        # Run inference
        results = model.predict(source=img, save=False, conf=0.15, imgsz=640)
        
        predictions = []
        overall_confidence = 0
        
        if results and len(results) > 0:
            result = results[0]
            names = result.names
            
            for box in result.boxes:
                # get bounding box coordinates
                x_min, y_min, x_max, y_max = box.xyxy[0].tolist()
                conf = float(box.conf[0])
                cls = int(box.cls[0])
                label = names[cls]
                
                predictions.append({
                    "class": label,
                    "confidence": round(conf, 4),
                    "bbox": {
                        "x_min": round(x_min, 2), 
                        "y_min": round(y_min, 2), 
                        "x_max": round(x_max, 2), 
                        "y_max": round(y_max, 2)
                    }
                })
                overall_confidence = max(overall_confidence, conf)
                
        # Calculate risk assessment using the new weighted logic
        risk_level, primary_label = assess_risk(predictions)
        
        return {
            "status": "success",
            "predictions": predictions,
            "risk_assessment": risk_level,
            "primary_label": primary_label,
            "overall_confidence": round(overall_confidence * 100, 1) if overall_confidence > 0 else 95.0
        }
        
    except Exception as e:
        logger.error(f"Error during prediction: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
