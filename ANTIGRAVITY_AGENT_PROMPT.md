# Antigravity Agent Prompt
## Complete Implementation of Industry 4.0 AI Control Center - Generalization, Self-Training & AutoML

---

## **🎯 MISSION**

Implement a complete, production-ready **Model Generalization & Self-Training System** for the CDAC Industry 4.0 AI Control Center. This includes:

1. ✅ **Model Generalization Framework** (YOLOv8 transfer learning with metrics)
2. ✅ **User-Parametrized Detection System** (dynamic defect type configuration)
3. ✅ **Self-Training Pipeline** (Celery-based fine-tuning orchestration)
4. ✅ **AutoML with PCA** (feature reduction for energy/maintenance CSV models)
5. ✅ **Complete Frontend UI** (dataset upload, training monitor, parametrized inference)
6. ✅ **Database Schema** (SQLite with proper indexing)
7. ✅ **API Endpoints** (all CRUD + training endpoints)
8. ✅ **Testing & Deployment** (unit tests, docker setup)

**Deliverables**: Fully functional codebase that a developer can immediately deploy to production.

---

## **📋 PROJECT CONTEXT**

**Existing Stack**:
- Frontend: React 18 + Vite + TailwindCSS + Framer Motion
- Backend: Python FastAPI + SQLite + Celery
- ML: YOLOv8 (Ultralytics) + scikit-learn + XGBoost
- Current modules: Steel Defect Detection, PPE Compliance, Energy Analytics, Predictive Maintenance

**Reference Documentation**:
- Full implementation plan: See `IMPLEMENTATION_PLAN.md` (9 parts, all details included)
- Quick start code: See `QUICK_START_IMPLEMENTATION.md` (database schema, models, services)

**Current Project Structure**:
```
.
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── database/
│   │   └── db.py
│   ├── config/
│   │   └── models_config.py
│   ├── services/
│   │   ├── defect_service.py
│   │   ├── ppe_service.py
│   │   ├── energy_service.py
│   │   ├── maintenance_service.py
│   │   └── llm_service.py
│   ├── routers/
│   │   ├── defect.py
│   │   ├── ppe.py
│   │   ├── energy.py
│   │   └── maintenance.py
│   ├── utils/
│   │   ├── model_loader.py
│   │   └── mock_data.py
│   └── ml_models/
│       └── (custom ML handlers)
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## **🔧 PHASE 1: DATABASE & BACKEND MODELS (Day 1-2)**

### **1.1 Create Database Schema**

**File**: `backend/database/schema.sql`

Implement the complete schema from `QUICK_START_IMPLEMENTATION.md`:
- `datasets` table (id, name, image_count, total_mb, status, upload_date)
- `defect_types` table (id, dataset_id, name, class_id, confidence_threshold, color)
- `fine_tune_jobs` table (id, dataset_id, status, epochs_completed, metrics)
- `model_registry` table (id, model_name, val_accuracy, status, model_path)
- `inference_results` table (id, model_id, detections_json, inference_time_ms)
- `automl_models` table (id, model_type, pca_variance, metrics_json)
- Proper indices for performance (status, dataset_id, model_id)

**Implementation Notes**:
- Use SQLite with proper data types
- Add created_at / updated_at TIMESTAMP fields
- Use CASCADE delete for foreign keys
- No modifications to existing tables; only new tables

---

### **1.2 Create Pydantic Models**

**File**: `backend/models/schemas.py`

Implement all schemas:
```python
- DetectionParameter (id, name, class_id, confidence_threshold, color, enabled)
- DatasetConfig (dataset_id, dataset_name, defect_types[], image_count, total_mb)
- FineTuneConfig (model_backbone, epochs, batch_size, learning_rate, freeze_backbone)
- FineTuneJobStatus (job_id, status, epoch, progress, current_loss, val_loss, metrics)
- ModelRegistryItem (model_id, model_name, val_accuracy, generalization_gap, status)
- AutoMLConfig (model_type, target_column, pca_variance_threshold)
- AutoMLMetrics (r2_score, rmse, mae, pca_components, feature_importance)
```

**Validation**:
- confidence_threshold: 0.0-1.0
- epochs: 10-300
- batch_size: 4-128
- learning_rate: 1e-5 to 0.1
- model_backbone: enum (yolov8n, yolov8s, yolov8m, yolov8l)
- Color: hex regex (#[0-9A-Fa-f]{6})

---

### **1.3 Database Utilities**

**File**: `backend/database/db.py` (MODIFY existing)

Add functions:
```python
def init_db() -> None:
    """Run schema.sql on startup"""
    
