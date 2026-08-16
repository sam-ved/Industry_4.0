import os
import threading
from typing import Dict, Any, Optional
import joblib
from backend.core.logger import logger


class ModelManager:
    """
    Centralized model manager to handle model lifecycles.
    Ensures models are loaded exactly once (lazy loading) and cached in memory.
    Supports .pt (YOLO) and .pkl (Scikit-learn/XGBoost/etc.) models.
    """
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super(ModelManager, cls).__new__(cls)
                    cls._instance.models = {}
                    cls._instance.model_locks = {}
        return cls._instance

    def _get_model_lock(self, model_name: str) -> threading.Lock:
        if model_name not in self.model_locks:
            with self._lock:
                if model_name not in self.model_locks:
                    self.model_locks[model_name] = threading.Lock()
        return self.model_locks[model_name]

    def load_model(self, model_path: str, model_type: str = "sklearn") -> Optional[Any]:
        """
        Loads a model by path.
        model_type: 'sklearn', 'xgboost', 'yolo'
        """
        model_name = os.path.basename(model_path)
        
        # Fast path if already loaded
        if model_name in self.models:
            return self.models[model_name]
            
        model_lock = self._get_model_lock(model_name)
        
        with model_lock:
            # Double checked locking
            if model_name in self.models:
                return self.models[model_name]
                
            logger.info(f"Loading model into memory: {model_name}")
            
            try:
                if not os.path.exists(model_path):
                    logger.error(f"Model path does not exist: {model_path}")
                    return None
                    
                if model_type in ["sklearn", "xgboost", "pickle"]:
                    model = joblib.load(model_path)
                elif model_type == "yolo":
                    try:
                        from ultralytics import YOLO
                        model = YOLO(model_path)
                    except ImportError:
                        logger.error("ultralytics is not installed. Cannot load YOLO model.")
                        return None
                else:
                    logger.error(f"Unsupported model type: {model_type}")
                    return None
                    
                self.models[model_name] = model
                logger.info(f"Successfully loaded {model_name}")
                return model
                
            except Exception as e:
                logger.error(f"Failed to load model {model_name}", exc_info=True)
                return None

    def get_model(self, model_path: str, model_type: str = "sklearn") -> Optional[Any]:
        """Get model, loading it if necessary."""
        return self.load_model(model_path, model_type)
        
    def unload_model(self, model_name: str) -> bool:
        """Unload a model to free memory."""
        with self._lock:
            if model_name in self.models:
                del self.models[model_name]
                logger.info(f"Unloaded model {model_name}")
                return True
        return False

# Global instance
model_manager = ModelManager()
