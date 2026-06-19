from typing import Optional
from fastapi import APIRouter, UploadFile, File
from backend.services.defect_service import run_defect_detection

router = APIRouter(prefix="/api/defect", tags=["Defect Detection"])


@router.get("/status")
async def defect_status():
    """Returns live mock/model data without an image."""
    data = run_defect_detection()
    return {"status": "ok", "data": data}


@router.post("/analyze")
async def defect_analyze(file: Optional[UploadFile] = File(None)):
    """Run defect detection on uploaded image (optional) + LLM reasoning."""
    image_bytes = await file.read() if file else None
    data = run_defect_detection(image_bytes)
    return {"status": "ok", "data": data}
