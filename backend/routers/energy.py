# pyrefly: ignore [missing-import]
from fastapi import APIRouter, UploadFile, File
from backend.services.energy_service import run_energy_analytics

router = APIRouter(prefix="/api/energy", tags=["Energy Analytics"])


@router.get("/status")
async def energy_status():
    data = run_energy_analytics()
    return {"status": "ok", "data": data}


@router.post("/analyze")
async def energy_analyze(file: UploadFile = File(None)):
    csv_bytes = await file.read() if file else None
    data = run_energy_analytics(csv_bytes)
    return {"status": "ok", "data": data}