def get_dataset(dataset_id: str) -> Dict:
    """Fetch dataset by ID"""
    
def get_all_defect_types(dataset_id: str) -> List[DetectionParameter]:
    """Fetch all detection parameters for a dataset"""
    
def insert_job(job_id: str, dataset_id: str, config: FineTuneConfig) -> bool:
    """Insert fine-tuning job into DB"""
    
def update_job_progress(job_id: str, epoch: int, loss: float, val_loss: float) -> bool:
    """Update training progress"""
    
def register_model(job_id: str, model_path: str, metrics: Dict) -> str:
    """Register trained model in registry, return model_id"""
```

**Important**: Do NOT modify existing functions. Only add new functions.

---

## **🔧 PHASE 2: BACKEND SERVICES (Day 3-4)**

### **2.1 Dataset Service**

**File**: `backend/services/dataset_service.py` (NEW)

```python
class DatasetService:
    async def upload_dataset(dataset_name: str, files: List[UploadFile], annotations: List[UploadFile]) -> Dict
    async def get_dataset_stats(dataset_id: str) -> Dict
    async def validate_dataset_quality(dataset_id: str) -> Dict
    async def delete_dataset(dataset_id: str) -> bool
    async def parse_yolo_annotations(dataset_id: str) -> Dict
```

**Features**:
- Save images to `datasets/{dataset_id}/images/`
- Save annotations to `datasets/{dataset_id}/labels/`
- Create `metadata.json` with dataset info
- Validate: min 50 images per class, resolution >= 416x416
- Calculate class distribution statistics
- Check for duplicate images (hash-based)

**Error Handling**: HTTPException 400 for validation failures, 404 for not found.

---

### **2.2 Detection Config Service**

**File**: `backend/services/detection_config_service.py` (NEW)

```python
class DetectionConfigService:
    async def create_detection_config(dataset_id: str, defect_types: List[DetectionParameter]) -> Dict
    async def get_detection_parameters(dataset_id: str) -> List[DetectionParameter]
    async def update_parameter(param_id: str, updates: Dict) -> Dict
    async def generate_dataset_yaml(dataset_id: str) -> None
    async def get_class_mapping(dataset_id: str) -> Dict
```

**Features**:
- Generate YOLO `dataset.yaml` file (path, train/val/test, nc, names)
- Store parameters in `defect_types` table
- Allow runtime updates to confidence_threshold, min_area_pixels, enabled status
- Return class ID to class name mapping

**Output**: `datasets/{dataset_id}/dataset.yaml`

---

### **2.3 Fine-Tuning Service**

**File**: `backend/services/fine_tune_service.py` (NEW)

```python
class FineTuneService:
    async def start_fine_tune_job(config: FineTuneConfig) -> str  # Returns job_id
    async def get_job_status(job_id: str) -> FineTuneJobStatus
    async def cancel_job(job_id: str) -> bool
    async def list_all_jobs(status: Optional[str] = None) -> List[FineTuneJobStatus]
```

**Features**:
- Queue Celery task: `fine_tune_yolo_model.delay(job_id, config.dict())`
- Store job metadata in DB
- Poll Celery result to get training progress
- Calculate ETA based on epoch completion rate
- Return job_id immediately (async pattern)

---

### **2.4 Generalization Metrics Service**

**File**: `backend/utils/metrics_calculator.py` (NEW)

```python
class GeneralizationMetrics:
    @staticmethod
    def compute_generalization_gap(train_metrics: Dict, val_metrics: Dict, test_metrics: Dict) -> Dict
    @staticmethod
    def detect_overfitting(train_loss_history: List[float], val_loss_history: List[float]) -> Dict
    @staticmethod
    def compute_per_class_metrics(results) -> Dict
    @staticmethod
    def compute_model_robustness(test_results_on_variations: Dict) -> float
