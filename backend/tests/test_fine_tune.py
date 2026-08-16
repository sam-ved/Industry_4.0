import pytest
from unittest.mock import patch, MagicMock
from backend.services.fine_tune_service import FineTuneService
from backend.models.schemas import FineTuneConfig
import backend.jobs.fine_tune_worker  # Import to make it available for patch

@pytest.mark.asyncio
async def test_start_fine_tune_job():
    """Test job queuing"""
    with patch("backend.services.fine_tune_service.insert_job", return_value=True) as mock_insert, \
         patch("backend.jobs.fine_tune_worker.fine_tune_yolo_model.delay") as mock_delay:
        
        config = FineTuneConfig(model_backbone="yolov8n", epochs=10)
        job_id = await FineTuneService.start_fine_tune_job("ds_123", config)
        
        assert job_id.startswith("job_")
        mock_delay.assert_called_once_with(job_id, config.dict())

@pytest.mark.asyncio
async def test_get_job_status():
    """Test job status retrieval"""
    with patch("backend.services.fine_tune_service.sqlite3.connect") as mock_connect:
        mock_cursor = MagicMock()
        mock_connect.return_value.cursor.return_value = mock_cursor
        
        mock_cursor.fetchone.return_value = {
            "status": "training",
            "epochs_completed": 5,
            "metrics": '{"history": [{"loss": 0.5, "val_loss": 0.4}], "error": null}'
        }
        
        status = await FineTuneService.get_job_status("job_123")
        assert status.status == "training"
        assert status.epoch == 5
        assert status.current_loss == 0.5
