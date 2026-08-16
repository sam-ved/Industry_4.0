from typing import Dict, Any, List
import numpy as np
from backend.analytics.analyzer import generate_industrial_intelligence

class AnalyticsService:
    """
    Generates advanced analytics automatically using the new Enterprise Analytics Engine.
    """
    def generate_classification_analytics(self, y_true: Any, y_pred: Any, y_prob: Any = None) -> Dict[str, Any]:
        predictions = []
        if y_pred is not None:
            for i in range(len(y_pred)):
                conf = float(y_prob[i]) if y_prob is not None and i < len(y_prob) else 1.0
                predictions.append({
                    "class": str(y_pred[i]),
                    "confidence": conf,
                    "severity": "medium"
                })
        
        report = generate_industrial_intelligence(predictions)
        # Backward compatibility
        if "summary" in report:
            report["prediction_distribution"] = {report["summary"].get("dominant_issue", "unknown"): len(predictions)}
        return report

    def generate_cv_analytics(self, detections: List[Dict[str, Any]]) -> Dict[str, Any]:
        report = generate_industrial_intelligence(detections)
        # Backward compatibility
        classes = [d.get("class", "unknown") for d in detections]
        unique, counts = np.unique(classes, return_counts=True) if classes else ([], [])
        report["top_detected_classes"] = dict(zip(unique.tolist(), counts.tolist()))
        return report

analytics_service = AnalyticsService()
