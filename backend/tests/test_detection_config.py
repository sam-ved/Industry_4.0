import pytest
from unittest.mock import patch
from backend.services.detection_config_service import DetectionConfigService
from backend.models.schemas import DetectionParameter

@pytest.mark.asyncio
async def test_create_detection_config():
    """Test parameter creation"""
    with patch("backend.services.detection_config_service.sqlite3.connect"), \
         patch("backend.services.detection_config_service.DetectionConfigService.generate_dataset_yaml") as mock_gen:
        
        params = [
            DetectionParameter(id="dt_1", name="crack", class_id=0, confidence_threshold=0.5, color="#FF0000")
        ]
        res = await DetectionConfigService.create_detection_config("ds_123", params)
        assert res["status"] == "success"
        mock_gen.assert_called_once_with("ds_123")

@pytest.mark.asyncio
async def test_generate_dataset_yaml():
    """Test YOLO dataset.yaml generation"""
    with patch("backend.services.detection_config_service.DetectionConfigService.get_detection_parameters") as mock_get, \
         patch("backend.services.detection_config_service.os.makedirs"), \
         patch("backend.services.detection_config_service.open", create=True):
        
        mock_get.return_value = [
            DetectionParameter(id="dt_1", name="crack", class_id=0, confidence_threshold=0.5, color="#FF0000")
        ]
        
        await DetectionConfigService.generate_dataset_yaml("ds_123")
        # Just testing it doesn't crash given the mocks
