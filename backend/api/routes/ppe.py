import asyncio
from fastapi import APIRouter, UploadFile, File
from backend.services.ppe_service import run_ppe_detection
from backend.services.llm_service import explain_industrial_prediction, explain_individual_detection

router = APIRouter(prefix="/api/ppe", tags=["PPE Monitoring"])

async def _enrich_with_ai(data: dict) -> dict:
    overall_task = explain_industrial_prediction("ppe", data)
    individual_tasks = [explain_individual_detection("ppe", item) for item in data.get("all_detections", [])]
    
    results = await asyncio.gather(overall_task, *individual_tasks)
    
    llm_insights = results[0]
    for i, item in enumerate(data.get("all_detections", [])):
        item["reasoning"] = results[i + 1]
        
    return {"status": "ok", "data": data, "llm_insights": llm_insights}


@router.get("/status")
async def ppe_status():
    data = run_ppe_detection()
    return await _enrich_with_ai(data)


@router.post("/analyze")
async def ppe_analyze(file: UploadFile = File(None)):
    image_bytes = await file.read() if file is not None else None
    data = run_ppe_detection(image_bytes)
    return await _enrich_with_ai(data)