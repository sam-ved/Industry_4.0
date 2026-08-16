import numpy as np
from typing import List, Dict, Any

def detect_statistical_anomalies(data: List[float], threshold: float = 3.0) -> Dict[str, Any]:
    if not data or len(data) < 3:
        return {"anomaly_count": 0, "anomalies": [], "anomaly_indices": [], "anomaly_rate": 0.0}
        
    arr = np.array(data)
    mean = np.mean(arr)
    std = np.std(arr)
    
    if std == 0:
        return {"anomaly_count": 0, "anomalies": [], "anomaly_indices": [], "anomaly_rate": 0.0}
        
    z_scores = np.abs((arr - mean) / std)
    anomaly_indices = np.where(z_scores > threshold)[0].tolist()
    anomalies = [float(arr[i]) for i in anomaly_indices]
    
    return {
        "anomaly_count": len(anomalies),
        "anomalies": anomalies,
        "anomaly_indices": anomaly_indices,
        "anomaly_rate": round(len(anomalies) / len(data) * 100, 2)
    }
