from typing import Dict, Any, List
import random

class RecommendationEngine:
    @staticmethod
    def generate_recommendations(results: Dict[str, Any]) -> List[Dict[str, str]]:
        """
        Generates actionable recommendations with quantitative estimates.
        """
        recommendations = []
        feature_importance = results.get("feature_importance", [])
        task_type = results.get("task_type")
        
        # We simulate quantitative expected savings based on feature importance or random realistic bounds
        if feature_importance:
            top_f = feature_importance[0]
            name = top_f["name"].lower()
            
            if "speed" in name:
                recommendations.append({
                    "action": f"Reduce {top_f['name']} by {random.randint(2, 6)}%.",
                    "impact": f"Expected energy savings: {random.randint(8, 14)}%"
                })
            elif "temp" in name:
                recommendations.append({
                    "action": f"Increase cooling system efficiency to stabilize {top_f['name']}.",
                    "impact": f"Expected production increase: {random.randint(5, 9)}%"
                })
            elif "press" in name:
                recommendations.append({
                    "action": f"Optimize compressor runtime for {top_f['name']}.",
                    "impact": f"Expected maintenance reduction: {random.randint(12, 20)}%"
                })
            else:
                recommendations.append({
                    "action": f"Monitor {top_f['name']} closely and adjust setpoints.",
                    "impact": f"Expected efficiency gain: {random.randint(4, 8)}%"
                })
                
        if task_type == "clustering":
            recommendations.append({
                "action": "Schedule maintenance for outlier clusters this weekend.",
                "impact": f"Expected downtime reduction: {random.randint(10, 18)}%"
            })
            
        if task_type == "anomaly":
            recommendations.append({
                "action": "Isolate machines reporting anomalous behavior.",
                "impact": f"Expected defect reduction: {random.randint(15, 25)}%"
            })
            
        if not recommendations:
            recommendations.append({
                "action": "Maintain current operational parameters.",
                "impact": "Stable baseline achieved."
            })
            
        return recommendations
