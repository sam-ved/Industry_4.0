from fastapi import APIRouter, Body
from typing import Dict
from backend.models.schemas import FineTuneConfig, FineTuneJobStatus
from backend.services.fine_tune_service import FineTuneService

router = APIRouter(tags=["Fine Tuning"])

@router.post("/api/finetune/start")
async def start_fine_tune(payload: dict = Body(...)) -> Dict:
    """Start a fine-tuning job."""
    dataset_id = payload.get("dataset_id")
    config = FineTuneConfig(**payload)
    job_id = await FineTuneService.start_fine_tune_job(dataset_id, config)
    return {"job_id": job_id, "status": "queued"}

@router.get("/api/finetune/{job_id}/status")
async def get_job_status(job_id: str) -> FineTuneJobStatus:
    """Get the status of a fine-tuning job."""
    return await FineTuneService.get_job_status(job_id)

@router.post("/api/finetune/{job_id}/cancel")
async def cancel_job(job_id: str) -> Dict:
    """Cancel a fine-tuning job."""
    success = await FineTuneService.cancel_job(job_id)
    return {"status": "success" if success else "failed"}

@router.get("/api/finetune/{job_id}/metrics")
async def get_detailed_metrics(job_id: str) -> Dict:
    """Get detailed metrics for a fine-tuning job."""
    status = await FineTuneService.get_job_status(job_id)
    return status.metrics or {}
