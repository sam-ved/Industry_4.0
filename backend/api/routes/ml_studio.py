"""
ML Studio Router — Ephemeral ML analysis endpoints.
Structured error responses, request timeout, algorithm passthrough.
"""

import math
import asyncio
import traceback
from typing import Dict, Any, List

import numpy as np
import pandas as pd
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel

from backend.services.ml_studio_service import MLStudioService

router = APIRouter(prefix="/ml-studio", tags=["ML Studio"])


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
        elif hasattr(obj, "item"):
            val = obj.item()
            if isinstance(val, float) and (math.isnan(val) or math.isinf(val)):
                return None
            return val
        return obj
    except Exception as e:
        print(f"Serialization error at field: {field_context}: {e}")
        return None


# ─── Request Schemas ──────────────────────────────────────────────────────────

class SuggestionRequest(BaseModel):
    file_id: str
    target_column: str


class RunRequest(BaseModel):
    file_id: str
    target_column: str | None = None
    features: List[str] = []
    algorithm: str | None = None
    task_type: str | None = None


class InsightsRequest(BaseModel):
    results: Dict[str, Any]


# ─── Structured Error Helper ─────────────────────────────────────────────────

def _structured_error(status_code: int, error_type: str, message: str, suggestion: str = ""):
    """Return a structured error response instead of raw HTTPException."""
    return {
        "status": "error",
        "data": {
            "success": False,
            "status": "failed",
            "error_type": error_type,
            "message": message,
            "suggestion": suggestion,
        }
    }


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/upload")
async def upload_dataset(file: UploadFile = File(...)):
    """Upload a dataset (CSV, XLSX, JSON) and return summary statistics."""
    try:
        content = await file.read()
        summary = MLStudioService.process_upload(content, file.filename or "unknown.csv")
        return {"status": "success", "data": make_json_safe(summary)}
    except ValueError as e:
        return _structured_error(400, "invalid_file", str(e), "Upload a valid CSV, XLSX, or JSON file.")
    except Exception as e:
        print(f"[ML Studio] Upload error: {traceback.format_exc()}")
        return _structured_error(500, "upload_error", str(e), "Check that your file is valid and try again.")


@router.post("/feature-suggestions")
async def feature_suggestions(req: SuggestionRequest):
    """Fast heuristic feature importance ranking."""
    try:
        suggestions = MLStudioService.suggest_features(req.file_id, req.target_column)
        return {"status": "success", "data": make_json_safe(suggestions)}
    except FileNotFoundError as e:
        return _structured_error(404, "dataset_not_found", str(e), "Re-upload your dataset.")
    except ValueError as e:
        return _structured_error(400, "validation_error", str(e))
    except Exception as e:
        print(f"[ML Studio] Feature suggestion error: {traceback.format_exc()}")
        return _structured_error(500, "suggestion_error", str(e))


@router.post("/run")
async def run_analysis(req: RunRequest):
    """
    Run a full ML analysis cycle with timeout protection.
    Supports single-algorithm mode (algorithm="random_forest") and AutoML mode (algorithm=None/"auto").
    """
    try:
        # Run analysis with a 90-second total timeout
        loop = asyncio.get_event_loop()
        results = await asyncio.wait_for(
            loop.run_in_executor(None, MLStudioService.run_analysis, req.model_dump()),
            timeout=90
        )

        safe_results = make_json_safe(results)

        # If the service returned a structured error, pass it through
        if isinstance(safe_results, dict) and safe_results.get("success") is False:
            return {"status": "error", "data": safe_results}

        return {"status": "success", "data": safe_results}

    except asyncio.TimeoutError:
        return {
            "status": "error",
            "data": {
                "success": False,
                "status": "timeout",
                "algorithm": req.algorithm or "auto",
                "error_type": "request_timeout",
                "message": "Analysis exceeded the allowed execution time (90 seconds).",
                "suggestion": "Try a faster algorithm, reduce dataset size, or select fewer features."
            }
        }
    except FileNotFoundError as e:
        return _structured_error(404, "dataset_not_found", str(e), "Re-upload your dataset.")
    except Exception as e:
        print(f"[ML Studio] Run error: {traceback.format_exc()}")
        return _structured_error(500, "analysis_error", str(e), "Check your configuration and try again.")


@router.post("/insights")
async def generate_insights(req: InsightsRequest):
    """Generate AI-powered insights from analysis results."""
    try:
        insights = MLStudioService.generate_insights(req.results)
        return {"status": "success", "data": make_json_safe(insights)}
    except Exception as e:
        print(f"[ML Studio] Insights error: {traceback.format_exc()}")
        return _structured_error(400, "insights_error", str(e))
