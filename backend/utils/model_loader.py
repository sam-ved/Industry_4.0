# backend/utils/model_loader.py
# Load and initialize ML models (XGBoost RUL, Alert classifiers, etc.)

import os
import pickle
import numpy as np
import joblib

# Lazy-loaded models
_loaded_models = {}


def load_rul_model():
    """Load RUL (Remaining Useful Life) XGBoost regressor"""
    if "rul" in _loaded_models:
        return _loaded_models["rul"]

    model_path = os.path.join("models", "rul_xgb_regressor.pkl")
    if os.path.exists(model_path):
        try:
            with open(model_path, "rb") as f:
                _loaded_models["rul"] = pickle.load(f)
            print("[ModelLoader] RUL XGBoost model loaded successfully")
            return _loaded_models["rul"]
        except Exception as e:
            print(f"[ModelLoader] Failed to load RUL model: {e}")

    print("[ModelLoader] RUL model not found — using mock")
    _loaded_models["rul"] = None
    return None


def load_alert_model():
    """Load Alert classification XGBoost classifier"""
    if "alert" in _loaded_models:
        return _loaded_models["alert"]

    model_path = os.path.join("models", "alert_xgb_classifier.pkl")
    if os.path.exists(model_path):
        try:
            with open(model_path, "rb") as f:
                _loaded_models["alert"] = pickle.load(f)
            print("[ModelLoader] Alert XGBoost model loaded successfully")
            return _loaded_models["alert"]
        except Exception as e:
            print(f"[ModelLoader] Failed to load Alert model: {e}")

    print("[ModelLoader] Alert model not found — using mock")
    _loaded_models["alert"] = None
    return None


def load_feature_scaler():
    """Load feature scaler for preprocessing"""
    if "scaler" in _loaded_models:
        return _loaded_models["scaler"]

    model_path = os.path.join("models", "feature_scaler.pkl")
    if os.path.exists(model_path):
        try:
            with open(model_path, "rb") as f:
                _loaded_models["scaler"] = joblib.load(f)
            print("[ModelLoader] Feature scaler loaded successfully")
            return _loaded_models["scaler"]
        except Exception as e:
            print(f"[ModelLoader] Failed to load feature scaler: {e}")

    print("[ModelLoader] Feature scaler not found — using mock")
    _loaded_models["scaler"] = None
    return None


def load_label_encoders():
    """Load all label encoders for categorical features"""
    if "label_encoders" in _loaded_models:
        return _loaded_models["label_encoders"]

    encoders = {}
    encoder_names = ["le_failure", "le_machine",
                     "le_machine_type", "le_maintenance"]

    for encoder_name in encoder_names:
        encoder_path = os.path.join("models", f"{encoder_name}.pkl")
        if os.path.exists(encoder_path):
            try:
                with open(encoder_path, "rb") as f:
                    encoders[encoder_name] = joblib.load(f)
                print(f"[ModelLoader] {encoder_name} loaded successfully")
            except Exception as e:
                print(f"[ModelLoader] Failed to load {encoder_name}: {e}")
                encoders[encoder_name] = None
        else:
            print(f"[ModelLoader] {encoder_name} not found — using None")
            encoders[encoder_name] = None

    _loaded_models["label_encoders"] = encoders
    return encoders


def load_model_metadata():
    """Load model metadata if available"""
    if "metadata" in _loaded_models:
        return _loaded_models["metadata"]

    metadata_path = os.path.join("models", "model_metadata")
    if os.path.exists(metadata_path):
        try:
            import json
            with open(metadata_path, "r") as f:
                _loaded_models["metadata"] = json.load(f)
            print("[ModelLoader] Model metadata loaded successfully")
            return _loaded_models["metadata"]
        except Exception as e:
            print(f"[ModelLoader] Failed to load metadata: {e}")

    print("[ModelLoader] Model metadata not found")
    _loaded_models["metadata"] = {}
    return _loaded_models["metadata"]


def get_all_models():
    """Get all loaded models as a single dict"""
    return {
        "rul": load_rul_model(),
        "alert": load_alert_model(),
        "scaler": load_feature_scaler(),
        "label_encoders": load_label_encoders(),
        "metadata": load_model_metadata(),
    }


def preprocess_features(data_dict, scaler, label_encoders):
    """Preprocess data using scaler and label encoders"""
    try:
        # Apply label encoding to categorical features
        processed = data_dict.copy()

        for key, encoder in label_encoders.items():
            categorical_key = key.replace("le_", "")
            if categorical_key in processed:
                if encoder:
                    try:
                        processed[categorical_key] = encoder.transform(
                            [processed[categorical_key]])[0]
                    except ValueError:
                        processed[categorical_key] = 0
                else:
                    # Fallback for STACK_GLOBAL requires str unpickle errors
                    processed[categorical_key] = 0

        # Scale numerical features
        if scaler:
            numerical_keys = [k for k in processed.keys() if k not in [
                "failure_type", "machine", "machine_type", "maintenance_type"]]
            X = np.array([[processed.get(k, 0) for k in numerical_keys]])
            X_scaled = scaler.transform(X)
            for i, k in enumerate(numerical_keys):
                processed[k] = X_scaled[0][i]

        return processed
    except Exception as e:
        print(f"[ModelLoader] Preprocessing error: {e}")
        return data_dict
