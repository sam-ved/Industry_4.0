import pytest
import numpy as np
from unittest.mock import patch, MagicMock
from backend.services.automl_service import AutoMLWithPCA

@pytest.mark.asyncio
async def test_train_automl_model():
    """Test AutoML with PCA training"""
    X = np.random.rand(100, 10)
    y = np.random.rand(100)
    
    with patch("backend.services.automl_service.sqlite3.connect"), \
         patch("backend.services.automl_service.os.makedirs"), \
         patch("backend.services.automl_service.pickle.dump"), \
         patch("backend.ml_models.pca_handler.pickle.dump"), \
         patch("builtins.open"):
        
        # Train should succeed without throwing error
        res = await AutoMLWithPCA.train_automl_model(X, y, "target", "random_forest", 0.95)
        
        assert "model_id" in res
        assert "metrics" in res
        assert "pca_stats" in res
        assert res["pca_stats"]["original_features"] == 10
        assert res["pca_stats"]["reduced_features"] <= 10
        assert "rmse" in res["metrics"]

@pytest.mark.asyncio
async def test_predict_automl():
    """Test AutoML predict"""
    with patch("backend.services.automl_service.sqlite3.connect") as mock_conn, \
         patch("pickle.load") as mock_load, \
         patch("backend.services.automl_service.os.path.exists", return_value=True), \
         patch("builtins.open"):
         
        mock_cursor = MagicMock()
        mock_conn.return_value.cursor.return_value = mock_cursor
        mock_cursor.fetchone.return_value = ["dummy_path"]
        
        mock_pipeline = MagicMock()
        mock_pipeline.predict.return_value = np.array([1.0, 2.0])
        
        mock_pca_data = {
            'pca': MagicMock(),
            'scaler': MagicMock(),
            'variance_threshold': 0.95,
            'n_components': 10,
            'n_features_in': 10
        }
        
        # side_effect will return model first, then pca data
        mock_load.side_effect = [mock_pipeline, mock_pca_data]
        
        X_test = np.random.rand(2, 10)
        preds = await AutoMLWithPCA.predict("model_123", X_test)
        
        assert len(preds) == 2
        assert preds[0] == 1.0
