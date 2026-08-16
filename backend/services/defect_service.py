import os
import io
import numpy as np  # type: ignore
from PIL import Image, ImageOps  # type: ignore
from backend.utils.mock_data import get_defect_mock


# Try to load YOLO — falls back to mock if model file missing
_model = None


def _load_model():
    global _model
    if _model is not None:
        return _model
        
    onnx_path = os.path.join("models", "best.onnx")
    pt_path = os.path.join("models", "best.pt")
    
    if os.path.exists(onnx_path):
        model_path = onnx_path
    elif os.path.exists(pt_path):
        model_path = pt_path
    else:
        print(
            "[DefectService] No model file found at models/best.pt "
            "— using mock data."
        )
        return None
        
    try:
        from ultralytics import YOLO  # type: ignore
        _model = YOLO(model_path, task='detect')
        print(f"[DefectService] YOLOv8 model loaded successfully from {model_path}.")
        return _model
    except Exception as e:
        print(f"[DefectService] Failed to load YOLO: {e}")
        return None


def run_defect_detection(image_bytes: bytes | None = None) -> dict:
    """
    If image_bytes provided → run real YOLOv8 inference.
    Otherwise → return mock data.
    """
    model = _load_model()

    if image_bytes is None or model is None:
        return get_defect_mock()

    try:
        img = Image.open(io.BytesIO(image_bytes))
        transposed = ImageOps.exif_transpose(img)
        if transposed is not None:
            img = transposed
        img = img.convert("RGB")
        img_width, img_height = img.size
        # Pass PIL image directly to YOLO to handle RGB->BGR correctly
        results = model(img, conf=0.25, verbose=False)[0]

        defects = []
        for box in results.boxes:
            cls_id = int(box.cls[0])
            label = model.names[cls_id]
            conf = float(box.conf[0])
            x1, y1, x2, y2 = [int(v) for v in box.xyxy[0].tolist()]
            
            severity = "high" if conf > 0.85 else ("medium" if conf > 0.65 else "low")
            
            defects.append({
                "defect_type": label,
                "confidence": round(conf, 3),
                "bbox": [x1, y1, x2, y2],
                "severity": severity,
            })

        mock_base = get_defect_mock()
        return {
            **mock_base,
            "defect_detected": len(defects) > 0,
            "defect_type": defects[0]["defect_type"] if defects else None,
            "confidence": defects[0]["confidence"] if defects else 0.0,
            "bbox": defects[0]["bbox"] if defects else None,
            "severity": defects[0]["severity"] if defects else None,
            "all_detections": defects,
            "source": "model",
            "image_width": img_width,
            "image_height": img_height,
        }
    except Exception as e:
        print(f"[DefectService] Inference error: {e}")
        return {**get_defect_mock(), "error": str(e)}
