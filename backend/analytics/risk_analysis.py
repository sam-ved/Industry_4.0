from typing import Dict, Any

def compute_risk_score(severity: str, likelihood: float, impact_factor: float = 1.0) -> Dict[str, Any]:
    """
    severity: 'low', 'medium', 'high', 'critical'
    likelihood: 0.0 to 1.0 (confidence of prediction)
    impact_factor: multiplier based on equipment/business context
    """
    severity = severity or "medium"
    severity_weights = {
        "low": 20,
        "medium": 50,
        "high": 80,
        "critical": 100
    }
    
    base_severity = severity_weights.get(severity.lower(), 50)
    raw_score = base_severity * likelihood * impact_factor
    risk_score = min(100.0, max(0.0, raw_score))
    
    if risk_score >= 80:
        classification = "CRITICAL"
    elif risk_score >= 60:
        classification = "HIGH"
    elif risk_score >= 30:
        classification = "MEDIUM"
    else:
        classification = "LOW"
        
    return {
        "risk_score": round(risk_score, 2),
        "classification": classification,
        "business_risk": min(100.0, round(risk_score * 0.8, 2)),
        "operational_risk": min(100.0, round(risk_score * 0.9, 2)),
        "safety_risk": min(100.0, round(risk_score * 1.2, 2)) if severity.lower() in ['high', 'critical'] else min(100.0, round(risk_score * 0.5, 2))
    }
