import os
import uuid
import json
import pickle
import sqlite3
import time
import numpy as np
from typing import Dict, List, Any
from fastapi import HTTPException
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error, accuracy_score, precision_score
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.linear_model import LinearRegression, LogisticRegression
import xgboost as xgb
import psutil

from backend.ml_models.pca_handler import PCAFeatureExtractor
from backend.database.db import DB_PATH

class AutoMLWithPCA:
    MODELS_DIR = "backend/ml_models/automl_saved"

    @classmethod
    async def train_automl_model(cls, X: np.ndarray, y: np.ndarray, target_col: str, task_type: str = "regression", pca_variance_threshold: float = 0.95) -> Dict:
        """
        Train multiple AutoML models with PCA feature extraction and generate a Leaderboard.
        """
        os.makedirs(cls.MODELS_DIR, exist_ok=True)
        run_id = f"automl_run_{uuid.uuid4().hex[:8]}"
        
        try:
            n_comp = 50 if X.shape[1] > 50 else min(50, X.shape[1])
            pca = PCAFeatureExtractor(n_components=n_comp, variance_threshold=pca_variance_threshold)
            pca_stats = pca.fit(X)
            X_transformed = pca.transform(X)
            
            X_train, X_test, y_train, y_test = train_test_split(X_transformed, y, test_size=0.2, random_state=42)
            
            candidates = []
            if task_type == "classification":
                candidates = [
                    {"name": "Random Forest", "model": RandomForestClassifier(n_estimators=50, random_state=42), "pros": "Handles non-linear data well, robust to outliers.", "cons": "High memory usage, slower inference.", "suitability": "High for complex non-linear classification."},
                    {"name": "Logistic Regression", "model": LogisticRegression(max_iter=1000), "pros": "Fast, interpretable, low latency.", "cons": "Assumes linear boundaries.", "suitability": "High for real-time edge classification."},
                    {"name": "XGBoost", "model": xgb.XGBClassifier(n_estimators=50, random_state=42), "pros": "State-of-the-art accuracy.", "cons": "Computationally heavy, hard to interpret.", "suitability": "Best for cloud-based offline predictions."}
                ]
            else:
                candidates = [
                    {"name": "Random Forest", "model": RandomForestRegressor(n_estimators=50, random_state=42), "pros": "Captures complex interactions.", "cons": "High memory footprint.", "suitability": "General purpose manufacturing optimization."},
                    {"name": "Linear Regression", "model": LinearRegression(), "pros": "Extremely fast inference, highly interpretable.", "cons": "Cannot capture non-linear relationships.", "suitability": "Real-time edge control systems."},
                    {"name": "XGBoost", "model": xgb.XGBRegressor(n_estimators=50, random_state=42), "pros": "Top-tier accuracy.", "cons": "High CPU consumption during training.", "suitability": "High-value yield prediction."}
                ]

            leaderboard = []
            process = psutil.Process(os.getpid())
            
            best_model_obj = None
            best_model_name = ""
            best_score = -float('inf')
            best_metrics = {}
            
            for candidate in candidates:
                name = candidate["name"]
                model = candidate["model"]
                
                # Measure Training
                start_train = time.time()
                mem_before = process.memory_info().rss
                
                model.fit(X_train, y_train)
                
                end_train = time.time()
                train_time = end_train - start_train
                mem_after = process.memory_info().rss
                mem_used_mb = max(0.1, (mem_after - mem_before) / (1024 * 1024))
                
                # Measure Inference
                start_infer = time.time()
                y_pred = model.predict(X_test)
                infer_time = (time.time() - start_infer) * 1000  # ms
                
                # Metrics
                score_metric = 0
                radar_metrics = {}
                if task_type == "classification":
                    acc = accuracy_score(y_test, y_pred)
                    score_metric = acc
                    radar_metrics = {"accuracy": acc*100, "speed": max(10, 100 - infer_time), "efficiency": max(10, 100 - mem_used_mb)}
                else:
                    r2 = r2_score(y_test, y_pred)
                    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
                    score_metric = r2
                    radar_metrics = {"accuracy": max(0, r2*100), "speed": max(10, 100 - infer_time), "efficiency": max(10, 100 - mem_used_mb)}
                
                leaderboard.append({
                    "name": name,
                    "score": round(score_metric, 4),
                    "training_time_sec": round(train_time, 4),
                    "inference_time_ms": round(infer_time, 2),
                    "memory_mb": round(mem_used_mb, 2),
                    "cpu_usage": round(psutil.cpu_percent(), 1),
                    "pros": candidate["pros"],
                    "cons": candidate["cons"],
                    "industrial_suitability": candidate["suitability"],
                    "radar_chart": radar_metrics,
                    "complexity": "High" if "Boost" in name or "Forest" in name else "Low"
                })
                
                if score_metric > best_score:
                    best_score = score_metric
                    best_model_obj = model
                    best_model_name = name
                    best_metrics = radar_metrics
                    
            # Sort Leaderboard
            leaderboard = sorted(leaderboard, key=lambda x: x["score"], reverse=True)
            for idx, entry in enumerate(leaderboard):
                entry["ranking"] = idx + 1
                entry["reason_for_selection"] = "Selected due to highest predictive score." if idx == 0 else "Not selected."
            
            # Save the best model
            feature_imp = pca.get_feature_importance()
            formatted_importance = [{"feature_index": idx, "importance": imp} for idx, imp in feature_imp[:10]]
            
            metrics_payload = {
                "best_model": best_model_name,
                "best_score": best_score,
                "pca_components": pca_stats["reduced_features"],
                "feature_importance": formatted_importance,
                "leaderboard": leaderboard
            }
            
            model_path = os.path.join(cls.MODELS_DIR, f"{run_id}_model.pkl")
            pca_path = os.path.join(cls.MODELS_DIR, f"{run_id}_pca.pkl")
            
            with open(model_path, 'wb') as f:
                pickle.dump(best_model_obj, f)
            pca.save(pca_path)
            
            try:
                conn = sqlite3.connect(DB_PATH)
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO automl_models 
                    (id, model_type, pca_variance, metrics_json)
                    VALUES (?, ?, ?, ?)
                """, (run_id, best_model_name, pca_variance_threshold, json.dumps(metrics_payload)))
                conn.commit()
                conn.close()
            except Exception as dbe:
                print(f"DB Error, skipping insert: {dbe}")
            
            return {
                "run_id": run_id,
                "leaderboard": leaderboard,
                "best_model": best_model_name,
                "metrics": metrics_payload,
                "pca_stats": pca_stats
            }
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @classmethod
    async def predict(cls, model_id: str, X: np.ndarray) -> np.ndarray:
        model_path = os.path.join(cls.MODELS_DIR, f"{model_id}_model.pkl")
        pca_path = os.path.join(cls.MODELS_DIR, f"{model_id}_pca.pkl")
        
        if not os.path.exists(model_path) or not os.path.exists(pca_path):
            raise HTTPException(status_code=404, detail="Model files not found on disk")
            
        try:
            with open(model_path, 'rb') as f:
                model = pickle.load(f)
            pca = PCAFeatureExtractor()
            pca.load(pca_path)
            X_transformed = pca.transform(X)
            return model.predict(X_transformed)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Prediction error: {e}")

    @classmethod
    async def get_model_info(cls, model_id: str) -> Dict:
        try:
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM automl_models WHERE id = ?", (model_id,))
            row = cursor.fetchone()
            conn.close()
            
            if not row:
                raise HTTPException(status_code=404, detail="Model not found")
                
            return {
                "model_id": row["id"],
                "model_type": row["model_type"],
                "pca_variance": row["pca_variance"],
                "metrics": json.loads(row["metrics_json"]) if row["metrics_json"] else {},
                "created_at": row["created_at"]
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
