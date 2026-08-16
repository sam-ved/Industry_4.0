from typing import List, Dict, Any

def format_for_recharts(data: List[float], label_prefix: str = "Time") -> List[Dict[str, Any]]:
    """Format an array of values into Recharts/Chart.js friendly format."""
    return [{"name": f"{label_prefix} {i}", "value": round(val, 4)} for i, val in enumerate(data)]

def generate_histogram_bins(counts: List[int], bins: List[float]) -> List[Dict[str, Any]]:
    """Format histogram numpy output into Recharts friendly format."""
    result = []
    for i in range(len(counts)):
        bin_label = f"{round(bins[i], 2)}-{round(bins[i+1], 2)}"
        result.append({"name": bin_label, "count": int(counts[i])})
    return result
