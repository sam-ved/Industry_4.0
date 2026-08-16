import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi import UploadFile
from backend.services.dataset_service import DatasetService

@pytest.mark.asyncio
async def test_upload_dataset():
    """Test dataset upload and validation"""
    with patch("backend.services.dataset_service.os.makedirs") as mock_makedirs, \
         patch("backend.services.dataset_service.open", create=True) as mock_open:
        
        mock_file = MagicMock(spec=UploadFile)
        mock_file.filename = "test.jpg"
        mock_file.read = AsyncMock(return_value=b"fakeimagecontent")
        
        mock_ann = MagicMock(spec=UploadFile)
        mock_ann.filename = "test.txt"
        mock_ann.read = AsyncMock(return_value=b"0 0.5 0.5 0.2 0.2")

        res = await DatasetService.upload_dataset("TestDS", [mock_file], [mock_ann])
        
        assert "dataset_id" in res
        assert res["dataset_name"] == "TestDS"
        assert res["image_count"] == 1

@pytest.mark.asyncio
async def test_get_dataset_stats():
    """Test statistics calculation"""
    with patch("backend.services.dataset_service.os.path.exists", return_value=True), \
         patch("backend.services.dataset_service.open", create=True) as mock_open, \
         patch("json.load", return_value={"dataset_id": "ds_123"}), \
         patch("backend.services.dataset_service.DatasetService.parse_yolo_annotations", return_value={"0": 10}):
         
        res = await DatasetService.get_dataset_stats("ds_123")
        assert res["dataset_id"] == "ds_123"
        assert "class_distribution" in res
        assert res["class_distribution"]["0"] == 10
