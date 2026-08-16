-- backend/database/schema.sql

-- Datasets table
CREATE TABLE IF NOT EXISTS datasets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    image_count INTEGER DEFAULT 0,
    total_mb REAL DEFAULT 0.0,
    status TEXT NOT NULL,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_datasets_status ON datasets(status);

-- Defect Types table
CREATE TABLE IF NOT EXISTS defect_types (
    id TEXT PRIMARY KEY,
    dataset_id TEXT NOT NULL,
    name TEXT NOT NULL,
    class_id INTEGER NOT NULL,
    confidence_threshold REAL DEFAULT 0.5,
    color TEXT DEFAULT '#FF0000',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_defect_types_dataset_id ON defect_types(dataset_id);

-- Fine Tune Jobs table
CREATE TABLE IF NOT EXISTS fine_tune_jobs (
    id TEXT PRIMARY KEY,
    dataset_id TEXT NOT NULL,
    status TEXT NOT NULL,
    epochs_completed INTEGER DEFAULT 0,
    metrics TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_fine_tune_jobs_dataset_id ON fine_tune_jobs(dataset_id);
CREATE INDEX IF NOT EXISTS idx_fine_tune_jobs_status ON fine_tune_jobs(status);

-- Model Registry table
CREATE TABLE IF NOT EXISTS model_registry (
    id TEXT PRIMARY KEY,
    model_name TEXT NOT NULL,
    val_accuracy REAL,
    status TEXT NOT NULL,
    model_path TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_model_registry_status ON model_registry(status);

-- Inference Results table
CREATE TABLE IF NOT EXISTS inference_results (
    id TEXT PRIMARY KEY,
    model_id TEXT NOT NULL,
    detections_json TEXT NOT NULL,
    inference_time_ms REAL NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (model_id) REFERENCES model_registry(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_inference_results_model_id ON inference_results(model_id);

-- AutoML Models table
CREATE TABLE IF NOT EXISTS automl_models (
    id TEXT PRIMARY KEY,
    model_type TEXT NOT NULL,
    pca_variance REAL,
    metrics_json TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
