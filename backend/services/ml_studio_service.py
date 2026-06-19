"""
ML Studio Service — In-Memory Only ML Analysis Engine.

Models are instantiated, fit, evaluated, and immediately discarded.
No .pkl files.  No model registry.  No persistence.
"""

import os
import uuid
import io
from typing import Dict, Any, List

import pandas as pd
import numpy as np

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.impute import SimpleImputer
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, roc_curve, auc,
    mean_squared_error, mean_absolute_error, r2_score,
    silhouette_score,
)
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor, IsolationForest
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.cluster import KMeans

# ─── Global In-Memory Dataset Cache ──────────────────────────────────────────
DATASET_CACHE: Dict[str, pd.DataFrame] = {}

# ─── Algorithm Registry ──────────────────────────────────────────────────────
# Dict-based dispatch — no if/else chains.
ALGORITHMS: Dict[str, Any] = {
    # Classification
    "Logistic Regression":      lambda: LogisticRegression(max_iter=1000, random_state=42),
    "Random Forest Classifier": lambda: RandomForestClassifier(n_estimators=100, random_state=42),
    "KNN":                      lambda: KNeighborsClassifier(),
    "SVM":                      lambda: SVC(probability=True, random_state=42),
    # Regression
    "Linear Regression":        lambda: LinearRegression(),
    "Random Forest Regressor":  lambda: RandomForestRegressor(n_estimators=100, random_state=42),
    # Clustering
    "KMeans":                   lambda: KMeans(n_clusters=3, random_state=42),
    # Anomaly Detection
    "Isolation Forest":         lambda: IsolationForest(contamination=0.05, random_state=42),  # type: ignore
}

TASK_ALGORITHMS: Dict[str, List[str]] = {
    "classification": ["Logistic Regression", "Random Forest Classifier", "KNN", "SVM"],
    "regression":     ["Linear Regression", "Random Forest Regressor"],
    "clustering":     ["KMeans"],
    "anomaly":        ["Isolation Forest"],
}


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _load_dataset(file_id: str) -> pd.DataFrame:
    """Load a previously uploaded dataset from in-memory cache."""
    if file_id not in DATASET_CACHE:
        raise FileNotFoundError("Dataset not found in memory. Please re-upload.")
    return DATASET_CACHE[file_id].copy()


def _preprocess_features(df: pd.DataFrame, features: List[str], algorithm: str):
    """Impute missing values, encode categoricals, scale numerics."""
    X = df[features].copy()

    # Step 1: Detect column types
    bool_cols = X.select_dtypes(include=['bool']).columns.tolist()
    datetime_cols = X.select_dtypes(include=['datetime', 'datetimetz']).columns.tolist()
    num_cols = X.select_dtypes(include=[np.number]).columns.tolist()
    cat_cols = X.select_dtypes(exclude=[np.number, 'bool', 'datetime', 'datetimetz']).columns.tolist()
    
    num_cols = [c for c in num_cols if c not in bool_cols]

    if datetime_cols:
        X = X.drop(columns=datetime_cols)

    missing_handled = False
    
    # Step 2: Handle missing values
    if num_cols and X[num_cols].isnull().any().any():  # type: ignore
        missing_handled = True
        X[num_cols] = SimpleImputer(strategy="median").fit_transform(X[num_cols])
        
    if cat_cols and X[cat_cols].isnull().any().any():  # type: ignore
        missing_handled = True
        X[cat_cols] = SimpleImputer(strategy="most_frequent").fit_transform(X[cat_cols])

    # Step 3: Encode categorical columns
    encoded_columns = len(cat_cols)
    cols_to_ohe = []
    for col in cat_cols:
        if X[col].nunique() > 10:  # type: ignore
            X[col] = LabelEncoder().fit_transform(X[col].astype(str))
        else:
            cols_to_ohe.append(col)
            
    if cols_to_ohe:
        X = pd.get_dummies(X, columns=cols_to_ohe, drop_first=True)

    if bool_cols:
        X[bool_cols] = X[bool_cols].astype(int)

    # Step 4: Determine scaling strategy
    SCALING_REQUIRED = {
        "Logistic Regression": True,
        "SVM": True,
        "KNN": True,
        "Linear Regression": True,
        "KMeans": True,
        "Random Forest Classifier": False,
        "Random Forest Regressor": False,
        "Isolation Forest": False
    }
    
    scaling_applied = False
    scaler_used = None
    needs_scaling = SCALING_REQUIRED.get(algorithm, False)
    
    if needs_scaling and num_cols:
        num_data = X[num_cols]
        max_val = num_data.max().max()
        min_val = num_data.min().min()
        
        if min_val >= -1 and max_val <= 1:
            needs_scaling = False

    if needs_scaling:
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        scaling_applied = True
        scaler_used = "StandardScaler"
    else:
        X_scaled = X.values if isinstance(X, pd.DataFrame) else X

    metadata = {
        "missing_values_handled": missing_handled,
        "encoded_columns": encoded_columns,
        "scaling_applied": scaling_applied,
        "scaler": scaler_used
    }

    return X_scaled, X.columns.tolist(), metadata


