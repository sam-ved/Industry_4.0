from typing import Dict, Any
import pandas as pd
from backend.core.logger import logger

class AlgorithmSelector:
    """
    Intelligent Algorithm Selection Engine.
    Evaluates dataset properties (size, variance, missing values, class imbalance)
    and problem type to rank and select the best candidate algorithm.
    """
    
    def analyze_dataset(self, df: pd.DataFrame, target_col: str = None) -> Dict[str, Any]:
        """Profiles the dataset to extract heuristics."""
        profile = {
            "num_samples": len(df),
            "num_features": len(df.columns) - (1 if target_col else 0),
            "missing_values_pct": df.isnull().sum().sum() / (df.shape[0] * df.shape[1]),
            "categorical_features": sum(df.dtypes == 'object'),
            "is_imbalanced": False
        }
        
        if target_col and target_col in df.columns:
            val_counts = df[target_col].value_counts(normalize=True)
            if not val_counts.empty and val_counts.iloc[0] > 0.8:
                profile["is_imbalanced"] = True
                
        return profile
        
    def select_best_algorithm(self, problem_type: str, dataset_profile: Dict[str, Any]) -> Dict[str, Any]:
        """
        Ranks and selects the best algorithm based on heuristics.
        """
        candidates = []
        selected = None
        explanation = ""
        
        if problem_type == "classification":
            candidates = ["RandomForest", "XGBoost", "LogisticRegression"]
            
            if dataset_profile.get("num_samples", 0) > 10000 and dataset_profile.get("missing_values_pct", 0) > 0:
                selected = "XGBoost"
                explanation = "XGBoost handles large datasets and missing values effectively natively."
            elif dataset_profile.get("categorical_features", 0) > 5:
                selected = "RandomForest"
                explanation = "RandomForest handles high cardinality categorical features robustly without massive one-hot encoding."
            elif dataset_profile.get("is_imbalanced", False):
                selected = "XGBoost"
                explanation = "XGBoost with scale_pos_weight is ideal for class imbalanced datasets."
            else:
                selected = "RandomForest"
                explanation = "RandomForest is a strong default baseline for classification."
                
        elif problem_type == "regression":
            candidates = ["LinearRegression", "XGBoostRegressor", "RandomForestRegressor"]
            
            if dataset_profile.get("num_samples", 0) > 5000:
                selected = "XGBoostRegressor"
                explanation = "XGBoostRegressor scales better with larger regression datasets."
            else:
                selected = "RandomForestRegressor"
                explanation = "RandomForestRegressor provides robust baseline regression."
                
        elif problem_type == "cv_detection":
            candidates = ["YOLOv8", "FasterRCNN"]
            selected = "YOLOv8"
            explanation = "YOLOv8 provides the best trade-off between real-time inference speed and accuracy for industrial defect/PPE detection."
            
        else:
            selected = "Unknown"
            explanation = "No specific heuristics available for this problem type."
            
        return {
            "selected_algorithm": selected,
            "candidates_evaluated": candidates,
            "selection_reasoning": explanation
        }

algorithm_selector = AlgorithmSelector()
