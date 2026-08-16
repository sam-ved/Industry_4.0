from pydantic import BaseModel, Field, validator
from typing import List, Dict, Optional, Union
from enum import Enum
import re

class ModelBackbone(str, Enum):
    YOLOV8N = "yolov8n"
    YOLOV8S = "yolov8s"
    YOLOV8M = "yolov8m"
    YOLOV8L = "yolov8l"

class DetectionParameter(BaseModel):
    id: str
    name: str
    class_id: int
    confidence_threshold: float = Field(ge=0.0, le=1.0, default=0.5)
    color: str = Field(default="#FF0000")
    enabled: bool = True

    @validator('color')
    def validate_color(cls, v):
        if not re.match(r'^#[0-9A-Fa-f]{6}$', v):
            raise ValueError('Color must be a valid hex code, e.g. #FF0000')
        return v

class DatasetConfig(BaseModel):
    dataset_id: str
    dataset_name: str
    defect_types: List[DetectionParameter]
    image_count: int = 0
    total_mb: float = 0.0

class FineTuneConfig(BaseModel):
    model_backbone: ModelBackbone
    epochs: int = Field(ge=10, le=300, default=50)
    batch_size: int = Field(ge=4, le=128, default=16)
    learning_rate: float = Field(ge=1e-5, le=0.1, default=0.001)
    freeze_backbone: bool = False

class FineTuneJobStatus(BaseModel):
    job_id: str
    status: str
    epoch: Optional[int] = 0
    progress: Optional[float] = 0.0
    current_loss: Optional[float] = None
    val_loss: Optional[float] = None
    metrics: Optional[Dict] = None

class ModelRegistryItem(BaseModel):
    model_id: str
    model_name: str
    val_accuracy: Optional[float] = None
    generalization_gap: Optional[float] = None
    status: str

class AutoMLConfig(BaseModel):
    model_type: str
    target_column: str
    pca_variance_threshold: float = Field(ge=0.0, le=1.0, default=0.95)

class AutoMLMetrics(BaseModel):
    r2_score: float
    rmse: float
    mae: float
    pca_components: int
    feature_importance: List[Dict[str, Union[int, float]]]
