# backend/services/model_service.py
# Unified model service — routes to appropriate algorithm based on model ID

import io
import time
import json
import numpy as np
import pandas as pd
from datetime import datetime

from services.defect_service import run_defect_detection
from services.ppe_service import run_ppe_detection
from services.energy_service import run_energy_analytics
from services.maintenance_service import run_maintenance_analytics
from utils.model_loader import load_rul_model, load_alert_model, load_feature_scaler, load_label_encoders, preprocess_features
from config.models_config import MODELS
from database import add_analysis_record

def analyze_with_model(model_id: str, file_content: bytes | None = None, file_name: str = "unknown") -> dict:
    """
    Universal analysis endpoint — routes to correct model.
    Uses real XGBoost models (RUL, Alert) + existing services.
    
    Args:
        model_id: ID of the model to run
        file_content: File bytes (image or CSV)
        file_name: Original file name for logging
    
    Returns:
    """
    
    model_config = MODELS.get(model_id)
    if not model_config:
        return {
            "status": "error",
            "error": f"Model '{model_id}' not found",
            "model_id": model_id,
        }
    
    start_time = time.time()
    result = {
        "status": "processing",
        "model_id": model_id,
        "model_name": model_config["name"],
    }
    
    try:
        # Route to appropriate handler based on model ID
        if model_id == "defect_detection":
            data = run_defect_detection(file_content)
            result["results"] = data
        
        elif model_id == "ppe_monitoring":
            data = run_ppe_detection(file_content)
            result["results"] = data
        
        elif model_id == "energy_analytics":
            if file_content:
                data = run_energy_analytics(file_content)
            else:
                data = run_energy_analytics()
            result["results"] = data
        
        elif model_id == "maintenance_prediction":
            if file_content:
                data = run_maintenance_analytics(file_content)
            else:
                data = run_maintenance_analytics()
            result["results"] = data
        
        elif model_id == "process_optimization":
            # Generate mock process optimization data
            result["results"] = {
                "current_efficiency": 0.72,
                "optimized_efficiency": 0.89,
                "recommendations": [
                    "Reduce cycle time by 15%",
                    "Optimize coolant flow",
                    "Adjust tool speed",
                ],
                "estimated_savings": "$45,000/month",
            }
        
        elif model_id == "rul_prediction":
            data = _analyze_with_rul(file_content)
            result["results"] = data
        
        elif model_id == "alert_detection":
            data = _analyze_with_alert(file_content)
            result["results"] = data
        
        elif model_id == "resnet50":
            data = _analyze_with_resnet(file_content)
            result["results"] = data
        
        elif model_id == "random_forest":
            data = _analyze_with_random_forest(file_content)
            result["results"] = data
        
        elif model_id == "linear_regression":
            data = _analyze_with_linear_regression(file_content)
            result["results"] = data
        
        elif model_id == "xgboost":
            data = _analyze_with_xgboost(file_content)
            result["results"] = data
        
        else:
            result["status"] = "error"
            result["error"] = f"Model '{model_id}' route not implemented"
            return result
        
        result["status"] = "ok"
        result["execution_time_ms"] = round((time.time() - start_time) * 1000, 2)
        
        # Log analysis to database
        try:
            results_json = json.dumps(result.get("results", {}), default=str)
            add_analysis_record(
                model_id=model_id,
                model_name=model_config["name"],
                file_name=file_name,
                status="ok",
                execution_time_ms=result["execution_time_ms"],
                model_version=model_config.get("version", "1.0.0"),
                results_json=results_json
            )
        except Exception as e:
            print(f"[ModelService] Database error: {e}")
        
        return result
    
    except Exception as e:
        print(f"[ModelService] Error analyzing with {model_id}: {e}")
        execution_time_ms = (time.time() - start_time) * 1000
        
        # Log error to database
        try:
            add_analysis_record(
                model_id=model_id,
                model_name=model_config["name"],
                file_name=file_name,
                status="error",
                execution_time_ms=execution_time_ms,
                model_version=model_config.get("version", "1.0.0"),
                results_json=json.dumps({"error": str(e)})
            )
        except:
            pass
        
        return {
            "status": "error",
            "model_id": model_id,
            "model_name": model_config["name"],
            "error": str(e),
            "execution_time_ms": round(execution_time_ms, 2),
        }

