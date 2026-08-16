import json
import sqlite3
import os
import uuid
from typing import Dict
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from ultralytics import YOLO

from backend.database.db import DB_PATH

router = APIRouter(tags=["Parametrized Inference"])

@router.post("/api/inference/predict")
async def predict_with_parameters(
    model_id: str = Form(...),
    image_file: UploadFile = File(...),
    detection_parameters: str = Form(...) 
) -> Dict:
    """Run inference with runtime parameter filtering."""
    try:
        # Load parameters
        params = json.loads(detection_parameters)
        
        # Get model path
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT model_path FROM model_registry WHERE id = ?", (model_id,))
        row = cursor.fetchone()
        conn.close()
        
        if not row or not os.path.exists(row[0]):
            raise HTTPException(status_code=404, detail="Model not found or invalid path")
            
        model_path = row[0]
        
        # Read image
        content = await image_file.read()
        import tempfile
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as temp:
            temp.write(content)
            temp_path = temp.name
            
        # Inference
        model = YOLO(model_path)
        results = model(temp_path)
        
        detections = []
        if results and len(results) > 0:
            result = results[0]
            boxes = result.boxes
            for box in boxes:
                cls_id = int(box.cls[0].item())
                conf = float(box.conf[0].item())
                
                # Check parameters if class is enabled and meets threshold
                # params structure expected: {"0": {"enabled": true, "confidence_threshold": 0.6, "color": "#FF0000", "name": "crack"}}
                cls_str = str(cls_id)
                if cls_str in params:
                    p = params[cls_str]
                    if p.get("enabled", True) and conf >= p.get("confidence_threshold", 0.5):
                        coords = box.xyxy[0].tolist()
                        detections.append({
                            "class_id": cls_id,
                            "class_name": p.get("name", f"class_{cls_id}"),
                            "confidence": conf,
                            "bbox": coords,
                            "color": p.get("color", "#FF0000")
                        })
                        
        os.unlink(temp_path)
        
        return {
            "status": "success",
            "detections": detections,
            "inference_time_ms": getattr(results[0], 'speed', {}).get('inference', 0.0) if results else 0.0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/inference/batch")
async def batch_inference(
    model_id: str = Form(...),
    dataset_id: str = Form(...)
) -> Dict:
    """Start batch inference (Mocked for now)"""
    batch_job_id = f"batch_{uuid.uuid4().hex[:8]}"
    return {"job_id": batch_job_id, "status": "queued"}

@router.get("/api/inference/batch/{batch_job_id}/progress")
async def get_batch_progress(batch_job_id: str) -> Dict:
    """Get batch progress (Mocked)"""
    return {"job_id": batch_job_id, "progress": 100.0, "status": "completed"}
