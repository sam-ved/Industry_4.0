import uuid
from typing import Dict, Any

class RecommendationEngine:
    """
    Generates dynamic recommendations (immediate, preventive, maintenance) 
    based on the root cause and reasoning.
    """
    def generate_recommendations(self, domain: str, prediction: Any, reasoning: Dict[str, Any]) -> Dict[str, Any]:
        severity = reasoning.get("severity", "Low")
        risk = reasoning.get("risk_level", "Low")
        
        recs = {
            "immediate_actions": [],
            "preventive_actions": [],
            "maintenance_suggestions": [],
            "operational_improvements": [],
            "safety_improvements": []
        }
        
        if domain == "cv":
            # Computer Vision typically involves safety/defects
            if severity in ["High", "Critical"]:
                recs["immediate_actions"].append("Halt operations in affected area.")
                recs["immediate_actions"].append("Dispatch human inspector immediately.")
                recs["safety_improvements"].append("Review camera placement and safety protocol compliance.")
            else:
                recs["preventive_actions"].append("Schedule standard review of detection logs.")
                
        elif domain == "ml":
            # ML typically involves predictive maintenance / energy
            if severity in ["High", "Critical"]:
                recs["immediate_actions"].append("Schedule emergency maintenance for flagged equipment.")
                recs["maintenance_suggestions"].append("Check wear and tear on primary components.")
            else:
                recs["maintenance_suggestions"].append("Add to routine checkup cycle.")
                recs["operational_improvements"].append("Monitor telemetry for diverging trends.")
                
        return recs

recommendation_engine = RecommendationEngine()
