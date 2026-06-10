from fastapi import APIRouter, UploadFile, File
from services.maintenance_service import run_maintenance_analytics

router = APIRouter(prefix="/api/maintenance", tags=["Predictive Maintenance"])


@router.get("/status")
async def maintenance_status():
    data = run_maintenance_analytics()
    return {"status": "ok", "data": data}


@router.post("/analyze")
async def maintenance_analyze(file: UploadFile = File(None), payload: dict | None = None):
    # If a file is uploaded, use it. Otherwise try to use the JSON payload.
    if file:
        file_bytes = await file.read()
        data = run_maintenance_analytics(file_bytes)
    else:
        data = run_maintenance_analytics(payload)
    return {"status": "ok", "data": data}