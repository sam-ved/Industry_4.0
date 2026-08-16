from typing import Dict, Any, List
from backend.analytics.statistics import compute_descriptive_stats
from backend.analytics.trend_analysis import calculate_moving_average, compute_trend_direction
from backend.analytics.anomaly_analysis import detect_statistical_anomalies
from backend.analytics.confidence_analysis import analyze_confidence_distribution
from backend.analytics.risk_analysis import compute_risk_score
from backend.analytics.recommendation_engine import generate_recommendations
from backend.analytics.visualization_service import format_for_recharts, generate_histogram_bins

def generate_industrial_intelligence(predictions: List[Dict[str, Any]], context: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Central orchestrator that consumes raw predictions and outputs an enterprise IndustrialIntelligenceReport.
    """
    if not predictions:
        return {"status": "no_data"}
        
    # Aggregate data
    confidences = [float(p.get("confidence", 0.0)) for p in predictions]
    severities = [str(p.get("severity", "medium")) for p in predictions]
    types = [str(p.get("defect_type") or p.get("class") or "unknown") for p in predictions]
    
    # 1. Statistics
    stats = compute_descriptive_stats(confidences)
    
    # 2. Confidence & Entropy
    confidence_data = analyze_confidence_distribution(confidences)
    
    # 3. Anomaly Analysis (e.g. on confidence)
    anomalies = detect_statistical_anomalies(confidences)
    
    # 4. Risk Analysis
    max_severity = "low"
    for s in severities:
        s_lower = s.lower()
        if s_lower == "critical": max_severity = "critical"
        elif s_lower == "high" and max_severity != "critical": max_severity = "high"
        elif s_lower == "medium" and max_severity not in ["critical", "high"]: max_severity = "medium"
        
    avg_likelihood = stats.get("mean", 0.5)
    risk_data = compute_risk_score(max_severity, avg_likelihood)
    
    # 5. Recommendation Engine
    dominant_type = max(set(types), key=types.count) if types else "unknown"
    recommendations = generate_recommendations(dominant_type, max_severity)
    
    # 6. Trend Analysis
    ma_trend = calculate_moving_average(confidences, window_size=3)
    direction = compute_trend_direction(confidences)
    
    # 7. Visualization payloads for frontend
    vis_data = {
        "confidence_trend": format_for_recharts(confidences),
        "moving_average": format_for_recharts(ma_trend),
    }
    if "histogram" in confidence_data:
        vis_data["confidence_histogram"] = generate_histogram_bins(
            confidence_data["histogram"]["counts"], 
            confidence_data["histogram"]["bins"]
        )
        del confidence_data["histogram"]
        
    return {
        "summary": {
            "prediction_count": len(predictions),
            "dominant_issue": dominant_type,
            "overall_severity": max_severity,
            "trend_direction": direction
        },
        "descriptive_analytics": stats,
        "confidence_analysis": confidence_data,
        "anomaly_analysis": anomalies,
        "industrial_risk": risk_data,
        "actionable_recommendations": recommendations,
        "visualization_payloads": vis_data
    }
