# backend/config/models_config.py
# Central configuration for all available ML models

MODELS = {
    # ── Existing Models (5) ────────────────────────────────────────────────
    "defect_detection": {
        "id": "defect_detection",
        "name": "Steel Defect Detection",
        "category": "existing",
        "description": "Detect and classify steel surface defects using YOLOv8",
        "supported_inputs": ["image"],
        "icon": "🔍",
        "color": "cyan",
        "version": "1.0.0",
        "avg_execution_time_ms": 850,
        "output_format": {
            "type": "detection",
            "fields": ["defect_type", "confidence", "severity", "bbox", "all_detections"]
        }
    },
    "ppe_monitoring": {
        "id": "ppe_monitoring",
        "name": "PPE Compliance Monitor",
        "category": "existing",
        "description": "Monitor Personal Protective Equipment compliance in images",
        "supported_inputs": ["image"],
        "icon": "👷",
        "color": "blue",
        "version": "1.0.0",
        "avg_execution_time_ms": 720,
        "output_format": {
            "type": "classification",
            "fields": ["ppe_status", "missing_items", "compliance_score"]
        }
    },
    "energy_analytics": {
        "id": "energy_analytics",
        "name": "Energy Consumption Analytics",
        "category": "existing",
        "description": "Analyze energy consumption patterns and anomalies",
        "supported_inputs": ["csv"],
        "icon": "⚡",
        "color": "emerald",
        "version": "1.0.0",
        "avg_execution_time_ms": 320,
        "output_format": {
            "type": "analytics",
            "fields": ["total_consumption", "peak_hour", "anomalies", "efficiency_score"]
        }
    },
    "maintenance_prediction": {
        "id": "maintenance_prediction",
        "name": "Predictive Maintenance",
        "category": "existing",
        "description": "Predict machine failure and maintenance requirements",
        "supported_inputs": ["csv"],
        "icon": "🔧",
        "color": "orange",
        "version": "1.0.0",
        "avg_execution_time_ms": 410,
        "output_format": {
            "type": "prediction",
            "fields": ["failure_probability", "days_to_failure", "maintenance_priority", "confidence"]
        }
    },
    "llm_insights": {
        "id": "llm_insights",
        "name": "LLM Insights Generator",
        "category": "existing",
        "description": "Generate AI-powered insights and recommendations using Claude",
        "supported_inputs": ["csv", "image"],
        "icon": "🤖",
        "color": "purple",
        "version": "1.0.0",
        "avg_execution_time_ms": 2500,
        "output_format": {
            "type": "insights",
            "fields": ["summary", "recommendations", "anomalies", "action_items"]
        }
    },

    # ── Real ML Models (2) - Your Trained Models ──────────────────────────
    "rul_prediction": {
        "id": "rul_prediction",
        "name": "Remaining Useful Life (RUL) Predictor",
        "category": "ml",
        "description": "Predict remaining useful life of machinery using XGBoost",
        "supported_inputs": ["csv"],
        "icon": "🔋",
        "color": "cyan",
        "version": "1.0.0",
        "avg_execution_time_ms": 350,
        "output_format": {
            "type": "regression",
            "fields": ["predicted_rul", "predicted_rul_days", "confidence", "risk_level", "recommendations"]
        }
    },
    "alert_detection": {
        "id": "alert_detection",
        "name": "Anomaly Alert Detector",
        "category": "ml",
        "description": "Detect anomalies and potential failures in machinery logs",
        "supported_inputs": ["csv"],
        "icon": "🚨",
        "color": "orange",
        "version": "1.0.0",
        "avg_execution_time_ms": 280,
        "output_format": {
            "type": "classification",
            "fields": ["alert_status", "alert_probability", "alert_type", "severity", "action_required"]
        }
    },

    # ── ML Model Fallbacks (4) - Mocks if real models not available ────────
    "resnet_classifier": {
        "id": "resnet_classifier",
        "name": "ResNet50 Image Classifier",
        "category": "ml",
        "description": "Advanced image classification using ResNet50 neural network",
        "supported_inputs": ["image"],
        "icon": "🧠",
        "color": "cyan",
        "version": "1.0.0",
        "avg_execution_time_ms": 1200,
        "output_format": {
            "type": "classification",
            "fields": ["predicted_class", "confidence", "top_3_predictions", "feature_map"]
        }
    },
    "random_forest": {
        "id": "random_forest",
        "name": "Random Forest Classifier",
        "category": "ml",
        "description": "Robust classification algorithm for CSV data with feature importance",
        "supported_inputs": ["csv"],
        "icon": "🌳",
        "color": "emerald",
        "version": "1.0.0",
        "avg_execution_time_ms": 520,
        "output_format": {
            "type": "classification",
            "fields": ["predicted_label", "probability", "feature_importance", "accuracy"]
        }
    },
    "linear_regression": {
        "id": "linear_regression",
        "name": "Linear Regression Predictor",
        "category": "ml",
        "description": "Simple yet effective linear prediction model for continuous values",
        "supported_inputs": ["csv"],
        "icon": "📈",
        "color": "blue",
        "version": "1.0.0",
        "avg_execution_time_ms": 180,
        "output_format": {
            "type": "regression",
            "fields": ["predicted_value", "r_squared", "mse", "confidence_interval"]
        }
    },
    "xgboost_predictor": {
        "id": "xgboost_predictor",
        "name": "XGBoost Advanced Predictor",
        "category": "ml",
        "description": "Gradient boosting algorithm for high-accuracy predictions",
        "supported_inputs": ["csv"],
        "icon": "🚀",
        "color": "orange",
        "version": "1.0.0",
        "avg_execution_time_ms": 890,
        "output_format": {
            "type": "regression",
            "fields": ["predicted_value", "shap_importance", "prediction_interval", "feature_impact"]
        }
    },
}

# Get all model IDs
ALL_MODEL_IDS = list(MODELS.keys())

# Get models by category
EXISTING_MODELS = {k: v for k, v in MODELS.items() if v["category"] == "existing"}
ML_MODELS = {k: v for k, v in MODELS.items() if v["category"] == "ml"}

# Get models by input type
IMAGE_MODELS = {k: v for k, v in MODELS.items() if "image" in v["supported_inputs"]}
CSV_MODELS = {k: v for k, v in MODELS.items() if "csv" in v["supported_inputs"]}
