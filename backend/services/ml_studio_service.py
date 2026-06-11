import os
import uuid
import pickle
import pandas as pd
import numpy as np
import io
from typing import Dict, Any, List

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, 
    confusion_matrix, roc_curve, auc,
    mean_squared_error, mean_absolute_error, r2_score
)
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor, GradientBoostingRegressor, IsolationForest
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.svm import SVC, OneClassSVM
from sklearn.neighbors import KNeighborsClassifier
from sklearn.cluster import KMeans, DBSCAN
from xgboost import XGBClassifier, XGBRegressor

# Directories for temp storage
TEMP_DATA_DIR = "temp_data"
TEMP_MODELS_DIR = "temp_models"

os.makedirs(TEMP_DATA_DIR, exist_ok=True)
os.makedirs(TEMP_MODELS_DIR, exist_ok=True)

class MLStudioService:
    @staticmethod
    def process_upload(file_content: bytes, filename: str) -> Dict[str, Any]:
        """Parses an uploaded file into a dataframe and returns summary stats."""
        file_id = str(uuid.uuid4())
        ext = filename.split('.')[-1].lower()
        
        try:
            if ext == 'csv':
                df = pd.read_csv(io.BytesIO(file_content))
            elif ext in ['xls', 'xlsx']:
                df = pd.read_excel(io.BytesIO(file_content))
            elif ext == 'json':
                df = pd.read_json(io.BytesIO(file_content))
            else:
                raise ValueError(f"Unsupported file extension: {ext}")
                
            # Save temporarily
            file_path = os.path.join(TEMP_DATA_DIR, f"{file_id}.csv")
            df.to_csv(file_path, index=False)
            
            # Generate summary
            summary = {
                "file_id": file_id,
                "filename": filename,
                "rows": len(df),
                "columns": len(df.columns),
                "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
                "missing_values": df.isnull().sum().to_dict(),
                "preview": df.head(10).fillna("").to_dict(orient="records"),
                "columns_list": list(df.columns)
            }
            return summary
        except Exception as e:
            raise Exception(f"Failed to process file: {str(e)}")

    @staticmethod
    def suggest_features(file_id: str, target_column: str) -> Dict[str, Any]:
        """Provide basic suggestions for feature importance using RandomForest."""
        file_path = os.path.join(TEMP_DATA_DIR, f"{file_id}.csv")
        if not os.path.exists(file_path):
            raise Exception("Dataset not found. Please re-upload.")
            
        df = pd.read_csv(file_path)
        if target_column not in df.columns:
            raise Exception(f"Target column '{target_column}' not found in dataset.")
            
        # Basic preprocessing for quick estimation
        df = df.dropna(subset=[target_column])
        X = df.drop(columns=[target_column])
        y = df[target_column]
        
        # Select numeric columns only for quick suggestion
        numeric_cols = X.select_dtypes(include=[np.number]).columns.tolist()
        if not numeric_cols:
            return {"suggestions": "No numeric columns available for quick importance estimation."}
            
        X_num = X[numeric_cols].fillna(0)
        
        is_classification = df[target_column].nunique() < 20 or df[target_column].dtype == 'object'
        
        try:
            if is_classification:
                if y.dtype == 'object':
                    y = LabelEncoder().fit_transform(y)
                model = RandomForestClassifier(n_estimators=50, random_state=42)
            else:
                model = RandomForestRegressor(n_estimators=50, random_state=42)
                
            model.fit(X_num, y)
            importance = model.feature_importances_
            
            feature_importance = sorted(
                zip(numeric_cols, importance), 
                key=lambda x: x[1], 
                reverse=True
            )
            
            return {
                "target_type": "classification" if is_classification else "regression",
                "top_features": [{"feature": f, "importance": float(i)} for f, i in feature_importance[:10]]
            }
        except Exception as e:
            return {"error": f"Could not generate suggestions: {str(e)}"}

    @staticmethod
    def train_model(config: Dict[str, Any]) -> Dict[str, Any]:
        """Trains a model based on the configuration and returns metrics."""
        file_id = config.get("file_id")
        target_column = config.get("target_column")
        features = config.get("features", [])
        algorithm = config.get("algorithm")
        task_type = config.get("task_type") # classification, regression, clustering, anomaly
        
        file_path = os.path.join(TEMP_DATA_DIR, f"{file_id}.csv")
        if not os.path.exists(file_path):
            raise Exception("Dataset not found. Please re-upload.")
            
        df = pd.read_csv(file_path)
        
        if not features:
            features = list(df.columns)
            if target_column in features:
                features.remove(target_column)
                
        # Data Preprocessing
        X = df[features].copy()
        
        # Basic imputation
        num_cols = X.select_dtypes(include=[np.number]).columns
        cat_cols = X.select_dtypes(exclude=[np.number]).columns
        
        if len(num_cols) > 0:
            X[num_cols] = SimpleImputer(strategy='mean').fit_transform(X[num_cols])
        if len(cat_cols) > 0:
            X[cat_cols] = SimpleImputer(strategy='most_frequent').fit_transform(X[cat_cols])
            
            # One-hot encode categorical features
            X = pd.get_dummies(X, columns=cat_cols, drop_first=True)
            
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        model_id = str(uuid.uuid4())
        results = {"model_id": model_id, "algorithm": algorithm, "task_type": task_type}
        
        model = None
        
        # --- Classification & Regression ---
        if task_type in ["classification", "regression"]:
            if target_column not in df.columns:
                raise Exception(f"Target column '{target_column}' not found in dataset.")
                
            df = df.dropna(subset=[target_column])
            y = df[target_column]
            
            label_encoder = None
            if task_type == "classification" and y.dtype == 'object':
                label_encoder = LabelEncoder()
                y = label_encoder.fit_transform(y)
                
            X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42)
            
            if algorithm == "Random Forest":
                model = RandomForestClassifier(random_state=42) if task_type == "classification" else RandomForestRegressor(random_state=42)
            elif algorithm == "XGBoost":
                model = XGBClassifier(random_state=42) if task_type == "classification" else XGBRegressor(random_state=42)
            elif algorithm == "Logistic Regression":
                model = LogisticRegression(random_state=42, max_iter=1000)
            elif algorithm == "Linear Regression":
                model = LinearRegression()
            elif algorithm == "SVM":
                model = SVC(probability=True, random_state=42)
            elif algorithm == "KNN":
                model = KNeighborsClassifier()
            elif algorithm == "Gradient Boosting Regressor":
                model = GradientBoostingRegressor(random_state=42)
            else:
                raise Exception(f"Unsupported algorithm: {algorithm}")
                
            model.fit(X_train, y_train)
            y_pred = model.predict(X_test)
            
            if task_type == "classification":
                results["metrics"] = {
                    "accuracy": float(accuracy_score(y_test, y_pred)),
                    "precision": float(precision_score(y_test, y_pred, average='weighted', zero_division=0)),
                    "recall": float(recall_score(y_test, y_pred, average='weighted', zero_division=0)),
                    "f1": float(f1_score(y_test, y_pred, average='weighted', zero_division=0))
                }
                
                # Confusion Matrix
                cm = confusion_matrix(y_test, y_pred)
                results["confusion_matrix"] = cm.tolist()
                
                # Feature Importance if available
                if hasattr(model, 'feature_importances_'):
                    importances = model.feature_importances_
                    feature_names = X.columns
                    feat_imp = sorted(zip(feature_names, importances), key=lambda x: x[1], reverse=True)[:15]
                    results["feature_importance"] = [{"name": f, "value": float(v)} for f, v in feat_imp]
                    
            elif task_type == "regression":
                results["metrics"] = {
                    "mse": float(mean_squared_error(y_test, y_pred)),
                    "rmse": float(np.sqrt(mean_squared_error(y_test, y_pred))),
                    "mae": float(mean_absolute_error(y_test, y_pred)),
                    "r2": float(r2_score(y_test, y_pred))
                }
                
                if hasattr(model, 'feature_importances_'):
                    importances = model.feature_importances_
                    feature_names = X.columns
                    feat_imp = sorted(zip(feature_names, importances), key=lambda x: x[1], reverse=True)[:15]
                    results["feature_importance"] = [{"name": f, "value": float(v)} for f, v in feat_imp]
                    
                # Predictions vs Actual for scatter plot
                results["predictions_vs_actual"] = [{"actual": float(a), "predicted": float(p)} for a, p in zip(y_test[:100], y_pred[:100])]

        # --- Clustering ---
        elif task_type == "clustering":
            if algorithm == "K-Means":
                model = KMeans(n_clusters=3, random_state=42)
            elif algorithm == "DBSCAN":
                model = DBSCAN()
            else:
                raise Exception(f"Unsupported algorithm: {algorithm}")
                
            labels = model.fit_predict(X_scaled)
            results["metrics"] = {
                "n_clusters": int(len(np.unique(labels))),
                "silhouette_score": "N/A" # Skip calculating silhouette for simplicity, can be added later
            }
            # Distribution of clusters
            unique, counts = np.unique(labels, return_counts=True)
            results["cluster_distribution"] = [{"cluster": int(c), "count": int(count)} for c, count in zip(unique, counts)]

        # --- Anomaly Detection ---
        elif task_type == "anomaly":
            if algorithm == "Isolation Forest":
                model = IsolationForest(contamination=0.05, random_state=42)
            elif algorithm == "One-Class SVM":
                model = OneClassSVM(nu=0.05)
            else:
                raise Exception(f"Unsupported algorithm: {algorithm}")
                
            preds = model.fit_predict(X_scaled)
            n_anomalies = int((preds == -1).sum())
            n_normal = int((preds == 1).sum())
            
            results["metrics"] = {
                "total_samples": len(preds),
                "anomalies_detected": n_anomalies,
                "normal_samples": n_normal,
                "anomaly_percentage": float(n_anomalies / len(preds) * 100)
            }
            results["anomaly_distribution"] = [
                {"label": "Normal", "count": n_normal},
                {"label": "Anomaly", "count": n_anomalies}
            ]

        else:
            raise Exception(f"Unsupported task type: {task_type}")

        # Save model
        model_path = os.path.join(TEMP_MODELS_DIR, f"{model_id}.pickle")
        with open(model_path, 'wb') as f:
            pickle.dump(model, f)
            
        return results

    @staticmethod
    def generate_insights(results: Dict[str, Any]) -> Dict[str, Any]:
        """Generates AI insights based on the training results using Gemini."""
        import os
        from google import genai
        
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return {"insights": "Gemini API Key not configured. AI insights are unavailable."}
            
        try:
            client = genai.Client(api_key=api_key)
            prompt = f"Analyze the following Machine Learning model training results and provide actionable insights for an industrial setting:\n\n{results}\n\nProvide: 1) A human-readable interpretation of the metrics. 2) The strengths and weaknesses of this model based on the metrics. 3) Suggestions for operational improvements or model enhancements. Keep it concise."
            
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )
            return {"insights": response.text.strip()}
        except Exception as e:
            return {"insights": f"Failed to generate insights: {str(e)}"}