```

**Returns**:
```python
{
    "train_accuracy": 0.92,
    "val_accuracy": 0.87,
    "test_accuracy": 0.85,
    "generalization_gap": 0.05,
    "quality_score": "Excellent/Good/Acceptable/Poor",
    "overfitting_detected": False,
    "recommendations": ["..."]  # If issues found
}
```

---

### **2.5 PCA Feature Extractor**

**File**: `backend/ml_models/pca_handler.py` (NEW)

```python
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
import pickle

class PCAFeatureExtractor:
    def __init__(self, n_components: int = 50, variance_threshold: float = 0.95)
    def fit(self, X_train: np.ndarray) -> Dict
    def transform(self, X: np.ndarray) -> np.ndarray
    def get_feature_importance(self) -> List[Tuple[int, float]]
    def save(self, filepath: str) -> None
    def load(self, filepath: str) -> None
```

**Fit returns**:
```python
{
    "n_components_selected": 45,
    "explained_variance_ratio": [0.15, 0.08, ...],
    "cumulative_variance": 0.95,
    "original_features": 1000,
    "reduced_features": 45,
    "compression_ratio": "4.5%"
}
```

**Key**: Preserve scaler + PCA model for inference.

---

### **2.6 AutoML Service**

**File**: `backend/services/automl_service.py` (NEW)

```python
class AutoMLWithPCA:
    async def train_automl_model(csv_data: np.ndarray, target_col: str, model_type: str) -> Dict
    async def predict(model_id: str, X: np.ndarray) -> np.ndarray
    async def get_model_info(model_id: str) -> Dict
```

**Supported Models**: random_forest, xgboost, linear_regression

**Workflow**:
1. Load CSV as numpy array
2. Fit PCA on features (n_components=50, var_threshold=0.95)
3. Transform features
4. Train-test split (80-20)
5. Train selected model
6. Calculate metrics (r2, rmse, mae)
7. Save model + PCA + metrics to DB + disk

**Output**: model_id for future predictions

---

## **🔧 PHASE 3: CELERY FINE-TUNING WORKER (Day 5)**

### **3.1 Celery Setup**

**File**: `backend/celery_app.py` (NEW)

```python
from celery import Celery

app = Celery('industry40')
app.config_from_object('backend.config.celery_config')
app.autodiscover_tasks(['backend.jobs'])
```

**File**: `backend/config/celery_config.py` (NEW)

```python
broker_url = 'redis://localhost:6379/0'
result_backend = 'redis://localhost:6379/1'
task_serializer = 'json'
accept_content = ['json']
result_serializer = 'json'
timezone = 'UTC'
enable_utc = True
task_track_started = True
task_time_limit = 30 * 60  # 30 minutes
```

---

### **3.2 Fine-Tuning Worker**

**File**: `backend/jobs/fine_tune_worker.py` (NEW)

```python
from celery import shared_task
from ultralytics import YOLO
import sqlite3

@shared_task(bind=True)
def fine_tune_yolo_model(self, job_id: str, config_dict: dict):
    """
    Celery task to fine-tune YOLOv8 on user dataset
    
    Steps:
    1. Update DB status to 'training'
    2. Load base YOLOv8 model
    3. Freeze backbone layers if requested
    4. Load dataset.yaml
    5. Train with callbacks for progress
    6. Validate & compute generalization metrics
    7. Register model in registry
    8. Update DB status to 'completed'
    """
    pass
```

**Training Parameters**:
- Device: GPU (device=0) or CPU (device='cpu')
- Callbacks: Update DB every epoch with metrics
- Early stopping: patience=15, monitor val_loss
- Learning rate: Use config.learning_rate (default 0.001)
- Project path: `runs/detect/finetune_{job_id}/`
- Save best checkpoint automatically

**Critical**: Use try-except wrapper:
```python
try:
    # Training code
except Exception as e:
    update_job_status(job_id, 'failed', str(e))
    raise
