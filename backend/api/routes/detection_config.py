from fastapi import APIRouter, Body
from typing import List, Dict
from backend.models.schemas import DetectionParameter
from backend.services.detection_config_service import DetectionConfigService

router = APIRouter(tags=["Detection Config"])

@router.post("/api/parameters/create")
async def create_detection_config(payload: dict = Body(...)) -> Dict:
    """Create a new detection configuration."""
    dataset_id = payload.get("dataset_id")
    defect_types_raw = payload.get("defect_types", [])
    defect_types = [DetectionParameter(**dt) for dt in defect_types_raw]
    return await DetectionConfigService.create_detection_config(dataset_id, defect_types)

@router.get("/api/parameters/{dataset_id}/all")
async def get_all_parameters(dataset_id: str) -> List[DetectionParameter]:
    """Get all detection parameters for a dataset."""
    return await DetectionConfigService.get_detection_parameters(dataset_id)

@router.put("/api/parameters/{param_id}")
async def update_parameter(param_id: str, updates: Dict = Body(...)) -> Dict:
    """Update specific attributes of a detection parameter."""
    return await DetectionConfigService.update_parameter(param_id, updates)

@router.get("/api/parameters/{dataset_id}/mapping")
async def get_class_mapping(dataset_id: str) -> Dict:
    """Get a mapping of class_id to class name."""
    return await DetectionConfigService.get_class_mapping(dataset_id)
