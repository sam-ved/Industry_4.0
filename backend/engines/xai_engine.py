import numpy as np
from typing import Dict, Any, List

class XAIEngine:
    """
    Explainable AI (XAI) Engine.
    Provides interpretability for both ML (Feature Importance/SHAP) 
    and CV (Bounding Box reasoning, Attention Maps).
    """
    
    def generate_ml_explanation(self, model: Any, features: np.ndarray, feature_names: List[str] = None) -> Dict[str, Any]:
        """
        Generates feature importance / SHAP approximations.
        """
        explanation = {
            "method": "Tree/Permutation Importance Approximation",
            "top_contributing_features": []
        }
        
        # If the model exposes feature_importances_ (e.g. XGBoost, RandomForest)
        if hasattr(model, "feature_importances_"):
            importances = model.feature_importances_
            
            if feature_names is None or len(feature_names) != len(importances):
                feature_names = [f"Feature_{i}" for i in range(len(importances))]
                
            # Sort features by importance
            sorted_indices = np.argsort(importances)[::-1]
            top_k = min(5, len(importances))
            
            for idx in sorted_indices[:top_k]:
                explanation["top_contributing_features"].append({
                    "feature": feature_names[idx],
                    "importance_score": float(importances[idx])
                })
        else:
            # Fallback approximate attribution based on magnitude if normalized
            explanation["method"] = "Magnitude Approximation"
            if features is not None and len(features) > 0:
                vals = np.abs(features.flatten()) if isinstance(features, np.ndarray) else np.abs(features)
                sorted_indices = np.argsort(vals)[::-1]
                top_k = min(5, len(vals))
                
                if feature_names is None:
                    feature_names = [f"Feature_{i}" for i in range(len(vals))]
                    
                for idx in sorted_indices[:top_k]:
                    explanation["top_contributing_features"].append({
                        "feature": feature_names[idx],
                        "importance_score": float(vals[idx])
                    })
                    
        return explanation

    def generate_cv_explanation(self, detection: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generates CV reasoning (bounding box geometry, false positive indicators).
        """
        confidence = detection.get("confidence", 0.0)
        box = detection.get("box", [])
        
        explanation = {
            "method": "Bounding Box & Confidence Reasoning",
            "reasoning": []
        }
        
        if confidence > 0.8:
            explanation["reasoning"].append("High confidence activation implies strong visual feature match.")
        elif confidence < 0.5:
            explanation["reasoning"].append("Low confidence activation: potential occlusion, blur, or false positive.")
            
        if len(box) == 4:
            x1, y1, x2, y2 = box
            area = (x2 - x1) * (y2 - y1)
            explanation["reasoning"].append(f"Detection occupies area of {area:.1f} pixels.")
            
        # Placeholders for advanced CV XAI
        explanation["attention_map_available"] = False
        explanation["gradcam_available"] = False
        
        return explanation

xai_engine = XAIEngine()
