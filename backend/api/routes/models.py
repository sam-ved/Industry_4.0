# backend/routers/models.py
# API endpoints for the new ML Models Hub feature

from fastapi import APIRouter, UploadFile, File, HTTPException
from backend.services.model_service import analyze_with_model
from backend.config.models_config import MODELS
from backend.database import get_analysis_history, get_analytics_stats, init_db

# Initialize database on module import
init_db()

router = APIRouter(prefix="/api/models", tags=["Models Hub"])

@router.get("/list")
async def list_models():
    """Get all available models with metadata"""
    models_list = [
        {
            "id": model_id,
            "name": config["name"],
            "description": config["description"],
            "category": config["category"],
            "supported_inputs": config["supported_inputs"],
            "icon": config["icon"],
            "color": config["color"],
            "avg_execution_time_ms": config["avg_execution_time_ms"],
            "output_format": config["output_format"],
        }
        for model_id, config in MODELS.items()
    ]
    
    return {
        "status": "ok",
        "total_models": len(models_list),
        "models": models_list,
    }

@router.get("/info/{model_id}")
async def get_model_info(model_id: str):
    """Get detailed info about a specific model"""
    if model_id not in MODELS:
        raise HTTPException(status_code=404, detail=f"Model '{model_id}' not found")
    
    config = MODELS[model_id]
    return {
        "status": "ok",
        "model": {
            "id": model_id,
            "name": config["name"],
            "description": config["description"],
            "category": config["category"],
            "supported_inputs": config["supported_inputs"],
            "icon": config["icon"],
            "color": config["color"],
            "version": config["version"],
            "avg_execution_time_ms": config["avg_execution_time_ms"],
            "output_format": config["output_format"],
        }
    }

@router.post("/analyze")
async def analyze_model(model_id: str, file: UploadFile = File(None)):
    """Run analysis on uploaded file with selected model"""
    try:
        if model_id not in MODELS:
            raise HTTPException(status_code=404, detail=f"Model '{model_id}' not found")
        
        model_config = MODELS[model_id]
        
        file_content = None
        file_name = "none"
        
        if file is not None:
            file_name = file.filename or "unknown"
            file_content = await file.read()
            
            # Validate file type
            supported_types: list[str] = model_config.get("supported_inputs", [])
            if file_name.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
                if "image" not in supported_types:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Model '{model_id}' does not support image files. Supported: {supported_types}"
                    )
            elif file_name.lower().endswith('.csv'):
                if "csv" not in supported_types:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Model '{model_id}' does not support CSV files. Supported: {supported_types}"
                    )
            else:
                raise HTTPException(
                    status_code=400,
                    detail=f"Unsupported file type: {file_name}. Supported: .png, .jpg, .jpeg, .webp, .csv"
                )
            
            # File size check (10MB limit)
            if len(file_content) > 10 * 1024 * 1024:
                raise HTTPException(status_code=413, detail="File too large (max 10MB)")
        
        # Run analysis
        result = analyze_with_model(model_id, file_content, file_name)
        
        if result["status"] == "error":
            raise HTTPException(status_code=500, detail=result.get("error", "Analysis failed"))
        
        return result
    except HTTPException as e:
        print(f"[Models API] HTTP Error: {e.status_code} - {e.detail}")
        raise
    except Exception as e:
        print(f"[Models API] Error in analyze endpoint: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history")
async def get_analysis_history_endpoint(limit: int = 50, model_id: str | None = None):
    """Get recent analysis history from database"""
    history = get_analysis_history(limit=limit, model_id=model_id)
    return {
        "status": "ok",
        "total_records": len(history),
        "history": history,
    }

@router.get("/stats")
async def get_analytics():
    """Get analytics statistics"""
    stats = get_analytics_stats()
    return {
        "status": "ok",
        "stats": stats,
    }

@router.get("/batch-models")
async def get_models_by_category(category: str = "all"):
    """Get models filtered by category"""
    filtered = {
        model_id: config
        for model_id, config in MODELS.items()
        if category == "all" or config["category"] == category
    }
    
    models_list = [
        {
            "id": model_id,
            "name": config["name"],
            "description": config["description"],
            "category": config["category"],
            "supported_inputs": config["supported_inputs"],
            "icon": config["icon"],
            "color": config["color"],
        }
        for model_id, config in filtered.items()
    ]
    
    return {
        "status": "ok",
        "category": category,
        "total_models": len(models_list),
        "models": models_list,
    }

@router.get("/status")
async def models_status():
    """Get overall status of models service"""
    return {
        "status": "ok",
        "service": "Models Hub API",
        "total_models": len(MODELS),
        "existing_models": len([m for m in MODELS.values() if m["category"] == "existing"]),
        "ml_models": len([m for m in MODELS.values() if m["category"] == "ml"]),
    }
