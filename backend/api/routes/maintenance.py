import asyncio
from fastapi import APIRouter, UploadFile, File
from backend.services.maintenance_service import run_maintenance_analytics
from backend.services.llm_service import explain_industrial_prediction, explain_individual_detection

router = APIRouter(prefix="/api/maintenance", tags=["Predictive Maintenance"])


async def _enrich_with_ai(data: dict) -> dict:
    overall_task = explain_industrial_prediction("maintenance", data)
    
    # Only explain machines that are critical or warning to save API calls
    at_risk_machines = [m for m in data.get("machines", []) if m.get("status") in ["critical", "warning"]]
    individual_tasks = [explain_individual_detection("maintenance", m) for m in at_risk_machines]
    
    results = await asyncio.gather(overall_task, *individual_tasks)
    
    llm_insights = results[0]
    for i, m in enumerate(at_risk_machines):
        m["reasoning"] = results[i + 1]
        
    return {"status": "ok", "data": data, "llm_insights": llm_insights}


@router.get("/status")
async def maintenance_status():
    data = run_maintenance_analytics()
    return await _enrich_with_ai(data)


@router.post("/analyze")
async def maintenance_analyze(file: UploadFile = File(None), payload: dict | None = None):
    # If a file is uploaded, use it. Otherwise try to use the JSON payload.
    if file:
        file_bytes = await file.read()
        data = run_maintenance_analytics(file_bytes)
    else:
        data = run_maintenance_analytics(payload)
    return await _enrich_with_ai(data)