```

---

### **3.3 Job Status Helpers**

**File**: `backend/jobs/helpers.py` (NEW)

```python
def update_job_status(job_id: str, status: str, error: Optional[str] = None):
    """Update fine_tune_jobs.status in DB"""

def update_epoch_metrics(job_id: str, epoch: int, loss: float, val_loss: float, 
                         train_acc: Optional[float] = None, val_acc: Optional[float] = None):
    """Update after each epoch"""

def register_model_in_db(job_id: str, dataset_id: str, base_model: str, 
                         val_accuracy: float, test_accuracy: float, model_path: str) -> str:
    """Register trained model, return model_id"""
```

---

## **🔧 PHASE 4: API ENDPOINTS (Day 6-7)**

### **4.1 Dataset Upload Endpoints**

**File**: `backend/routers/datasets.py` (NEW)

```python
@router.post("/api/datasets/upload")
async def upload_dataset(
    dataset_name: str,
    files: List[UploadFile],
    annotations: List[UploadFile]
) -> Dict

@router.get("/api/datasets/{dataset_id}/stats")
async def get_dataset_stats(dataset_id: str) -> Dict

@router.delete("/api/datasets/{dataset_id}")
async def delete_dataset(dataset_id: str) -> Dict
```

---

### **4.2 Detection Parameter Endpoints**

**File**: `backend/routers/detection_config.py` (NEW)

```python
@router.post("/api/parameters/create")
async def create_detection_config(
    dataset_id: str,
    defect_types: List[DetectionParameter]
) -> Dict

@router.get("/api/parameters/{dataset_id}/all")
async def get_all_parameters(dataset_id: str) -> List[DetectionParameter]

@router.put("/api/parameters/{param_id}")
async def update_parameter(param_id: str, updates: Dict) -> Dict

@router.get("/api/parameters/{dataset_id}/mapping")
async def get_class_mapping(dataset_id: str) -> Dict
```

---

### **4.3 Fine-Tuning Endpoints**

**File**: `backend/routers/fine_tune.py` (NEW)

```python
@router.post("/api/finetune/start")
async def start_fine_tune(config: FineTuneConfig) -> Dict
    # Returns: {"job_id": "...", "status": "queued", "eta_minutes": 120}

@router.get("/api/finetune/{job_id}/status")
async def get_job_status(job_id: str) -> FineTuneJobStatus
    # Returns: full status with metrics

@router.post("/api/finetune/{job_id}/cancel")
async def cancel_job(job_id: str) -> Dict

@router.get("/api/finetune/{job_id}/metrics")
async def get_detailed_metrics(job_id: str) -> Dict
    # Returns: loss history, accuracy history, generalization gap
```

---

### **4.4 Model Registry Endpoints**

**File**: `backend/routers/model_registry.py` (NEW)

```python
@router.get("/api/models/registry")
async def list_all_models(status: Optional[str] = None) -> List[ModelRegistryItem]

@router.get("/api/models/{model_id}")
async def get_model_info(model_id: str) -> Dict

@router.post("/api/models/{model_id}/deploy")
async def deploy_model(model_id: str) -> Dict

@router.post("/api/models/{model_id}/rollback")
async def rollback_model(model_id: str) -> Dict

@router.delete("/api/models/{model_id}")
async def archive_model(model_id: str) -> Dict
```

---

### **4.5 Parametrized Inference Endpoints**

**File**: `backend/routers/parametrized_inference.py` (NEW)

```python
@router.post("/api/inference/predict")
async def predict_with_parameters(
    model_id: str,
    image_file: UploadFile,
    detection_parameters: Dict[str, DetectionParameter]
) -> Dict
    # Returns: filtered detections with colors, confidence, bbox

@router.post("/api/inference/batch")
async def batch_inference(
    model_id: str,
    dataset_id: str
) -> Dict
    # Returns: job_id for batch processing

@router.get("/api/inference/batch/{batch_job_id}/progress")
async def get_batch_progress(batch_job_id: str) -> Dict
```

---

### **4.6 AutoML Endpoints**

**File**: `backend/routers/automl.py` (NEW)

```python
@router.post("/api/automl/train")
async def train_automl_model(
    csv_file: UploadFile,
    target_column: str,
    model_type: str = "xgboost",
    pca_variance_threshold: float = 0.95
) -> Dict
    # Returns: model_id, metrics, pca_stats

