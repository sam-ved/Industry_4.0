from typing import Any, Dict
from backend.services.validation_service import validation_service
from backend.services.analytics_service import analytics_service
from backend.engines.algorithm_selector import algorithm_selector
from backend.engines.model_manager import model_manager
from backend.engines.xai_engine import xai_engine
from backend.engines.reasoning_engine import reasoning_engine
from backend.engines.recommendation_engine import recommendation_engine
from backend.core.logger import logger
import pandas as pd

class UniversalPipeline:
    """
    Universal Inference Pipeline for all data types.
    Orchestrates Validation -> Profiling -> Algorithm Selection -> Inference -> XAI -> Reasoning -> Recommendations.
    """
    
    def process_tabular(self, df: pd.DataFrame, target_col: str = None, problem_type: str = "classification") -> Dict[str, Any]:
        logger.info("Starting universal pipeline for tabular data")
        
        # 1. Validation
        val_result = validation_service.validate_tabular_data(df)
        if not val_result["is_valid"]:
            return {"status": "error", "message": "Validation failed", "errors": val_result["errors"]}
            
        # 2. Data Profiling & Analytics
        profile = algorithm_selector.analyze_dataset(df, target_col)
        
        # 3. Algorithm Selection
        algo_selection = algorithm_selector.select_best_algorithm(problem_type, profile)
        logger.info(f"Selected algorithm: {algo_selection['selected_algorithm']}")
        
        # 4. Feature Engineering / Preprocessing (Mocked for now)
        X = df.drop(columns=[target_col]) if target_col and target_col in df.columns else df
        
        # 5. Inference (Assuming model is loaded by model_manager, mock for pipeline flow)
        # model = model_manager.get_model(algo_selection['selected_algorithm'] + ".pkl", "sklearn")
        # y_pred = model.predict(X)
        y_pred = [0] * len(df) # Mock
        y_prob = [0.9] * len(df) # Mock
        confidence = 0.9
        
        # 6. Analytics
        analytics = analytics_service.generate_classification_analytics(None, y_pred, y_prob)
        
        # 7. XAI
        xai = xai_engine.generate_ml_explanation(None, X.values, X.columns.tolist())
        
        # 8. Reasoning
        reasoning = reasoning_engine.analyze("ml", "Anomaly" if sum(y_pred) > 0 else "Normal", confidence, X.values)
        reasoning["contributing_features"] = xai.get("top_contributing_features", [])
        
        # 9. Recommendations
        recs = recommendation_engine.generate_recommendations("ml", "Anomaly", reasoning)
        
        return {
            "status": "success",
            "warnings": val_result["warnings"],
            "analytics": analytics,
            "xai": xai,
            "reasoning": reasoning,
            "recommendations": recs,
            "predictions": y_pred
        }
        
    def process_cv(self, image_bytes: bytes, domain: str = "cv_detection") -> Dict[str, Any]:
        logger.info("Starting universal pipeline for CV data")
        
        # 1. Validation
        val_result = validation_service.validate_image_data(image_bytes)
        if not val_result["is_valid"]:
            return {"status": "error", "message": "Validation failed", "errors": val_result["errors"]}
            
        # 2. Algorithm Selection
        algo_selection = algorithm_selector.select_best_algorithm(domain, {})
        
        # 3. Inference (Mocked for pipeline flow)
        # model = model_manager.get_model("best.pt", "yolo")
        # results = model(image_bytes)
        mock_detection = {"class": "defect", "confidence": 0.88, "box": [10, 10, 100, 100]}
        
        # 4. Analytics
        analytics = analytics_service.generate_cv_analytics([mock_detection])
        
        # 5. XAI
        xai = xai_engine.generate_cv_explanation(mock_detection)
        
        # 6. Reasoning
        reasoning = reasoning_engine.analyze("cv", mock_detection["class"], mock_detection["confidence"])
        
        # 7. Recommendations
        recs = recommendation_engine.generate_recommendations("cv", mock_detection["class"], reasoning)
        
        return {
            "status": "success",
            "warnings": val_result["warnings"],
            "analytics": analytics,
            "xai": xai,
            "reasoning": reasoning,
            "recommendations": recs,
            "detections": [mock_detection]
        }

universal_pipeline = UniversalPipeline()
