from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from typing import Dict, Any, List
import json
import os
from pydantic import BaseModel

from services.ml_studio_service import MLStudioService, TEMP_MODELS_DIR

router = APIRouter(prefix="/ml-studio", tags=["ML Studio"])

class SuggestionRequest(BaseModel):
    file_id: str
    target_column: str

class TrainRequest(BaseModel):
    file_id: str
    target_column: str = None
    features: List[str] = []
    algorithm: str
    task_type: str

class InsightsRequest(BaseModel):
    results: Dict[str, Any]

@router.post("/upload")
async def upload_dataset(file: UploadFile = File(...)):
    """Uploads a dataset and returns summary statistics."""
    try:
        content = await file.read()
        summary = MLStudioService.process_upload(content, file.filename)
        return {"status": "success", "data": summary}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/feature-suggestions")
async def feature_suggestions(req: SuggestionRequest):
    """Provides feature importance suggestions."""
    try:
        suggestions = MLStudioService.suggest_features(req.file_id, req.target_column)
        return {"status": "success", "data": suggestions}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/train")
async def train_model(req: TrainRequest):
    """Trains a model with the specified configuration."""
    try:
        results = MLStudioService.train_model(req.model_dump())
        return {"status": "success", "data": results}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/insights")
async def generate_insights(req: InsightsRequest):
    """Generates AI insights from training results."""
    try:
        insights = MLStudioService.generate_insights(req.results)
        return {"status": "success", "data": insights}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/download-model/{model_id}")
async def download_model(model_id: str):
    """Downloads the trained pickled model."""
    model_path = os.path.join(TEMP_MODELS_DIR, f"{model_id}.pickle")
    if not os.path.exists(model_path):
        raise HTTPException(status_code=404, detail="Model file not found.")
    return FileResponse(
        path=model_path,
        media_type="application/octet-stream",
        filename=f"model_{model_id}.pickle"
    )