@router.post("/api/automl/{model_id}/predict")
async def predict_automl(
    model_id: str,
    data: List[List[float]]
) -> Dict
    # Returns: predictions, confidence intervals

@router.get("/api/automl/{model_id}/info")
async def get_automl_info(model_id: str) -> Dict
    # Returns: full model metadata, metrics, PCA info
```

---

## **🔧 PHASE 5: FRONTEND COMPONENTS (Day 8-10)**

### **5.1 Dataset Upload Component**

**File**: `frontend/src/components/FineTuning/DatasetUploader.tsx` (NEW)

Features:
- Drag-and-drop for images + annotations
- File validation (jpg, png only)
- Progress bar for upload
- Display uploaded file count & total size
- Error handling with user-friendly messages

```typescript
export function DatasetUploader() {
  // - File input + drag-drop zone
  // - Upload handler with fetch
  // - Progress tracking
  // - Success/error states
  // - Dataset ID returned, stored in state
}
```

---

### **5.2 Defect Type Parameter Selector**

**File**: `frontend/src/components/FineTuning/DefectTypeSelector.tsx` (NEW)

Features:
- Add/remove detection classes dynamically
- Input fields: name, description, confidence_threshold slider, color picker
- Show class ID assignment
- Validation: unique names, valid thresholds
- Save configuration button

```typescript
export function DefectTypeSelector({ datasetId }) {
  // - Form for adding defect types
  // - Array of parameters with edit/delete
  // - Color picker for each class
  // - Confidence threshold slider (0.0-1.0)
  // - Min area pixels input
  // - POST to /api/parameters/create
}
```

---

### **5.3 Training Progress Monitor**

**File**: `frontend/src/components/FineTuning/TrainingProgressMonitor.tsx` (NEW)

Features:
- Real-time polling (every 2 seconds) to `/api/finetune/{job_id}/status`
- Progress bar (0-100%)
- Display: epoch, loss, val_loss, accuracies
- Generalization gap warning (if > 10%)
- Cancel button
- Chart showing loss history (recharts)

```typescript
export function TrainingProgressMonitor({ jobId }) {
  // - useEffect with interval polling
  // - LineChart for train/val loss over epochs
  // - KPI cards for current metrics
  // - Generalization quality badge
  // - Cancel training button
  // - Auto-refresh every 2 seconds
}
```

---

### **5.4 Model Registry View**

**File**: `frontend/src/components/FineTuning/ModelRegistry.tsx` (NEW)

Features:
- List all trained models with metadata
- Show val_accuracy, generalization_gap, status
- Deploy/archive/rollback buttons
- Filter by status (active, archived, superseded)
- Version history

```typescript
export function ModelRegistry() {
  // - Table of models
  // - Columns: name, val_acc, gap, status, created_at
  // - Action buttons: Deploy, Rollback, Archive
  // - Modal for deployment confirmation
}
```

---

### **5.5 Parametrized Inference Component**

**File**: `frontend/src/components/FineTuning/ParametrizedInference.tsx` (NEW)

Features:
- Select deployed model
- Upload test image
- Show detection parameters UI (enable/disable each class)
- Confidence threshold slider per class
- Min area pixels input
- Run inference button
- Display annotated image with colored bboxes
- Show detections table (class, confidence, area)

```typescript
export function ParametrizedInference() {
  // - Model selector dropdown
  // - Image uploader
  // - Detection parameter toggles & sliders
  // - Inference button
  // - Display annotated image (canvas)
  // - Detections table with filtering
}
```

---

### **5.6 AutoML Dashboard Component**

**File**: `frontend/src/components/AutoML/AutoMLDashboard.tsx` (NEW)

Features:
- CSV file upload
- Target column selector
- Model type radio (RF, XGB, LR)
- PCA variance threshold slider
- Train button
- Display training status
- Show metrics: R², RMSE, MAE
- PCA statistics (compression ratio, feature importance)
- Prediction interface (input values → predictions)

```typescript
export function AutoMLDashboard() {
  // - CSV upload + preview
  // - Column selection for target
  // - Model type selector
  // - Training trigger
  // - Metrics display (cards)
  // - PCA visualization (explained variance chart)
  // - Feature importance bar chart
  // - Prediction input form
}
```

---

### **5.7 PCA Visualization Component**

**File**: `frontend/src/components/AutoML/PCAVisualization.tsx` (NEW)

Features:
- LineChart: Explained variance by component
- AreaChart: Cumulative variance (with 0.95 threshold)
- BarChart: Top 10 important features in PCA space
- MetricCard: Compression ratio

```typescript
export function PCAVisualization({ pcaStats }) {
  // - 4-part visualization using recharts
  // - Explained variance line chart
  // - Cumulative variance area chart
  // - Feature importance bar chart
  // - Compression ratio KPI
}
```

---

### **5.8 Integrate into Main App**

**File**: `frontend/src/pages/FineTuning.tsx` (NEW)

Tab-based interface:
- Tab 1: Dataset Upload
- Tab 2: Parameter Configuration
- Tab 3: Training Monitor
- Tab 4: Model Registry
- Tab 5: Parametrized Inference

---

## **🔧 PHASE 6: INTEGRATION & TESTING (Day 11-12)**

### **6.1 Update main.py**

**File**: `backend/main.py` (MODIFY)

```python
# Add new routers
app.include_router(datasets.router)
app.include_router(detection_config.router)
app.include_router(fine_tune.router)
app.include_router(model_registry.router)
app.include_router(parametrized_inference.router)
app.include_router(automl.router)

