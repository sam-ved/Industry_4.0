import os
import io
# pyrefly: ignore [missing-import]
import numpy as np
from PIL import Image, ImageOps
from backend.utils.mock_data import get_ppe_mock
from backend.config.ppe_config import HIGH_CONFIDENCE_THRESHOLD, LOW_CONFIDENCE_THRESHOLD, REQUIRED_PPE

_model = None

def _load_model():
    global _model
    if _model is not None:
        return _model
    
    onnx_path = os.path.join("models", "best_ppe.onnx")
    pt_path = os.path.join("models", "best_ppe.pt")
    
    if os.path.exists(onnx_path):
        model_path = onnx_path
    elif os.path.exists(pt_path):
        model_path = pt_path
    else:
        print("[PPEService] No model file at models/best_ppe.pt — using mock data.")
        return None
        
    try:
        # pyrefly: ignore [missing-import]
        from ultralytics import YOLO
        _model = YOLO(model_path, task='detect')
        print(f"[PPEService] PPE YOLO model loaded successfully from {model_path}.")
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
        transposed = ImageOps.exif_transpose(image)
        if transposed is not None:
            image = transposed
        image = image.convert("RGB")
        w, h = image.size
        # Pass PIL image directly to YOLO to handle RGB->BGR correctly
        results = model(image, conf=0.25, verbose=False)[0]

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

        import time
        start_time = time.time()
        
        # Build deterministic compliance status from detections
        ppe_status_dict = {}
        for req in REQUIRED_PPE:
            ppe_status_dict[req.capitalize()] = "NOT DETECTED"
            
        best_confidences = {}
        
        for d in all_detections:
            if "no_" in d["label"]:
                continue
                
            label = d["label"].capitalize()
            if label not in best_confidences:
                best_confidences[label] = d["confidence"]
            else:
                best_confidences[label] = max(best_confidences[label], d["confidence"])
                
        for req in REQUIRED_PPE:
            req_cap = req.capitalize()
            if req_cap in best_confidences:
                conf = best_confidences[req_cap]
                if conf >= HIGH_CONFIDENCE_THRESHOLD:
                    ppe_status_dict[req_cap] = "DETECTED"
                elif conf >= LOW_CONFIDENCE_THRESHOLD:
                    ppe_status_dict[req_cap] = "NEEDS REVIEW"
                else:
                    ppe_status_dict[req_cap] = "NOT DETECTED"
                    
        # Calculate Risk and overall Status
        compliance_status = "COMPLIANT"
        risk_level = "LOW"
        missing_items = []
        review_items = []
        detected_items = []
        
        for req_cap, status in ppe_status_dict.items():
            if status == "NOT DETECTED":
                missing_items.append(req_cap)
            elif status == "NEEDS REVIEW":
                review_items.append(req_cap)
            elif status == "DETECTED":
                detected_items.append(req_cap)
                
        if missing_items:
            compliance_status = "NON-COMPLIANT"
            risk_level = "HIGH"
        elif review_items:
            compliance_status = "NEEDS REVIEW"
            risk_level = "MEDIUM"
            
        if len(all_detections) == 0:
            compliance_status = "NEEDS REVIEW"
            risk_level = "MEDIUM"
            
        # Deterministic reasoning
        if compliance_status == "COMPLIANT":
            reasoning = "All required PPE items were detected."
        elif compliance_status == "NON-COMPLIANT":
            items_str = " and ".join(missing_items) if len(missing_items) <= 2 else ", ".join(missing_items[:-1]) + ", and " + missing_items[-1]
            verb = "were" if len(missing_items) > 1 else "was"
            reasoning = f"{items_str} {verb} not detected. Worker should wear missing PPE before entering the monitored area."
        else:
            if len(all_detections) == 0:
                reasoning = "No reliable PPE detection was obtained from this image."
            else:
                reasoning = "Some PPE items need review due to low confidence."
        
        proc_time = int((time.time() - start_time) * 1000)
        
        # Backward compatibility for dashboard summary
        compliance_pct = 100.0 if not missing_items else ((len(REQUIRED_PPE) - len(missing_items)) / len(REQUIRED_PPE)) * 100.0
        violation_count = len(missing_items)

        return {
            "compliance_pct": round(compliance_pct, 1),
            "violation_count": violation_count,
            "compliance_status": compliance_status,
            "risk_level": risk_level,
            "ppe_status_dict": ppe_status_dict,
            "reasoning": reasoning,
            "detected_items": detected_items,
            "missing_items": missing_items,
            "review_items": review_items,
            "processing_time_ms": proc_time,
            "source": "model",
            "frame_compliant": compliance_status == "COMPLIANT",
            "all_detections": all_detections,
            "image_width": w,
            "image_height": h
        }
    except Exception as e:
        print(f"[PPEService] Inference error: {e}")
        return {**get_ppe_mock(), "error": str(e)}