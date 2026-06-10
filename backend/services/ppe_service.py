import os
import io
# pyrefly: ignore [missing-import]
import numpy as np
from PIL import Image, ImageOps
from utils.mock_data import get_ppe_mock

_model = None

def _load_model():
    global _model
    if _model is not None:
        return _model
    model_path = os.path.join("models", "best_ppe.pt")
    if not os.path.exists(model_path):
        print("[PPEService] No model file at models/best_ppe.pt — using mock data.")
        return None
    try:
        # pyrefly: ignore [missing-import]
        from ultralytics import YOLO
        _model = YOLO(model_path)
        print("[PPEService] PPE YOLO model loaded successfully.")
        return _model
    except Exception as e:
        print(f"[PPEService] Failed to load model: {e}")
        return None

# PPE class names expected from your model
PPE_CLASSES = {
    "helmet": True, "no_helmet": False,
    "vest": True,   "no_vest": False,
    "gloves": True, "no_gloves": False,
    "boots": True,  "no_boots": False,
}

def run_ppe_detection(image_bytes: bytes | None = None) -> dict:
    model = _load_model()

    if image_bytes is None or model is None:
        return get_ppe_mock()

    try:
        image = Image.open(io.BytesIO(image_bytes))
        image = ImageOps.exif_transpose(image).convert("RGB")
        w, h = image.size
        img_array = np.array(image)
        results = model(img_array, verbose=False)[0]

        all_detections = []
        for box in results.boxes:
            cls_id = int(box.cls[0])
            label = model.names[cls_id].lower()
            conf = float(box.conf[0])
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            
            all_detections.append({
                "label": label,
                "confidence": round(conf, 3),
                "bbox": [round(x1, 2), round(y1, 2), round(x2, 2), round(y2, 2)]
            })

        # Build compliance summary from detections
        has_helmet = any("helmet" in d["label"] and "no_" not in d["label"] for d in all_detections)
        has_vest   = any("vest" in d["label"]   and "no_" not in d["label"] for d in all_detections)
        has_gloves = any("gloves" in d["label"] and "no_" not in d["label"] for d in all_detections)
        compliant  = has_helmet and has_vest

        import time
        start_time = time.time()
        
        equipment_counts = {}
        equipment_confidences = {}
        
        for d in all_detections:
            if "no_" in d["label"]:
                continue # Skip "no_helmet" etc for detected equipment list
            label = d["label"].capitalize()
            if label not in equipment_counts:
                equipment_counts[label] = 0
                equipment_confidences[label] = []
            equipment_counts[label] += 1
            equipment_confidences[label].append(d["confidence"])
            
        equipment_detected = []
        for label, count in equipment_counts.items():
            equipment_detected.append({
                "name": label,
                "count": count,
                "confidence": round(sum(equipment_confidences[label]) / count, 3)
            })
            
        required = ["Helmet", "Vest", "Gloves"]
        missing_equipment = []
        for req in required:
            if req not in equipment_counts:
                missing_equipment.append(req)
                
        compliance_percentage = 100.0 if not missing_equipment else (len(required) - len(missing_equipment)) / len(required) * 100.0
        
        proc_time = int((time.time() - start_time) * 1000)

        return {
            "compliance_pct": round(compliance_percentage, 1),
            "equipment_detected": equipment_detected,
            "missing_equipment": missing_equipment,
            "processing_time_ms": proc_time,
            "llm_insights": "Action required: Some workers are missing PPE." if missing_equipment else "All required PPE detected successfully.",
            "source": "model",
            "frame_compliant": compliant,
            "all_detections": all_detections,
            "image_width": w,
            "image_height": h
        }
    except Exception as e:
        print(f"[PPEService] Inference error: {e}")
        return {**get_ppe_mock(), "error": str(e)}