# Initialize DB on startup
@app.on_event("startup")
async def startup_event():
    init_db()
    # Start Celery tasks polling if needed
```

---

### **6.2 Update requirements.txt**

**File**: `backend/requirements.txt` (ADD)

```
celery==5.3.1
redis==5.0.0
ultralytics==8.0.200
scikit-learn==1.3.2
xgboost==2.0.0
Pillow==10.0.0
numpy==1.24.3
python-multipart==0.0.6
```

---

### **6.3 Unit Tests**

**File**: `backend/tests/test_dataset_service.py` (NEW)

```python
def test_upload_dataset():
    """Test dataset upload and validation"""
    
def test_dataset_quality_validation():
    """Test that low-quality datasets are rejected"""
    
def test_get_dataset_stats():
    """Test statistics calculation"""
```

**File**: `backend/tests/test_detection_config.py` (NEW)

```python
def test_create_detection_config():
    """Test parameter creation"""
    
def test_generate_dataset_yaml():
    """Test YOLO dataset.yaml generation"""
    
def test_update_parameter():
    """Test parameter updates"""
```

**File**: `backend/tests/test_fine_tune.py` (NEW)

```python
def test_start_fine_tune_job():
    """Test job queueing"""
    
def test_get_job_status():
    """Test status polling"""
    
def test_generalization_metrics():
    """Test generalization gap calculation"""
```

**File**: `backend/tests/test_automl.py` (NEW)

```python
def test_pca_fit():
    """Test PCA fitting"""
    
def test_automl_training():
    """Test AutoML model training"""
    
def test_automl_prediction():
    """Test predictions with PCA transform"""
```

**File**: `backend/tests/test_api_endpoints.py` (NEW)

```python
def test_dataset_upload_endpoint():
    """Test POST /api/datasets/upload"""
    
def test_finetune_start_endpoint():
    """Test POST /api/finetune/start"""
    
def test_inference_endpoint():
    """Test POST /api/inference/predict"""
```

---

## **🔧 PHASE 7: DOCKER & DEPLOYMENT (Day 13)**

### **7.1 Docker Setup**

**File**: `backend/Dockerfile` (NEW)

```dockerfile
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libsm6 libxext6 libxrender-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ .

# Run migrations
RUN python -c "from database.db import init_db; init_db()"

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**File**: `docker-compose.yml` (NEW)

