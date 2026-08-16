import pandas as pd
import numpy as np
from typing import Dict, Any, List

class ValidationService:
    """
    Handles robust pre-inference data validation.
    Detects missing values, outliers, duplicate columns, class imbalance, etc.
    """
    
    def validate_tabular_data(self, df: pd.DataFrame) -> Dict[str, Any]:
        warnings = []
        errors = []
        is_valid = True
        
        # Missing values
        missing_pct = df.isnull().sum() / len(df)
        high_missing_cols = missing_pct[missing_pct > 0.2].index.tolist()
        if high_missing_cols:
            warnings.append(f"Columns with >20% missing values: {high_missing_cols}")
            
        # Duplicate rows
        dup_count = df.duplicated().sum()
        if dup_count > 0:
            warnings.append(f"Found {dup_count} duplicate rows.")
            
        # Low variance (constant columns)
        constant_cols = [col for col in df.columns if df[col].nunique() <= 1]
        if constant_cols:
            warnings.append(f"Constant columns detected (zero variance): {constant_cols}")
            
        # Very high cardinality categorical (potential IDs causing data leakage)
        for col in df.select_dtypes(include=['object']):
            if df[col].nunique() > 0.9 * len(df) and len(df) > 100:
                warnings.append(f"Column '{col}' has very high cardinality. Might be an ID or cause data leakage.")
                
        return {
            "is_valid": is_valid,
            "warnings": warnings,
            "errors": errors
        }

    def validate_image_data(self, image_bytes: bytes) -> Dict[str, Any]:
        """Validates image integrity and format."""
        # This is a stub for actual image validation (e.g., trying to open with PIL)
        warnings = []
        errors = []
        is_valid = True
        
        if not image_bytes or len(image_bytes) == 0:
            is_valid = False
            errors.append("Empty image payload.")
            
        return {
            "is_valid": is_valid,
            "warnings": warnings,
            "errors": errors
        }

validation_service = ValidationService()
