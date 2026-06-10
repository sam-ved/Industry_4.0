from fastapi import APIRouter, UploadFile, File
from services.ppe_service import run_ppe_detection

router = APIRouter(prefix="/api/ppe", tags=["PPE Monitoring"])


@router.get("/status")
async def ppe_status():
    data = run_ppe_detection()
    return {"status": "ok", "data": data}


@router.post("/analyze")
async def ppe_analyze(file: UploadFile = File(None)):
    image_bytes = await file.read() if file else None
    data = run_ppe_detection(image_bytes)
    return {"status": "ok", "data": data}