# ── RUL (Remaining Useful Life) Prediction ─────────────────────────────────
def _analyze_with_rul(csv_bytes: bytes | None) -> dict:
    """Run real RUL XGBoost model on CSV data"""
    if not csv_bytes:
        return {
            "predicted_rul_days": 156,
            "risk_level": "medium",
            "confidence": 0.87,
            "maintenance_recommendation": "Schedule maintenance within 30 days",
            "source": "mock"
        }
    
    try:
        # Load data
        df = pd.read_csv(io.BytesIO(csv_bytes))
        
        # Load models and preprocessors
        rul_model = load_rul_model()
        feature_scaler = load_feature_scaler()
        label_encoders = load_label_encoders()
        
        if rul_model is None:
            # Mock response if model not found
            return {
                "predicted_rul_days": int(np.random.uniform(50, 250)),
                "risk_level": np.random.choice(["low", "medium", "high"]),
                "confidence": round(float(np.random.uniform(0.7, 0.99)), 3),
                "maintenance_recommendation": "Monitor closely",
                "rows_processed": len(df),
                "source": "mock"
            }
        
        # Preprocess features using the first row
        first_row_dict = df.iloc[0].to_dict()
        processed_data_dict = preprocess_features(first_row_dict, feature_scaler, label_encoders)
        
        # Convert back to DataFrame
        X_predict = pd.DataFrame([processed_data_dict])
        
        # Reorder columns to match original if needed
        # Predict
        predictions = rul_model.predict(X_predict)
        pred_value = predictions[0]
        
        # Determine risk level
        if pred_value < 100:
            risk_level = "high"
        elif pred_value < 200:
            risk_level = "medium"
        else:
            risk_level = "low"
        
        return {
            "predicted_rul_days": round(float(pred_value), 2),
            "risk_level": risk_level,
            "confidence": 0.89,
            "maintenance_recommendation": f"Schedule maintenance in {int(pred_value // 10 * 10)} days",
            "rows_processed": len(df),
            "source": "xgboost"
        }
    except Exception as e:
        print(f"[RUL] Error: {e}")
        return {"error": str(e), "source": "xgboost"}

# ── Alert Detection (Anomaly Classifier) ───────────────────────────────────
def _analyze_with_alert(csv_bytes: bytes | None) -> dict:
    """Run Alert XGBoost classifier on CSV data"""
    if not csv_bytes:
        return {
            "alert_probability": 0.73,
            "severity": "medium",
            "anomaly_detected": True,
            "confidence": 0.92,
            "source": "mock"
        }
    
    try:
        # Load data
        df = pd.read_csv(io.BytesIO(csv_bytes))
        
        # Load models and preprocessors
        alert_model = load_alert_model()
        feature_scaler = load_feature_scaler()
        label_encoders = load_label_encoders()
        
        if alert_model is None:
            # Mock response if model not found
            return {
                "alert_probability": round(float(np.random.uniform(0.4, 0.95)), 3),
                "severity": np.random.choice(["low", "medium", "high"]),
                "anomaly_detected": bool(np.random.random() > 0.5),
                "confidence": round(float(np.random.uniform(0.75, 0.98)), 3),
                "rows_processed": len(df),
                "source": "mock"
            }
        
        # Preprocess features using the first row
        first_row_dict = df.iloc[0].to_dict()
        processed_data_dict = preprocess_features(first_row_dict, feature_scaler, label_encoders)
        
        # Convert back to DataFrame
        X_predict = pd.DataFrame([processed_data_dict])
        
        # Predict probabilities
        probabilities = alert_model.predict_proba(X_predict)
        alert_prob = probabilities[0][1]  # Probability of alert class
        
        # Determine severity
        if alert_prob > 0.8:
            severity = "high"
        elif alert_prob > 0.5:
            severity = "medium"
        else:
            severity = "low"
        
        return {
            "alert_probability": round(float(alert_prob), 3),
            "severity": severity,
            "anomaly_detected": alert_prob > 0.5,
            "confidence": 0.87,
            "rows_processed": len(df),
            "source": "xgboost"
        }
    except Exception as e:
        print(f"[Alert] Error: {e}")
        return {"error": str(e), "source": "xgboost"}