def _correlation_matrix(df: pd.DataFrame, features: List[str]):
    """Compute correlation matrix for numeric features."""
    num_df = df[features].select_dtypes(include=[np.number])
    if num_df.shape[1] < 2:
        return None
    corr = num_df.corr().round(3)
    return {
        "columns": corr.columns.tolist(),
        "data": corr.values.tolist(),
    }


# ─── Service Class ────────────────────────────────────────────────────────────

class MLStudioService:

    # ── Upload ────────────────────────────────────────────────────────────────

    @staticmethod
    def process_upload(file_content: bytes, filename: str) -> Dict[str, Any]:
        """Parse uploaded file and return summary statistics."""
        file_id = str(uuid.uuid4())
        ext = filename.rsplit(".", 1)[-1].lower()

        if ext == "csv":
            df = pd.read_csv(io.BytesIO(file_content))
        elif ext in ("xls", "xlsx"):
            df = pd.read_excel(io.BytesIO(file_content))
        elif ext == "json":
            df = pd.read_json(io.BytesIO(file_content))
        else:
            raise ValueError(f"Unsupported file format: .{ext}")

        # Keep DataFrame in memory
        DATASET_CACHE[file_id] = df
        
        # Cleanup: keep only latest 5 datasets to prevent memory leaks
        if len(DATASET_CACHE) > 5:
            oldest_key = next(iter(DATASET_CACHE))
            del DATASET_CACHE[oldest_key]

        # Column type classification
        num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        cat_cols = df.select_dtypes(exclude=[np.number]).columns.tolist()

        return {
            "file_id": file_id,
            "filename": filename,
            "rows": len(df),
            "columns": len(df.columns),
            "columns_list": list(df.columns),
            "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
            "missing_values": {col: int(v) for col, v in df.isnull().sum().items()},
            "numerical_columns": num_cols,
            "categorical_columns": cat_cols,
            "preview": df.head(100).fillna("").to_dict(orient="records"),
        }

    # ── Feature Suggestions ───────────────────────────────────────────────────

    @staticmethod
    def suggest_features(file_id: str, target_column: str) -> Dict[str, Any]:
        """Quick Random Forest to rank feature importance."""
        df = _load_dataset(file_id)
        if target_column not in df.columns:
            raise ValueError(f"Target column '{target_column}' not found.")

        df = df.dropna(subset=[target_column])
        X = df.drop(columns=[target_column])
        y = df[target_column]

        numeric_cols = X.select_dtypes(include=[np.number]).columns.tolist()
        if not numeric_cols:
            return {"error": "No numeric columns available for importance estimation."}

        X_num = X[numeric_cols].fillna(0)
        is_classification = y.nunique() < 20 or y.dtype == "object"

        try:
            if is_classification:
                y = LabelEncoder().fit_transform(y.astype(str))
                model = RandomForestClassifier(n_estimators=50, random_state=42)
            else:
                model = RandomForestRegressor(n_estimators=50, random_state=42)

            model.fit(X_num, y)
            importance = model.feature_importances_
            ranked = sorted(zip(numeric_cols, importance), key=lambda x: x[1], reverse=True)

            return {
                "target_type": "classification" if is_classification else "regression",
                "top_features": [{"feature": f, "importance": float(i)} for f, i in ranked[:10]],
            }
        except Exception as e:
            return {"error": f"Could not generate suggestions: {str(e)}"}

    # ── Run Analysis (core) ───────────────────────────────────────────────────

    @staticmethod
    def run_analysis(config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Instantiate → Fit → Evaluate → Return results → Destroy model.
        No model is persisted.
        """
        file_id = config["file_id"]
        target_column = config.get("target_column")
        features = config.get("features", [])
        algorithm = config["algorithm"]
        task_type = config["task_type"]

        df = _load_dataset(file_id)

        if not features:
            features = [c for c in df.columns if c != target_column]

        # Build result envelope
        num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        cat_cols = df.select_dtypes(exclude=[np.number]).columns.tolist()
        dataset_stats = {
            "rows": len(df),
            "columns": len(df.columns),
            "numerical_columns": num_cols,
            "categorical_columns": cat_cols,
            "missing_values": {col: int(v) for col, v in df.isnull().sum().items() if v > 0}
        }
        
        results: Dict[str, Any] = {
            "algorithm": algorithm,
            "task_type": task_type,
            "dataset_stats": dataset_stats,
        }

        # Correlation matrix (always useful)
        corr = _correlation_matrix(df, features)
        if corr:
            results["correlation_matrix"] = corr

        # Preprocess
        X_scaled, encoded_feature_names, prep_meta = _preprocess_features(df, features, algorithm)
        results["preprocessing"] = prep_meta

        # Instantiate model from registry
        if algorithm not in ALGORITHMS:
            raise ValueError(f"Unsupported algorithm: {algorithm}")
        model = ALGORITHMS[algorithm]()

        # ── Classification / Regression ───────────────────────────────────
        if task_type in ("classification", "regression"):
            if not target_column or target_column not in df.columns:
                raise ValueError(f"Target column '{target_column}' not found.")

            df_clean = df.dropna(subset=[target_column])
            y = df_clean[target_column]

            label_encoder = None
            class_names = None
            if task_type == "classification":
                label_encoder = LabelEncoder()
                y = pd.Series(label_encoder.fit_transform(y.astype(str)))
                class_names = label_encoder.classes_.tolist()

            # Re-preprocess on the cleaned dataframe
            X_scaled, encoded_feature_names, prep_meta = _preprocess_features(df_clean, features, algorithm)
            results["preprocessing"] = prep_meta

            X_train, X_test, y_train, y_test = train_test_split(
                X_scaled, y, test_size=0.2, random_state=42
            )

            model.fit(X_train, y_train)
            y_pred = model.predict(X_test)

            if task_type == "classification":
                results["metrics"] = {
                    "accuracy":  round(float(accuracy_score(y_test, y_pred)), 4),
                    "precision": round(float(precision_score(y_test, y_pred, average="weighted", zero_division=0)), 4),  # type: ignore
                    "recall":    round(float(recall_score(y_test, y_pred, average="weighted", zero_division=0)), 4),  # type: ignore
                    "f1_score":  round(float(f1_score(y_test, y_pred, average="weighted", zero_division=0)), 4),  # type: ignore
                }

                # Confusion Matrix
                cm = confusion_matrix(y_test, y_pred)
                results["confusion_matrix"] = list(cm)  # type: ignore
                if class_names:
                    results["class_names"] = class_names

                # ROC Curve (binary only; for multiclass skip gracefully)
                if hasattr(model, "predict_proba"):
                    try:
                        y_proba = model.predict_proba(X_test)
                        unique_classes = np.unique(y_test)
                        if len(unique_classes) == 2:
                            fpr, tpr, _ = roc_curve(y_test, y_proba[:, 1])
                            results["roc_curve"] = {
                                "fpr": [round(float(v), 4) for v in fpr[::max(1, len(fpr) // 100)]],
                                "tpr": [round(float(v), 4) for v in tpr[::max(1, len(tpr) // 100)]],
                                "auc": round(float(auc(fpr, tpr)), 4),
                            }
                    except Exception:
                        pass

                # Prediction distribution
                unique, counts = np.unique(y_pred, return_counts=True)
                labels = class_names if class_names else [str(u) for u in unique]
                results["prediction_distribution"] = [
                    {"label": labels[i] if i < len(labels) else str(u), "count": int(c)}
                    for i, (u, c) in enumerate(zip(unique, counts))
                ]

            else:  # regression
                mse_val = float(mean_squared_error(y_test, y_pred))
                results["metrics"] = {
                    "mae":  round(float(mean_absolute_error(y_test, y_pred)), 4),
                    "mse":  round(mse_val, 4),
                    "rmse": round(float(np.sqrt(mse_val)), 4),
                    "r2":   round(float(r2_score(y_test, y_pred)), 4),
                }

                # Predictions vs Actual (for scatter chart)
                results["predictions_vs_actual"] = [
                    {"actual": round(float(a), 4), "predicted": round(float(p), 4)}
                    for a, p in zip(y_test.values[:200], y_pred[:200])  # type: ignore
                ]

                # Prediction distribution (histogram buckets)
                hist_counts, bin_edges = np.histogram(y_pred, bins=10)
                results["prediction_distribution"] = [
                    {"label": f"{bin_edges[i]:.1f}-{bin_edges[i+1]:.1f}", "count": int(c)}
                    for i, c in enumerate(hist_counts)
                ]

            # Feature Importance (if supported by model)
            if hasattr(model, "feature_importances_"):
                importances = model.feature_importances_
                ranked = sorted(
                    zip(encoded_feature_names, importances),
                    key=lambda x: x[1], reverse=True,
                )[:15]
                results["feature_importance"] = [
                    {"name": str(f), "value": round(float(v), 4)} for f, v in ranked
                ]

        # ── Clustering ────────────────────────────────────────────────────
        elif task_type == "clustering":
            labels = model.fit_predict(X_scaled)
            n_clusters = int(len(np.unique(labels)))

            sil_score = None
            if n_clusters > 1 and n_clusters < len(X_scaled):
                try:
                    sil_score = round(float(silhouette_score(X_scaled, labels)), 4)
                except Exception:
                    pass

            results["metrics"] = {
                "n_clusters": n_clusters,
                "silhouette_score": sil_score if sil_score is not None else "N/A",
            }

            # Cluster distribution
            unique, counts = np.unique(labels, return_counts=True)
            results["cluster_distribution"] = [
                {"cluster": int(c), "count": int(cnt)} for c, cnt in zip(unique, counts)
            ]

            # Cluster scatter (first 2 PCA components if possible)
            if X_scaled.shape[1] >= 2:
                from sklearn.decomposition import PCA
                pca = PCA(n_components=2)
                coords = pca.fit_transform(X_scaled)
                # Sample up to 500 points for chart performance
                sample_size = min(500, len(coords))
                indices = np.random.choice(len(coords), sample_size, replace=False)
                results["cluster_scatter"] = [
                    {"x": round(float(coords[i, 0]), 4),
                     "y": round(float(coords[i, 1]), 4),
                     "cluster": int(labels[i])}
                    for i in indices
                ]

            results["prediction_distribution"] = [
                {"label": f"Cluster {c}", "count": int(cnt)} for c, cnt in zip(unique, counts)
            ]

        # ── Anomaly Detection ─────────────────────────────────────────────
        elif task_type == "anomaly":
            preds = model.fit_predict(X_scaled)
            n_anomalies = int((preds == -1).sum())
            n_normal = int((preds == 1).sum())
            total = len(preds)

            results["metrics"] = {
                "total_samples":     total,
                "anomalies_detected": n_anomalies,
                "normal_samples":    n_normal,
                "anomaly_percentage": round(float(n_anomalies / total * 100), 2),
            }

            results["prediction_distribution"] = [
                {"label": "Normal",  "count": n_normal},
                {"label": "Anomaly", "count": n_anomalies},
            ]

            # Anomaly scatter (PCA 2D)
            if X_scaled.shape[1] >= 2:
                from sklearn.decomposition import PCA
                pca = PCA(n_components=2)
                coords = pca.fit_transform(X_scaled)
                sample_size = min(500, len(coords))
                indices = np.random.choice(len(coords), sample_size, replace=False)
                results["anomaly_scatter"] = [
                    {"x": round(float(coords[i, 0]), 4),
                     "y": round(float(coords[i, 1]), 4),
                     "label": "Anomaly" if preds[i] == -1 else "Normal"}
                    for i in indices
                ]
        else:
            raise ValueError(f"Unsupported task type: {task_type}")

        # Model is now out of scope and will be garbage collected.
        # Explicitly delete for clarity.
        del model

        return results

    # ── AI Insights ───────────────────────────────────────────────────────────

    @staticmethod
    def generate_insights(results: Dict[str, Any]) -> Dict[str, Any]:
        """Generate structured AI insights from results using InsightEngine."""
        from services.insight_engine import InsightEngine
        try:
            report = InsightEngine.generate_report(results)
            return {"insights": report}
        except Exception as e:
            return {"error": f"Failed to generate insights: {str(e)}"}
