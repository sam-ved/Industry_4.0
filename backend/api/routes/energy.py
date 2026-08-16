# pyrefly: ignore [missing-import]
import asyncio
from fastapi import APIRouter, UploadFile, File
from backend.services.energy_service import run_energy_analytics
from backend.services.llm_service import explain_industrial_prediction, explain_individual_detection

router = APIRouter(prefix="/api/energy", tags=["Energy Analytics"])

async def _enrich_with_ai(data: dict) -> dict:
    overall_task = explain_industrial_prediction("energy", data)
    individual_tasks = [explain_individual_detection("energy", item) for item in data.get("anomalies", [])]
    
    results = await asyncio.gather(overall_task, *individual_tasks)
    
    llm_insights = results[0]
    for i, item in enumerate(data.get("anomalies", [])):
        item["reasoning"] = results[i + 1]
        
    return {"status": "ok", "data": data, "llm_insights": llm_insights}


@router.get("/status")
async def energy_status():
    data = run_energy_analytics()
    return await _enrich_with_ai(data)


@router.post("/analyze")
async def energy_analyze(file: UploadFile = File(None)):
    csv_bytes = await file.read() if file else None
    data = run_energy_analytics(csv_bytes)
    return await _enrich_with_ai(data)