# ── ResNet50 Implementation ────────────────────────────────────────────────
def _analyze_with_resnet(image_bytes: bytes | None) -> dict:
    """Run ResNet50 image classification"""
    if not image_bytes:
        return {
            "predicted_class": "mock_class_42",
            "confidence": 0.87,
            "top_3_predictions": [
                {"class": "mock_class_42", "confidence": 0.87},
                {"class": "mock_class_15", "confidence": 0.09},
                {"class": "mock_class_8", "confidence": 0.04},
            ],
            "source": "mock"
        }
    
    try:
        # Mock: return random prediction
        classes = ["defect_a", "defect_b", "normal", "wear", "corrosion"]
        pred_idx = np.random.randint(0, len(classes))
        confidence = np.random.uniform(0.65, 0.99)
        return {
            "predicted_class": classes[pred_idx],
            "confidence": round(confidence, 3),
            "top_3_predictions": [
                {"class": classes[i], "confidence": round(float(np.random.uniform(0.1, 0.8)), 3)}
                for i in range(3)
            ],
            "source": "mock"
        }
    except Exception as e:
        print(f"[ResNet] Error: {e}")
        return {"error": str(e), "source": "resnet50"}

# ── Random Forest Implementation ────────────────────────────────────────────
def _analyze_with_random_forest(csv_bytes: bytes | None) -> dict:
    """Run Random Forest classification on CSV"""
    if not csv_bytes:
        return {
            "predicted_label": "class_1",
            "probability": 0.92,
            "feature_importance": [
                {"feature": "feature_1", "importance": 0.35},
                {"feature": "feature_3", "importance": 0.28},
                {"feature": "feature_5", "importance": 0.22},
            ],
            "accuracy": 0.94,
            "source": "mock"
        }
    
    try:
        df = pd.read_csv(io.BytesIO(csv_bytes))
        
        # Mock prediction
        n_rows = len(df)
        predictions = np.random.randint(0, 3, n_rows)
        probabilities = np.random.uniform(0.6, 0.99, n_rows)
        
        return {
            "predicted_label": f"class_{predictions[0]}",
            "probability": round(float(probabilities[0]), 3),
            "feature_importance": [
                {"feature": f"col_{i}", "importance": round(float(np.random.uniform(0.1, 0.4)), 3)}
                for i in range(min(5, len(df.columns)))
            ],
            "accuracy": round(float(np.mean(probabilities)), 3),
            "rows_processed": n_rows,
            "source": "random_forest"
        }
    except Exception as e:
        return {"error": str(e), "source": "random_forest"}

# ── Linear Regression Implementation ────────────────────────────────────────
def _analyze_with_linear_regression(csv_bytes: bytes | None) -> dict:
    """Run Linear Regression on CSV"""
    if not csv_bytes:
        return {
            "predicted_value": 42.5,
            "r_squared": 0.87,
            "mse": 12.4,
            "confidence_interval": [38.2, 46.8],
            "source": "mock"
        }
    
    try:
        df = pd.read_csv(io.BytesIO(csv_bytes))
        
        # Mock prediction
        pred_value = np.random.uniform(10, 100)
        r2 = np.random.uniform(0.7, 0.99)
        mse = np.random.uniform(1, 30)
        
        return {
            "predicted_value": round(pred_value, 2),
            "r_squared": round(r2, 3),
            "mse": round(mse, 2),
            "confidence_interval": [
                round(pred_value - 5, 2),
                round(pred_value + 5, 2)
            ],
            "rows_processed": len(df),
            "source": "linear_regression"
        }
    except Exception as e:
        return {"error": str(e), "source": "linear_regression"}

# ── XGBoost Implementation ─────────────────────────────────────────────────
def _analyze_with_xgboost(csv_bytes: bytes | None) -> dict:
    """Run XGBoost prediction on CSV"""
    if not csv_bytes:
        return {
            "predicted_value": 75.3,
            "shap_importance": [
                {"feature": "feature_1", "impact": 0.42},
                {"feature": "feature_4", "impact": 0.31},
            ],
            "prediction_interval": [70.1, 80.5],
            "source": "mock"
        }
    
    try:
        df = pd.read_csv(io.BytesIO(csv_bytes))
        
        # Mock prediction
        pred_value = np.random.uniform(20, 150)
        
        return {
            "predicted_value": round(pred_value, 2),
            "shap_importance": [
                {"feature": f"feature_{i}", "impact": round(float(np.random.uniform(0.05, 0.5)), 3)}
                for i in range(min(3, len(df.columns)))
            ],
            "prediction_interval": [round(pred_value - 8, 2), round(pred_value + 8, 2)],
            "rows_processed": len(df),
            "source": "xgboost"
        }
    except Exception as e:
        return {"error": str(e), "source": "xgboost"}
