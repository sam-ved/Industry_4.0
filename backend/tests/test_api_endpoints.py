import pytest
from fastapi.testclient import TestClient
from backend.main import app
from unittest.mock import patch, MagicMock, AsyncMock

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["data"]["status"] == "online"

@patch("backend.services.dataset_service.DatasetService.get_dataset_stats", new_callable=AsyncMock)
def test_get_dataset_stats_endpoint(mock_stats):
    mock_stats.return_value = {"dataset_id": "ds_123", "image_count": 50}
    
    response = client.get("/api/datasets/ds_123/stats")
    assert response.status_code == 200
    assert response.json()["dataset_id"] == "ds_123"

@patch("backend.services.fine_tune_service.FineTuneService.get_job_status", new_callable=AsyncMock)
def test_get_finetune_status_endpoint(mock_status):
    from backend.models.schemas import FineTuneJobStatus
    mock_status.return_value = FineTuneJobStatus(job_id="job_1", status="training", epoch=10, current_loss=0.5, metrics=None)
    
    response = client.get("/api/finetune/job_1/status")
    assert response.status_code == 200
    assert response.json()["status"] == "training"
    assert response.json()["epoch"] == 10
