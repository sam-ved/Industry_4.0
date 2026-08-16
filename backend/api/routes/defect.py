import asyncio
from typing import Optional
from fastapi import APIRouter, UploadFile, File
from backend.services.defect_service import run_defect_detection
from backend.services.llm_service import explain_industrial_prediction, explain_individual_detection

router = APIRouter(prefix="/api/defect", tags=["Defect Detection"])


async def _enrich_with_ai(data: dict) -> dict:
    overall_task = explain_industrial_prediction("steel", data)
    individual_tasks = [explain_individual_detection("steel", item) for item in data.get("all_detections", [])]
    
    results = await asyncio.gather(overall_task, *individual_tasks)
    
    llm_insights = results[0]
    for i, item in enumerate(data.get("all_detections", [])):
        item["reasoning"] = results[i + 1]
        
    return {"status": "ok", "data": data, "llm_insights": llm_insights}


@router.get("/status")
async def defect_status():
    """Returns live mock/model data without an image."""
    data = run_defect_detection()
    return await _enrich_with_ai(data)


@router.post("/analyze")
async def defect_analyze(file: Optional[UploadFile] = File(None)):
    """Run defect detection on uploaded image (optional) + LLM reasoning."""
    image_bytes = await file.read() if file else None
    data = run_defect_detection(image_bytes)
    return await _enrich_with_ai(data)
