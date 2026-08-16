import numpy as np
from typing import List, Dict, Any

def analyze_confidence_distribution(confidences: List[float]) -> Dict[str, Any]:
    if not confidences:
        return {}
    
    arr = np.array(confidences)
    hist, bin_edges = np.histogram(arr, bins=10, range=(0, 1))
    
    low_confidence_count = np.sum(arr < 0.5)
    high_confidence_count = np.sum(arr >= 0.8)
    
    certainty_scores = np.abs(arr - 0.5) * 2  # 0 to 1 scaling
    model_certainty_score = float(np.mean(certainty_scores) * 100)
    
    return {
        "average_confidence": float(np.mean(arr)),
        "low_confidence_alerts": int(low_confidence_count),
        "high_confidence_count": int(high_confidence_count),
        "model_certainty_score": round(model_certainty_score, 2),
        "histogram": {
            "counts": hist.tolist(),
            "bins": bin_edges.tolist()
        }
    }
