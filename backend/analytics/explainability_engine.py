from typing import Dict, Any, List

class ExplainabilityEngine:
    @staticmethod
    def generate_explanation(feature_importance: List[Dict[str, Any]], target: str, confidence: float, task_type: str) -> str:
        if not feature_importance:
            return f"The model predicts the outcome with {confidence*100:.1f}% confidence, but specific feature contributions could not be determined."

        # Ensure we have directionality (fallback to positive if missing)
        total_imp = sum(abs(f.get("value", 0)) for f in feature_importance)
        
        if total_imp == 0:
            return "Feature contributions are negligibly small."

        explanation_parts = []
        if task_type == "classification":
            explanation_parts.append(f"The model predicts this classification with {confidence*100:.1f}% confidence because:")
        else:
            explanation_parts.append(f"The model predicts the target value with {confidence*100:.1f}% confidence because:")

        for f in feature_importance[:4]: # Take top 4 features
            name = f["name"]
            val = abs(f["value"])
            pct = (val / total_imp) * 100
            direction = f.get("direction", "Positive")
            
            if direction == "Positive":
                explanation_parts.append(f"{name} contributed +{pct:.1f}%")
            else:
                explanation_parts.append(f"{name} reduced outcome by {pct:.1f}%")

        explanation_parts.append(f"Overall confidence is {confidence*100:.1f}%.")
        return "\n".join(explanation_parts)

    @staticmethod
    def generate_shap_payload(feature_importance: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        # Converts standard feature importance into a SHAP waterfall/bar chart compatible format
        if not feature_importance:
            return []
            
        payload = []
        total_imp = sum(abs(f.get("value", 0)) for f in feature_importance)
        
        for f in feature_importance:
            val = abs(f["value"])
            pct = (val / total_imp) * 100 if total_imp > 0 else 0
            direction = f.get("direction", "Positive")
            
            payload.append({
                "feature": f["name"],
                "impact": round(pct, 2) if direction == "Positive" else -round(pct, 2),
                "raw_value": round(f["value"], 4),
                "direction": direction
            })
            
        return sorted(payload, key=lambda x: abs(x["impact"]), reverse=True)
