import pandas as pd
import numpy as np
from typing import Dict, List
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Body
from backend.services.automl_service import AutoMLWithPCA

router = APIRouter(tags=["AutoML"])

@router.post("/api/automl/train")
async def train_automl_model(
    csv_file: UploadFile = File(...),
    target_column: str = Form(...),
    task_type: str = Form("regression"),
    pca_variance_threshold: float = Form(0.95)
) -> Dict:
    """Train AutoML model with PCA feature extraction and generate leaderboard."""
    try:
        df = pd.read_csv(csv_file.file)
        
        if target_column not in df.columns:
            raise HTTPException(status_code=400, detail=f"Target column '{target_column}' not found in CSV")
            
        y = df[target_column].values
        X_df = df.drop(columns=[target_column])
        
        # Simple imputation for NaNs if any
        X_df = X_df.fillna(X_df.mean())
        X = X_df.values
        
        result = await AutoMLWithPCA.train_automl_model(
            X=X, 
            y=y, 
            target_col=target_column, 
            task_type=task_type, 
            pca_variance_threshold=pca_variance_threshold
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/automl/{model_id}/predict")
async def predict_automl(
    model_id: str,
    data: List[List[float]] = Body(...)
) -> Dict:
    """Make predictions using trained AutoML model."""
    try:
        X = np.array(data)
        predictions = await AutoMLWithPCA.predict(model_id, X)
        return {
            "model_id": model_id,
            "predictions": predictions.tolist()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/automl/{model_id}/info")
async def get_automl_info(model_id: str) -> Dict:
    """Get metadata for an AutoML model."""
    return await AutoMLWithPCA.get_model_info(model_id)
