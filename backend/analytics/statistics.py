import numpy as np
from typing import Dict, Any, List

def compute_descriptive_stats(data_series: List[float]) -> Dict[str, Any]:
    if not data_series:
        return {}
    
    arr = np.array(data_series)
    arr = arr[~np.isnan(arr)]
    if len(arr) == 0:
        return {}
        
    unique, counts = np.unique(arr, return_counts=True)
    mode_val = unique[np.argmax(counts)] if len(unique) > 0 else arr[0]

    return {
        "mean": float(np.mean(arr)),
        "median": float(np.median(arr)),
        "mode": float(mode_val),
        "variance": float(np.var(arr)),
        "std_dev": float(np.std(arr)),
        "min": float(np.min(arr)),
        "max": float(np.max(arr)),
        "p25": float(np.percentile(arr, 25)),
        "p75": float(np.percentile(arr, 75)),
        "count": int(len(arr))
    }

def compute_dataset_quality_score(missing_values: int, total_values: int) -> float:
    if total_values == 0:
        return 100.0
    missing_ratio = missing_values / total_values
    score = max(0.0, 100.0 - (missing_ratio * 100))
    return round(score, 2)