```yaml
version: '3.9'

services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    depends_on:
      - redis
    environment:
      REDIS_URL: redis://redis:6379
    volumes:
      - ./backend:/app
      - ./datasets:/app/datasets
      - ./runs:/app/runs

  celery_worker:
    build: ./backend
    command: celery -A jobs.fine_tune_worker worker --loglevel=info
    depends_on:
      - redis
    environment:
      REDIS_URL: redis://redis:6379
    volumes:
      - ./backend:/app
      - ./datasets:/app/datasets
      - ./runs:/app/runs

volumes:
  redis_data:
```

---

## **✅ SUCCESS CRITERIA & TESTING CHECKLIST**

### **Phase 1 - Database & Models**
- [ ] `schema.sql` runs without errors
- [ ] All tables created with correct columns
- [ ] `pydantic` models validate inputs correctly
- [ ] Database utilities connect successfully

### **Phase 2 - Services**
- [ ] Dataset upload works with image + annotation files
- [ ] Dataset stats calculated correctly
- [ ] Detection parameters saved to DB
- [ ] `dataset.yaml` generated correctly (for YOLO)
- [ ] PCA fit/transform works on sample data
- [ ] AutoML training completes without errors

### **Phase 3 - Celery Worker**
- [ ] Celery app connects to Redis
- [ ] Fine-tuning task queued and starts
- [ ] Progress updates written to DB each epoch
- [ ] Model saved after training
- [ ] Job status transitions: queued → training → completed

### **Phase 4 - API Endpoints**
- [ ] All endpoints return correct status codes (200, 201, 400, 404)
- [ ] Dataset upload endpoint accepts multipart/form-data
- [ ] Fine-tune endpoint queues Celery task
- [ ] Status polling returns updated progress
- [ ] Model registry endpoint lists models correctly
- [ ] Inference endpoint filters by parameters

### **Phase 5 - Frontend Components**
- [ ] DatasetUploader displays uploaded files
- [ ] DefectTypeSelector adds/edits/removes classes
- [ ] TrainingProgressMonitor polls every 2 seconds
- [ ] ModelRegistry shows all trained models
- [ ] ParametrizedInference displays annotated image
- [ ] AutoMLDashboard trains and predicts

### **Phase 6 - Integration**
- [ ] Full workflow works end-to-end:
  1. Upload dataset
  2. Define parameters
  3. Start fine-tuning
  4. Monitor progress
  5. Deploy model
  6. Run inference
- [ ] All tests pass (pytest)
- [ ] No errors in browser console
- [ ] No errors in backend logs

### **Phase 7 - Docker**
- [ ] Docker images build without errors
- [ ] `docker-compose up` starts all services
- [ ] Backend, Redis, and Celery worker running
- [ ] Can upload dataset via API
- [ ] Can run inference against trained model

---

## **📊 IMPLEMENTATION TIMELINE**

```
Day 1-2:  Database + Models
Day 3-4:  Services (Dataset, Config, PCA, AutoML)
Day 5:    Celery Worker
Day 6-7:  API Endpoints
Day 8-10: Frontend Components
Day 11:   Integration & Testing
Day 12:   Docker & Deployment
---
Total:    2 weeks to production-ready
```

---

## **🚀 QUICK START AFTER IMPLEMENTATION**

1. **Start services**:
   ```bash
   docker-compose up
   ```

2. **Upload dataset**:
   ```bash
   curl -X POST http://localhost:8000/api/datasets/upload \
     -F "dataset_name=MyDefects" \
     -F "files=@image1.jpg" \
     -F "annotations=@image1.txt"
   ```

3. **Define parameters**:
   ```bash
   curl -X POST http://localhost:8000/api/parameters/create \
     -H "Content-Type: application/json" \
     -d '{
       "dataset_id": "ds_abc123",
       "defect_types": [{
         "name": "crack",
         "class_id": 0,
         "confidence_threshold": 0.6,
         "color": "#FF0000"
       }]
     }'
   ```

4. **Start training**:
   ```bash
   curl -X POST http://localhost:8000/api/finetune/start \
     -H "Content-Type: application/json" \
     -d '{
       "dataset_id": "ds_abc123",
       "model_backbone": "yolov8m",
       "epochs": 50,
       "batch_size": 16
     }'
   ```

5. **Monitor progress**:
   ```bash
   curl http://localhost:8000/api/finetune/job_xyz789/status
   ```

