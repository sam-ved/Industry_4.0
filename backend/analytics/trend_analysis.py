import numpy as np
from typing import List, Dict, Any

def calculate_moving_average(data: List[float], window_size: int = 3) -> List[float]:
    if len(data) < window_size:
        return data
    arr = np.array(data)
    weights = np.repeat(1.0, window_size) / window_size
    ma = np.convolve(arr, weights, 'valid')
    # Pad the beginning with the first element or original data
    padding = [data[i] for i in range(window_size - 1)]
    return padding + ma.tolist()

def calculate_exponential_smoothing(data: List[float], alpha: float = 0.3) -> List[float]:
    if not data:
        return []
    result = [data[0]]
    for i in range(1, len(data)):
        result.append(alpha * data[i] + (1 - alpha) * result[i-1])
    return result

def compute_trend_slope(data: List[float]) -> float:
    if len(data) < 2:
        return 0.0
    x = np.arange(len(data))
    y = np.array(data)
    slope, _ = np.polyfit(x, y, 1)
    return float(slope)

def compute_trend_direction(data: List[float]) -> str:
    slope = compute_trend_slope(data)
    if slope > 0.05:
        return "increasing"
    elif slope < -0.05:
        return "decreasing"
    return "stable"
