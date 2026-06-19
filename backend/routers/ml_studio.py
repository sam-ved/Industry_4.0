"""
ML Studio Router — Ephemeral ML analysis endpoints.

No model download.  No pickle storage.  No model registry.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import Dict, Any, List
from pydantic import BaseModel

from backend.services.ml_studio_service import MLStudioService

router = APIRouter(prefix="/ml-studio", tags=["ML Studio"])

import math
import numpy as np
import pandas as pd

def make_json_safe(obj: Any, field_context: str = "root") -> Any:
    """Recursively converts objects to JSON-serializable structures."""
    try:
        if isinstance(obj, dict):
            return {str(k): make_json_safe(v, field_context=f"{field_context}.{k}") for k, v in obj.items()}
        elif isinstance(obj, list):
            return [make_json_safe(v, field_context=f"{field_context}[{i}]") for i, v in enumerate(obj)]
        elif isinstance(obj, tuple):
            return [make_json_safe(v, field_context=f"{field_context}[{i}]") for i, v in enumerate(obj)]
        elif isinstance(obj, np.ndarray):
            return make_json_safe(obj.tolist(), field_context=field_context)
        elif isinstance(obj, (np.float32, np.float64, np.floating)):
            if math.isnan(obj) or math.isinf(obj):
                return None
            return float(obj)
        elif isinstance(obj, (np.int32, np.int64, np.integer)):
            return int(obj)
        elif isinstance(obj, pd.DataFrame):
            return make_json_safe(obj.to_dict(orient="records"), field_context=field_context)
        elif isinstance(obj, pd.Series):
            return make_json_safe(obj.to_dict(), field_context=field_context)
        elif isinstance(obj, float):
            if math.isnan(obj) or math.isinf(obj):
                return None
            return obj
        elif hasattr(obj, "item"):  # numpy scalars sometimes fall through
            val = obj.item()
            if isinstance(val, float) and (math.isnan(val) or math.isinf(val)):
                return None
            return val
        return obj
    except Exception as e:
        print(f"Serialization error at field: {field_context}")
        print(f"Error details: {e}")
        raise


# ─── Request Schemas ──────────────────────────────────────────────────────────

class SuggestionRequest(BaseModel):
    file_id: str
    target_column: str


class RunRequest(BaseModel):
    file_id: str
    target_column: str | None = None
    features: List[str] = []
    algorithm: str
    task_type: str


class InsightsRequest(BaseModel):
    results: Dict[str, Any]


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/upload")
async def upload_dataset(file: UploadFile = File(...)):
    """Upload a dataset (CSV, XLSX, JSON) and return summary statistics."""
    try:
        content = await file.read()
        summary = MLStudioService.process_upload(content, file.filename or "unknown.csv")
        return {"status": "success", "data": summary}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/feature-suggestions")
async def feature_suggestions(req: SuggestionRequest):
    """Quick feature importance ranking via Random Forest."""
    try:
        suggestions = MLStudioService.suggest_features(req.file_id, req.target_column)
        return {"status": "success", "data": suggestions}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/run")
async def run_analysis(req: RunRequest):
    """
    Run a full ML analysis cycle:
    instantiate → fit → evaluate → return results → destroy model.
    """
    try:
        results = MLStudioService.run_analysis(req.model_dump())
        
        # TASK 1 & 2: Diagnostics
        print("--- Diagnostics before returning ---")
        print("type(response):", type(results))
        if isinstance(results, dict):
            for key, value in results.items():
                print(key, type(value))
                
        # Apply JSON safe conversion
        safe_results = make_json_safe(results)
        
        # TASK 6: Add logging before returning
        print("Response Type:", type(safe_results))
        print("Serialized Response Preview:", safe_results)
        
        return {"status": "success", "data": safe_results}
    except Exception as e:
        print(f"Error in /run endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/insights")
async def generate_insights(req: InsightsRequest):
    """Generate AI-powered insights from analysis results via Gemini."""
    try:
        insights = MLStudioService.generate_insights(req.results)
        return {"status": "success", "data": make_json_safe(insights)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
