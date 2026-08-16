from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import List, Dict
from backend.services.dataset_service import DatasetService

router = APIRouter(tags=["Datasets"])

@router.post("/api/datasets/upload")
async def upload_dataset(
    dataset_name: str = Form(...),
    files: List[UploadFile] = File(...),
    annotations: List[UploadFile] = File(...)
) -> Dict:
    """Upload a dataset and its YOLO annotations."""
    return await DatasetService.upload_dataset(dataset_name, files, annotations)

@router.get("/api/datasets/{dataset_id}/stats")
async def get_dataset_stats(dataset_id: str) -> Dict:
    """Get statistics for a dataset."""
    return await DatasetService.get_dataset_stats(dataset_id)

@router.delete("/api/datasets/{dataset_id}")
async def delete_dataset(dataset_id: str) -> Dict:
    """Delete a dataset from disk."""
    success = await DatasetService.delete_dataset(dataset_id)
    return {"status": "success" if success else "failed"}