6. **Run inference**:
   ```bash
   curl -X POST http://localhost:8000/api/inference/predict \
     -F "model_id=mdl_abc123" \
     -F "image_file=@test_image.jpg" \
     -F 'detection_parameters={...}'
   ```

---

## **📝 NOTES FOR AGENT**

1. **Do NOT modify existing files** except `main.py` (to add routers) and `requirements.txt` (to add dependencies)
2. **All NEW files** should follow the exact paths and class names specified
3. **Database**: Use SQLite connection string from `backend/config/` or hardcode `backend/database/app.db`
4. **Error handling**: All endpoints should return proper HTTP status codes (400, 404, 500)
5. **Async/await**: Use async functions for all I/O (DB, file ops, API calls)
6. **Type hints**: Use full type hints for all functions (for clarity and IDE support)
7. **Docstrings**: Add docstring to every function (what it does, returns, raises)
8. **Comments**: Add comments for complex logic (especially in Celery worker)
9. **Testing**: Write unit tests that can run with `pytest backend/tests/`
10. **Git**: Create feature branches per phase (dataset-phase, services-phase, etc.)

---

## **🎁 DELIVERABLES**

After implementation, the following should be ready:

```
backend/
├── database/
│   ├── schema.sql          (NEW - database schema)
│   └── db.py               (MODIFIED - new utility functions)
├── models/
│   └── schemas.py          (NEW - Pydantic models)
├── services/
│   ├── dataset_service.py          (NEW)
│   ├── detection_config_service.py (NEW)
│   ├── fine_tune_service.py        (NEW)
│   ├── automl_service.py           (NEW)
│   └── ...existing...
├── routers/
│   ├── datasets.py                 (NEW)
│   ├── detection_config.py         (NEW)
│   ├── fine_tune.py                (NEW)
│   ├── model_registry.py           (NEW)
│   ├── parametrized_inference.py   (NEW)
│   ├── automl.py                   (NEW)
│   └── ...existing...
├── ml_models/
│   └── pca_handler.py              (NEW)
├── utils/
│   └── metrics_calculator.py       (NEW)
├── jobs/
│   ├── fine_tune_worker.py         (NEW)
│   └── helpers.py                  (NEW)
├── config/
│   └── celery_config.py            (NEW)
├── tests/
│   ├── test_dataset_service.py     (NEW)
│   ├── test_detection_config.py    (NEW)
│   ├── test_fine_tune.py           (NEW)
│   ├── test_automl.py              (NEW)
│   └── test_api_endpoints.py       (NEW)
├── celery_app.py                   (NEW)
├── main.py                         (MODIFIED - add routers)
├── requirements.txt                (MODIFIED - add dependencies)
└── Dockerfile                      (NEW)

frontend/src/
├── components/FineTuning/
│   ├── DatasetUploader.tsx                (NEW)
│   ├── DefectTypeSelector.tsx             (NEW)
│   ├── TrainingProgressMonitor.tsx        (NEW)
│   ├── ModelRegistry.tsx                  (NEW)
│   └── ParametrizedInference.tsx          (NEW)
├── components/AutoML/
│   ├── AutoMLDashboard.tsx                (NEW)
│   └── PCAVisualization.tsx               (NEW)
├── pages/
│   └── FineTuning.tsx                     (NEW)
└── ...existing...

docker-compose.yml                  (NEW)
Dockerfile                          (NEW - at backend/)
```

---

## **Final Instruction**

**Implement all code exactly as specified above. When complete, verify:**

1. ✅ All files created with correct paths
2. ✅ All functions have type hints + docstrings
3. ✅ All endpoints tested and working
4. ✅ All components render without errors
5. ✅ Full workflow (upload → configure → train → deploy → infer) works end-to-end
6. ✅ Docker compose starts without errors
7. ✅ Unit tests pass (pytest)

**Start immediately. This is a complete, production-ready specification. No ambiguity. Execute.**

---

**Total LOC Target**: ~5,000 lines of production code (backend) + ~2,000 lines of frontend (React/TypeScript)
**Time Estimate**: 2-3 weeks (with agent implementing in parallel)
**Quality Bar**: Production-ready, no technical debt
