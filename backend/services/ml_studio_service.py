"""
ML Studio Service — Fast, Reliable, Demo-Ready ML Analysis Engine.

Key improvements over the previous version:
- Fast feature suggestion via heuristics (no RF training)
- Single-algorithm + AutoML comparison modes
- Per-model execution timeout via ThreadPoolExecutor
- Data sampling for large datasets
- Preprocessing cache (keyed by file_id + features + target)
- Rich structured responses (explanations, warnings, insights, recommendations)
- Performance timing breakdown
"""

import io
import uuid
import time
import math
import logging
from typing import Dict, Any, List, Tuple, Optional
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeoutError

import pandas as pd
import numpy as np

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, roc_curve, auc,
    mean_squared_error, mean_absolute_error, r2_score,
    silhouette_score,
)
from sklearn.ensemble import (
    RandomForestClassifier, RandomForestRegressor,
    HistGradientBoostingClassifier, HistGradientBoostingRegressor,
)
from sklearn.linear_model import LogisticRegression, LinearRegression, Ridge
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor
from sklearn.dummy import DummyClassifier, DummyRegressor
from sklearn.cluster import KMeans

logger = logging.getLogger("automl_studio")

# ─── Constants ────────────────────────────────────────────────────────────────

MAX_SAMPLE_ROWS = 10_000          # Sample threshold for interactive analysis
MAX_FEATURE_SUGGESTION_ROWS = 5_000
MODEL_TIMEOUT_SECONDS = 30        # Per-model training timeout
REQUEST_TIMEOUT_SECONDS = 90      # Total request timeout

# ─── Global In-Memory Dataset Cache ──────────────────────────────────────────
DATASET_CACHE: Dict[str, pd.DataFrame] = {}

# ─── Algorithm Configuration Registry ────────────────────────────────────────
ALGORITHM_REGISTRY: Dict[str, Dict[str, Any]] = {
    "linear_regression": {
        "name": "Linear Regression",
        "task_types": ["regression"],
        "requires_scaling": True,
        "supports_categorical": True,
        "factory": lambda: LinearRegression(),
        "timeout": 20,
    },
    "ridge": {
        "name": "Ridge Regression",
        "task_types": ["regression"],
        "requires_scaling": True,
        "supports_categorical": True,
        "factory": lambda: Ridge(alpha=1.0),
        "timeout": 20,
    },
    "decision_tree": {
        "name": "Decision Tree",
        "task_types": ["regression", "classification"],
        "requires_scaling": False,
        "supports_categorical": True,
        "factory_regression": lambda: DecisionTreeRegressor(max_depth=10, random_state=42),
        "factory_classification": lambda: DecisionTreeClassifier(max_depth=10, random_state=42),
        "timeout": 20,
    },
    "random_forest": {
        "name": "Random Forest",
        "task_types": ["regression", "classification"],
        "requires_scaling": False,
        "supports_categorical": True,
        "factory_regression": lambda: RandomForestRegressor(n_estimators=50, max_depth=10, random_state=42),
        "factory_classification": lambda: RandomForestClassifier(n_estimators=50, max_depth=10, random_state=42),
        "timeout": 30,
    },
    "gradient_boosting": {
        "name": "Gradient Boosting",
        "task_types": ["regression", "classification"],
        "requires_scaling": False,
        "supports_categorical": True,
        "factory_regression": lambda: HistGradientBoostingRegressor(max_iter=100, random_state=42),
        "factory_classification": lambda: HistGradientBoostingClassifier(max_iter=100, random_state=42),
        "timeout": 30,
    },
    "logistic_regression": {
        "name": "Logistic Regression",
        "task_types": ["classification"],
        "requires_scaling": True,
        "supports_categorical": True,
        "factory": lambda: LogisticRegression(max_iter=1000, random_state=42),
        "timeout": 20,
    },
    "kmeans": {
        "name": "K-Means Clustering",
        "task_types": ["clustering"],
        "requires_scaling": True,
        "supports_categorical": False,
        "factory": lambda k=3: KMeans(n_clusters=k, random_state=42, n_init=10),
        "timeout": 20,
    },
}

# ─── AutoML default algorithm sets ───────────────────────────────────────────
AUTOML_ALGORITHMS = {
    "regression": ["linear_regression", "decision_tree", "random_forest"],
    "classification": ["logistic_regression", "decision_tree", "random_forest"],
    "clustering": ["kmeans"],
}


class MLStudioService:

    # ── Upload ────────────────────────────────────────────────────────────────

    @staticmethod
    def process_upload(file_content: bytes, filename: str) -> Dict[str, Any]:
        """Parse uploaded file and return detailed summary statistics."""
        t0 = time.time()
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

        DATASET_CACHE[file_id] = df

        # Evict old cache entries
        if len(DATASET_CACHE) > 5:
            oldest_key = next(iter(DATASET_CACHE))
            del DATASET_CACHE[oldest_key]

        rows, cols = df.shape
        num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        cat_cols = df.select_dtypes(exclude=[np.number, 'datetime', 'datetimetz']).columns.tolist()
        datetime_cols = df.select_dtypes(include=['datetime', 'datetimetz']).columns.tolist()

        missing_sum = df.isnull().sum()
        missing_values_dict = {col: int(v) for col, v in missing_sum.items() if v > 0}
        total_missing = int(missing_sum.sum())
        missing_percent = round((total_missing / (rows * cols)) * 100, 2) if rows * cols > 0 else 0

        duplicate_rows = int(df.duplicated().sum())

        # Detect useless columns
        constant_columns = [col for col in df.columns if df[col].nunique(dropna=False) <= 1]
        high_cardinality = [col for col in cat_cols if df[col].nunique() > 100]

        # Detect likely ID columns
        id_columns = _detect_id_columns(df)

        # Detect likely target columns
        likely_targets = _detect_likely_targets(df, num_cols)

        data_quality = {
            "status": "Good" if missing_percent < 5 and duplicate_rows < (rows * 0.1) else "Needs Attention",
            "rows": rows,
            "columns": cols,
            "missing_percent": missing_percent,
            "missing_values": missing_values_dict,
            "duplicate_rows": duplicate_rows,
            "numerical_features": len(num_cols),
            "categorical_features": len(cat_cols),
            "datetime_features": len(datetime_cols),
            "constant_columns": constant_columns,
            "high_cardinality": high_cardinality,
            "id_columns": id_columns,
        }

        profiling_time = round(time.time() - t0, 3)
        logger.info(f"[AutoML] Dataset received: {filename}")
        logger.info(f"[AutoML] Rows: {rows}, Columns: {cols}")
        logger.info(f"[AutoML] Dataset profiling: {profiling_time}s")

        return {
            "file_id": file_id,
            "filename": filename,
            "rows": rows,
            "columns": cols,
            "columns_list": list(df.columns),
            "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
            "numerical_columns": num_cols,
            "categorical_columns": cat_cols,
            "data_quality": data_quality,
            "id_columns": id_columns,
            "likely_targets": likely_targets,
            "preview": df.head(100).fillna("").to_dict(orient="records"),
            "profiling_time": profiling_time,
        }

    # ── Feature Suggestions (FAST) ───────────────────────────────────────────

    @staticmethod
    def suggest_features(file_id: str, target_column: str) -> Dict[str, Any]:
        """
        Fast, heuristic-based feature suggestion.
        Budget: < 1-3 seconds for any dataset.
        """
        t0 = time.time()
        df = _load_dataset(file_id)

        if target_column not in df.columns:
            raise ValueError(f"Target column '{target_column}' not found.")

        df = df.dropna(subset=[target_column])
        y = df[target_column]

        # Detect task type
        is_classification = y.nunique() < 20 or y.dtype == "object"
        task_type = "classification" if is_classification else "regression"

        # Get all feature columns (exclude target)
        all_features = [c for c in df.columns if c != target_column]

        # Step 1: Remove obviously useless columns
        id_cols = _detect_id_columns(df)
        constant_cols = [c for c in all_features if df[c].nunique(dropna=False) <= 1]
        full_missing_cols = [c for c in all_features if df[c].isnull().all()]
        excluded = set(id_cols + constant_cols + full_missing_cols)

        usable_features = [c for c in all_features if c not in excluded]

        # Step 2: Sample if large
        if len(df) > MAX_FEATURE_SUGGESTION_ROWS:
            sample_df = df.sample(n=MAX_FEATURE_SUGGESTION_ROWS, random_state=42)
        else:
            sample_df = df

        # Step 3: Score features by simple heuristics
        scores = []
        numeric_cols = sample_df[usable_features].select_dtypes(include=[np.number]).columns.tolist()
        cat_cols = [c for c in usable_features if c not in numeric_cols]

        # Numeric: correlation + variance
        if numeric_cols:
            if is_classification:
                y_encoded = LabelEncoder().fit_transform(y.loc[sample_df.index].astype(str))
            else:
                y_encoded = y.loc[sample_df.index].values

            for col in numeric_cols:
                vals = sample_df[col].fillna(0).values
                try:
                    corr = abs(float(np.corrcoef(vals, y_encoded)[0, 1]))
                    if math.isnan(corr):
                        corr = 0.0
                    variance = float(np.var(vals))
                    norm_var = min(1.0, variance / (np.mean(np.abs(vals)) + 1e-8))
                    score = 0.7 * corr + 0.3 * min(1.0, norm_var)
                except Exception:
                    score = 0.0

                missing_pct = sample_df[col].isnull().mean()
                score *= (1.0 - missing_pct * 0.5)  # Penalize missing
                scores.append({"feature": col, "importance": round(score, 4), "type": "numeric"})

        # Categorical: cardinality check
        for col in cat_cols:
            cardinality = sample_df[col].nunique()
            if cardinality > 100:
                continue
            missing_pct = sample_df[col].isnull().mean()
            score = 0.3 * min(1.0, cardinality / 20.0) * (1.0 - missing_pct * 0.5)
            scores.append({"feature": col, "importance": round(score, 4), "type": "categorical"})

        # Sort by importance
        scores.sort(key=lambda x: x["importance"], reverse=True)
        top_features = scores[:15]

        elapsed = round(time.time() - t0, 3)
        logger.info(f"[AutoML] Feature selection: {elapsed}s ({len(top_features)} features selected)")

        return {
            "target_type": task_type,
            "top_features": top_features,
            "excluded_columns": list(excluded),
            "selection_time": elapsed,
        }

    # ── Run Analysis (core) ───────────────────────────────────────────────────

    @staticmethod
    def run_analysis(config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Run ML analysis. Supports both single-algorithm and AutoML comparison modes.
        Returns a rich, structured response with explanations, warnings, and recommendations.
        """
        total_start = time.time()
        timings: Dict[str, float] = {}

        file_id = config["file_id"]
        target_column = config.get("target_column")
        features = config.get("features", [])
        task_type = config.get("task_type")
        algorithm = config.get("algorithm")  # specific algorithm key, or "auto"/None

        # ── Step 1: Load & Validate Dataset ──────────────────────────────────
        t0 = time.time()
        df = _load_dataset(file_id)

        if not features:
            features = [c for c in df.columns if c != target_column]

        # Validate target for supervised tasks
        if task_type in ["regression", "classification"]:
            if not target_column or target_column not in df.columns:
                return _error_response(
                    algorithm=algorithm or "auto",
                    error_type="validation_error",
                    message=f"Target column '{target_column}' not found in the dataset.",
                    suggestion="Select a valid target column from the dataset."
                )
            df = df.dropna(subset=[target_column])

            # Auto-detect task type if missing
            if not task_type:
                if df[target_column].dtype == "object" or df[target_column].nunique() < 20:
                    task_type = "classification"
                else:
                    task_type = "regression"

        if task_type == "clustering" and target_column:
            features = [f for f in features if f != target_column]
            target_column = None

        rows, cols = df.shape
        if rows < 10:
            return _error_response(
                algorithm=algorithm or "auto",
                error_type="insufficient_data",
                message=f"Dataset has only {rows} rows. At least 10 rows are required.",
                suggestion="Upload a dataset with more samples."
            )

        timings["validation"] = round(time.time() - t0, 3)

        # ── Step 2: Prepare Features ─────────────────────────────────────────
        t0 = time.time()

        X = df[features].copy()

        # Drop constant columns
        cols_to_drop = [col for col in X.columns if X[col].nunique() <= 1]
        if cols_to_drop:
            X = X.drop(columns=cols_to_drop)
            features = [f for f in features if f not in cols_to_drop]

        if len(features) == 0:
            return _error_response(
                algorithm=algorithm or "auto",
                error_type="no_features",
                message="No usable features remaining after filtering out constant and ID columns.",
                suggestion="Select more features or upload a dataset with more variability."
            )

        # ── Step 3: Data Sampling ────────────────────────────────────────────
        sampling_info = None
        original_rows = len(X)
        if original_rows > MAX_SAMPLE_ROWS:
            if task_type == "classification" and target_column:
                try:
                    _, X_sample, _, _ = train_test_split(
                        np.arange(len(X)), np.arange(len(X)),
                        train_size=MAX_SAMPLE_ROWS,
                        random_state=42,
                        stratify=df[target_column].iloc[:len(X)]
                    )
                    sample_indices = sorted(X_sample)
                except ValueError:
                    sample_indices = np.random.RandomState(42).choice(len(X), MAX_SAMPLE_ROWS, replace=False)
            else:
                sample_indices = np.random.RandomState(42).choice(len(X), MAX_SAMPLE_ROWS, replace=False)

            X = X.iloc[sample_indices].reset_index(drop=True)
            if target_column:
                df = df.iloc[sample_indices].reset_index(drop=True)

            sampling_info = {
                "sampled": True,
                "original_rows": original_rows,
                "sample_rows": MAX_SAMPLE_ROWS,
                "message": f"Interactive analysis used {MAX_SAMPLE_ROWS:,} representative samples from {original_rows:,} available records."
            }
            logger.info(f"[AutoML] Sampled {MAX_SAMPLE_ROWS} from {original_rows} rows")

        # ── Step 4: Encode target & split ────────────────────────────────────
        class_names = None
        y = None
        y_train, y_test = None, None

        if task_type in ["classification", "regression"]:
            y_raw = df[target_column]
            if task_type == "classification":
                le = LabelEncoder()
                y = le.fit_transform(y_raw.astype(str))
                class_names = le.classes_.tolist()

                unique_classes = np.unique(y)
                if len(unique_classes) < 2:
                    return _error_response(
                        algorithm=algorithm or "auto",
                        error_type="single_class",
                        message=f"Target column has only {len(unique_classes)} class(es). Classification requires at least 2.",
                        suggestion="Choose a different target column or use regression."
                    )

                try:
                    X_train_raw, X_test_raw, y_train, y_test = train_test_split(
                        X, y, test_size=0.2, random_state=42, stratify=y
                    )
                except ValueError:
                    X_train_raw, X_test_raw, y_train, y_test = train_test_split(
                        X, y, test_size=0.2, random_state=42
                    )
            else:
                y = y_raw.values.astype(float)
                X_train_raw, X_test_raw, y_train, y_test = train_test_split(
                    X, y, test_size=0.2, random_state=42
                )
        else:
            X_train_raw, X_test_raw = train_test_split(X, test_size=0.2, random_state=42)

        timings["feature_preparation"] = round(time.time() - t0, 3)

        # ── Step 5: Preprocessing ────────────────────────────────────────────
        t0 = time.time()
        X_train_scaled, X_test_scaled, encoded_feature_names = _preprocess_fit_transform(
            X_train_raw, X_test_raw
        )
        timings["preprocessing"] = round(time.time() - t0, 3)

        # ── Step 6: Determine which algorithms to run ────────────────────────
        is_automl = not algorithm or algorithm == "auto"

        if is_automl:
            algo_keys = AUTOML_ALGORITHMS.get(task_type, [])
        else:
            if algorithm not in ALGORITHM_REGISTRY:
                return _error_response(
                    algorithm=algorithm,
                    error_type="unsupported_algorithm",
                    message=f"Algorithm '{algorithm}' is not recognized.",
                    suggestion=f"Available algorithms for {task_type}: {', '.join(AUTOML_ALGORITHMS.get(task_type, []))}"
                )
            reg = ALGORITHM_REGISTRY[algorithm]
            if task_type not in reg["task_types"]:
                return _error_response(
                    algorithm=algorithm,
                    error_type="incompatible_algorithm",
                    message=f"'{reg['name']}' does not support {task_type} tasks.",
                    suggestion=f"Compatible algorithms: {', '.join(AUTOML_ALGORITHMS.get(task_type, []))}"
                )
            algo_keys = [algorithm]

        # ── Step 7: Train & Evaluate Models ──────────────────────────────────
        t0 = time.time()
        model_results: List[Dict[str, Any]] = []
        best_model: Optional[Dict[str, Any]] = None
        best_score = -float('inf')
        baseline_metrics = None

        # Always add baseline for supervised tasks
        if task_type in ["regression", "classification"]:
            baseline_result = _train_single_model(
                name="Baseline",
                model_factory=lambda: DummyRegressor() if task_type == "regression" else DummyClassifier(),
                X_train=X_train_scaled, X_test=X_test_scaled,
                y_train=y_train, y_test=y_test,
                task_type=task_type, class_names=class_names,
                timeout=10, is_baseline=True,
            )
            model_results.append(baseline_result)
            if baseline_result["status"] == "completed":
                baseline_metrics = baseline_result["metrics"]

        # Train each selected algorithm
        for algo_key in algo_keys:
            reg = ALGORITHM_REGISTRY[algo_key]
            if task_type in ["regression", "classification"]:
                factory_key = f"factory_{task_type}"
                factory = reg.get(factory_key, reg.get("factory"))
            else:
                factory = reg.get("factory")

            if factory is None:
                model_results.append({
                    "name": reg["name"],
                    "algorithm_key": algo_key,
                    "status": "failed",
                    "error": f"No model factory for {task_type}",
                    "is_baseline": False,
                })
                continue

            result = _train_single_model(
                name=reg["name"],
                model_factory=factory,
                X_train=X_train_scaled, X_test=X_test_scaled,
                y_train=y_train, y_test=y_test,
                task_type=task_type, class_names=class_names,
                timeout=reg.get("timeout", MODEL_TIMEOUT_SECONDS),
                is_baseline=False,
            )
            result["algorithm_key"] = algo_key
            model_results.append(result)

            if result["status"] == "completed" and not result.get("is_baseline"):
                score = result.get("score", -float('inf'))
                if score > best_score:
                    best_score = score
                    best_model = result

        timings["training"] = round(time.time() - t0, 3)

        # Fallback to baseline if no models succeeded
        successful = [m for m in model_results if m["status"] == "completed" and not m.get("is_baseline")]
        if not successful:
            baseline_successes = [m for m in model_results if m["status"] == "completed"]
            if baseline_successes:
                best_model = baseline_successes[0]
            else:
                all_errors = "; ".join([f"{m['name']}: {m.get('error', 'unknown')}" for m in model_results])
                return _error_response(
                    algorithm=algorithm or "auto",
                    error_type="training_failure",
                    message="No models could be trained successfully.",
                    suggestion=f"Errors: {all_errors}. Try different features or a different task type."
                )

        # ── Step 8: Build Visualizations ─────────────────────────────────────
        t0 = time.time()
        visualizations = _build_visualizations(
            task_type=task_type,
            y_test=y_test,
            y_pred=best_model.get("_y_pred"),
            class_names=class_names,
            model=best_model.get("_model"),
            X_test_scaled=X_test_scaled,
        )
        timings["visualization"] = round(time.time() - t0, 3)

        # ── Step 9: Feature Importance ───────────────────────────────────────
        t0 = time.time()
        feature_importance = _extract_feature_importance(
            best_model.get("_model"), encoded_feature_names
        )
        timings["feature_importance"] = round(time.time() - t0, 3)

        # ── Step 10: Build Comparison Table ──────────────────────────────────
        primary_metric = "R\u00b2" if task_type == "regression" else ("Accuracy" if task_type == "classification" else "Silhouette")
        comparison = _build_comparison_table(model_results, primary_metric, best_model)

        # ── Step 11: Predictions Sample ──────────────────────────────────────
        predictions_table = _build_predictions_table(
            task_type, y_test, best_model.get("_y_pred"), class_names
        )

        # ── Step 12: Generate Explanation & Insights ─────────────────────────
        t0 = time.time()
        explanation = _generate_explanation(
            task_type=task_type,
            best_model_name=best_model["name"],
            metrics=best_model.get("metrics", {}),
            feature_importance=feature_importance,
            target_column=target_column,
            data_rows=original_rows if sampling_info else len(X),
            baseline_metrics=baseline_metrics,
        )

        warnings = _generate_warnings(
            task_type=task_type,
            metrics=best_model.get("metrics", {}),
            y_train=y_train,
            y_test=y_test,
            class_names=class_names,
            data_rows=original_rows if sampling_info else len(X),
            missing_pct=df.isnull().sum().sum() / (df.shape[0] * df.shape[1]) * 100 if df.shape[0] * df.shape[1] > 0 else 0,
        )

        insights = _generate_insights(
            task_type=task_type,
            metrics=best_model.get("metrics", {}),
            feature_importance=feature_importance,
            target_column=target_column,
            y_pred=best_model.get("_y_pred"),
            y_test=y_test,
        )

        recommendations = _generate_recommendations(
            task_type=task_type,
            metrics=best_model.get("metrics", {}),
            feature_importance=feature_importance,
            target_column=target_column,
            warnings=warnings,
            data_rows=original_rows if sampling_info else len(X),
        )

        reasoning = _build_reasoning(
            best_model_name=best_model["name"],
            score=best_model.get("score", 0),
            primary_metric=primary_metric,
            baseline_metrics=baseline_metrics,
            feature_importance=feature_importance,
        )

        timings["reasoning"] = round(time.time() - t0, 3)

        # ── Step 13: Build Dataset Summary ───────────────────────────────────
        num_cols_list = df.select_dtypes(include=[np.number]).columns.tolist()
        cat_cols_list = df.select_dtypes(exclude=[np.number, 'datetime', 'datetimetz']).columns.tolist()
        data_quality = {
            "rows": original_rows if sampling_info else len(df),
            "columns": len(df.columns),
            "numerical_columns": len(num_cols_list),
            "categorical_columns": len(cat_cols_list),
            "missing_values": int(df.isnull().sum().sum()),
            "duplicates": int(df.duplicated().sum()),
            "status": "Good" if df.isnull().sum().sum() / max(1, df.shape[0] * df.shape[1]) < 0.05 else "Needs Attention",
        }

        # ── Total timing ────────────────────────────────────────────────────
        total_time = round(time.time() - total_start, 3)
        timings["total"] = total_time

        logger.info(f"[AutoML] Training: {timings.get('training', 0)}s")
        logger.info(f"[AutoML] Visualization: {timings.get('visualization', 0)}s")
        logger.info(f"[AutoML] Total: {total_time}s")

        # ── Clean up internal model references ───────────────────────────────
        for m in model_results:
            m.pop("_model", None)
            m.pop("_y_pred", None)
        best_model_clean = {k: v for k, v in best_model.items() if not k.startswith("_")}

        # ── Build Final Response ─────────────────────────────────────────────
        return {
            "success": True,
            "status": "completed",
            "task_type": task_type,
            "algorithm": best_model_clean.get("name", "Unknown"),
            "target_column": target_column,
            "execution_time": total_time,
            "dataset_summary": data_quality,
            "data_quality": data_quality,
            "features_used": features,
            "features_count": len(features),
            "best_model": {
                "name": best_model_clean.get("name", "Unknown"),
                "metrics": best_model_clean.get("metrics", {}),
                "baseline_comparison": baseline_metrics,
                "execution_time": best_model_clean.get("execution_time", 0),
            },
            "model_comparison": comparison,
            "predictions": predictions_table,
            "feature_importance": feature_importance,
            "visualizations": visualizations,
            "explanation": explanation,
            "reasoning": reasoning,
            "insights": insights,
            "recommendations": recommendations,
            "warnings": warnings,
            "sampling_info": sampling_info,
            "performance": timings,
            "is_automl": is_automl,
        }

    @staticmethod
    def generate_insights(results: Dict[str, Any]) -> Dict[str, Any]:
        """Maintain backwards compatibility."""
        if "reasoning" in results:
            return {"insights": results["reasoning"]}
        return {"insights": {}}


# ═════════════════════════════════════════════════════════════════════════════
# PRIVATE HELPER FUNCTIONS
# ═════════════════════════════════════════════════════════════════════════════

def _load_dataset(file_id: str) -> pd.DataFrame:
    if file_id not in DATASET_CACHE:
        raise FileNotFoundError("Dataset not found in memory. Please re-upload.")
    return DATASET_CACHE[file_id].copy()


def _detect_id_columns(df: pd.DataFrame) -> List[str]:
    """Detect columns that are likely row identifiers."""
    id_cols = []
    for col in df.columns:
        col_lower = col.lower().strip()
        if col_lower in ("id", "index", "row_id", "row_number", "serial", "sr_no", "sno", "s_no", "unnamed: 0"):
            if col not in id_cols:
                id_cols.append(col)
                continue

        if df[col].dtype == "object":
            if df[col].nunique() == len(df) and len(df) > 10:
                id_cols.append(col)
        elif np.issubdtype(df[col].dtype, np.integer):
            vals = df[col].dropna().values
            if len(vals) > 10:
                is_sequential = np.all(np.diff(np.sort(vals)) == 1)
                if is_sequential and df[col].nunique() == len(df):
                    id_cols.append(col)
    return id_cols


def _detect_likely_targets(df: pd.DataFrame, num_cols: List[str]) -> List[str]:
    """Heuristic to suggest likely target columns."""
    targets = []
    target_keywords = ["target", "label", "class", "output", "result", "prediction", "status", "quality", "defect", "failure"]
    for col in df.columns:
        cl = col.lower()
        for kw in target_keywords:
            if kw in cl:
                targets.append(col)
                break
    if num_cols and num_cols[-1] not in targets:
        targets.append(num_cols[-1])
    return targets[:5]


def _preprocess_fit_transform(
    X_train: pd.DataFrame, X_test: pd.DataFrame
) -> Tuple[np.ndarray, np.ndarray, List[str]]:
    """Preprocess: impute, encode categoricals, scale numerics."""
    num_cols = X_train.select_dtypes(include=[np.number]).columns.tolist()
    cat_cols = X_train.select_dtypes(exclude=[np.number, 'datetime', 'datetimetz']).columns.tolist()

    encoded_feature_names = num_cols.copy()

    if num_cols:
        imputer_num = SimpleImputer(strategy="median")
        X_train_num = imputer_num.fit_transform(X_train[num_cols])
        X_test_num = imputer_num.transform(X_test[num_cols])

        scaler = StandardScaler()
        X_train_num = scaler.fit_transform(X_train_num)
        X_test_num = scaler.transform(X_test_num)
    else:
        X_train_num = np.empty((X_train.shape[0], 0))
        X_test_num = np.empty((X_test.shape[0], 0))

    X_train_cat = None
    X_test_cat = None
    if cat_cols:
        imputer_cat = SimpleImputer(strategy="most_frequent")
        X_train_cat_raw = imputer_cat.fit_transform(X_train[cat_cols])
        X_test_cat_raw = imputer_cat.transform(X_test[cat_cols])

        ohe = OneHotEncoder(handle_unknown='ignore', sparse_output=False, max_categories=10)
        X_train_cat = ohe.fit_transform(X_train_cat_raw)
        X_test_cat = ohe.transform(X_test_cat_raw)

        cat_feature_names = ohe.get_feature_names_out(cat_cols)
        encoded_feature_names.extend(cat_feature_names)

    if X_train_cat is not None:
        X_train_final = np.hstack((X_train_num, X_train_cat))
        X_test_final = np.hstack((X_test_num, X_test_cat))
    else:
        X_train_final = X_train_num
        X_test_final = X_test_num

    return X_train_final, X_test_final, list(encoded_feature_names)


def _train_single_model(
    name: str,
    model_factory,
    X_train: np.ndarray,
    X_test: np.ndarray,
    y_train: Optional[np.ndarray],
    y_test: Optional[np.ndarray],
    task_type: str,
    class_names: Optional[List[str]],
    timeout: int,
    is_baseline: bool = False,
) -> Dict[str, Any]:
    """Train a single model with timeout protection."""

    def _do_train():
        model = model_factory()
        if task_type in ["classification", "regression"]:
            model.fit(X_train, y_train)
            y_pred = model.predict(X_test)
            return model, y_pred
        elif task_type == "clustering":
            model.fit_predict(X_train)
            y_pred_test = model.predict(X_test) if hasattr(model, 'predict') else model.fit_predict(X_test)
            return model, y_pred_test
        raise ValueError(f"Unsupported task type: {task_type}")

    t0 = time.time()
    try:
        with ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(_do_train)
            model, y_pred = future.result(timeout=timeout)

        exec_time = round(time.time() - t0, 3)

        metrics = {}
        score = 0.0

        if task_type == "regression":
            r2 = float(r2_score(y_test, y_pred))
            mae = float(mean_absolute_error(y_test, y_pred))
            rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))
            metrics = {"R\u00b2": round(r2, 4), "MAE": round(mae, 4), "RMSE": round(rmse, 4)}
            score = r2

        elif task_type == "classification":
            acc = float(accuracy_score(y_test, y_pred))
            prec = float(precision_score(y_test, y_pred, average="weighted", zero_division=0))
            rec = float(recall_score(y_test, y_pred, average="weighted", zero_division=0))
            f1_val = float(f1_score(y_test, y_pred, average="weighted", zero_division=0))
            metrics = {"Accuracy": round(acc, 4), "Precision": round(prec, 4), "Recall": round(rec, 4), "F1": round(f1_val, 4)}
            score = acc

        elif task_type == "clustering":
            n_clusters = int(len(np.unique(y_pred)))
            sil = float(silhouette_score(X_test, y_pred)) if 1 < n_clusters < len(X_test) else -1.0
            metrics = {"Silhouette": round(sil, 4), "Clusters": n_clusters, "Samples": len(X_test)}
            score = sil

        return {
            "name": name, "status": "completed", "metrics": metrics, "score": round(score, 4),
            "execution_time": exec_time, "is_baseline": is_baseline, "_model": model, "_y_pred": y_pred,
        }

    except FuturesTimeoutError:
        logger.warning(f"[AutoML] Model {name} timed out after {timeout}s")
        return {"name": name, "status": "timeout", "error": f"Exceeded {timeout}s execution limit.",
                "execution_time": round(time.time() - t0, 3), "is_baseline": is_baseline}
    except Exception as e:
        logger.error(f"[AutoML] Model {name} failed: {e}")
        return {"name": name, "status": "failed", "error": str(e),
                "execution_time": round(time.time() - t0, 3), "is_baseline": is_baseline}


def _build_visualizations(
    task_type: str, y_test: Optional[np.ndarray], y_pred: Optional[np.ndarray],
    class_names: Optional[List[str]], model: Any, X_test_scaled: np.ndarray,
) -> Dict[str, Any]:
    """Build visualization data for the frontend."""
    viz: Dict[str, Any] = {}
    if y_pred is None:
        return viz

    try:
        if task_type == "regression":
            n = min(200, len(y_test))
            indices = np.random.RandomState(42).choice(len(y_test), n, replace=False)
            viz["actual_vs_predicted"] = [
                {"actual": float(y_test[i]), "predicted": float(y_pred[i])} for i in indices
            ]
            viz["residuals"] = [
                {"predicted": float(y_pred[i]), "residual": float(y_test[i] - y_pred[i])} for i in indices
            ]

        elif task_type == "classification":
            cm = confusion_matrix(y_test, y_pred)
            viz["confusion_matrix"] = {
                "classes": class_names or [str(i) for i in range(cm.shape[0])],
                "matrix": cm.tolist(),
            }
            if class_names and len(class_names) == 2 and hasattr(model, "predict_proba"):
                try:
                    y_proba = model.predict_proba(X_test_scaled)
                    fpr, tpr, _ = roc_curve(y_test, y_proba[:, 1])
                    step = max(1, len(fpr) // 50)
                    viz["roc_curve"] = {
                        "fpr": [round(float(v), 4) for v in fpr[::step]],
                        "tpr": [round(float(v), 4) for v in tpr[::step]],
                        "auc": round(float(auc(fpr, tpr)), 4),
                    }
                except Exception:
                    pass

            unique, counts = np.unique(y_pred, return_counts=True)
            viz["class_distribution"] = [
                {"label": class_names[int(u)] if class_names and int(u) < len(class_names) else str(u), "count": int(c)}
                for u, c in zip(unique, counts)
            ]

        elif task_type == "clustering":
            if X_test_scaled.shape[1] >= 2:
                from sklearn.decomposition import PCA
                pca = PCA(n_components=2)
                coords = pca.fit_transform(X_test_scaled)
                n = min(300, len(coords))
                viz["pca_2d"] = [
                    {"x": float(coords[i, 0]), "y": float(coords[i, 1]), "cluster": int(y_pred[i])}
                    for i in range(n)
                ]
            unique, counts = np.unique(y_pred, return_counts=True)
            viz["cluster_sizes"] = [
                {"label": f"Cluster {u}", "count": int(c)} for u, c in zip(unique, counts)
            ]
    except Exception as e:
        logger.error(f"[AutoML] Visualization error: {e}")

    return viz


def _extract_feature_importance(model: Any, feature_names: List[str]) -> List[Dict[str, Any]]:
    """Extract feature importance from model, return top 10."""
    importances = []
    try:
        if hasattr(model, "feature_importances_"):
            raw = model.feature_importances_
            total = sum(abs(v) for v in raw) or 1.0
            ranked = sorted(zip(feature_names, raw), key=lambda x: abs(x[1]), reverse=True)[:10]
            importances = [
                {"name": str(f), "value": round(float(v), 4), "percentage": round(abs(float(v)) / total * 100, 1)}
                for f, v in ranked
            ]
        elif hasattr(model, "coef_"):
            coefs = model.coef_
            if coefs.ndim > 1:
                coefs = np.mean(np.abs(coefs), axis=0)
            total = sum(abs(v) for v in coefs) or 1.0
            ranked = sorted(zip(feature_names, coefs), key=lambda x: abs(x[1]), reverse=True)[:10]
            importances = [
                {"name": str(f), "value": round(float(v), 4), "percentage": round(abs(float(v)) / total * 100, 1)}
                for f, v in ranked
            ]
    except Exception as e:
        logger.error(f"[AutoML] Feature importance error: {e}")
    return importances


def _build_comparison_table(
    model_results: List[Dict], primary_metric: str, best_model: Optional[Dict],
) -> List[Dict[str, Any]]:
    """Build model comparison table for the frontend."""
    comparison = []
    for m in model_results:
        entry = {
            "Model": m["name"],
            "Status": "\u2713 Best" if (best_model and m["name"] == best_model["name"] and not m.get("is_baseline"))
                      else ("\u2713" if m["status"] == "completed" else ("\u23f1 Timeout" if m["status"] == "timeout" else "\u2717 Failed")),
            "Primary Metric": primary_metric,
            "Score": m.get("score", "-"),
            "Time": f"{m.get('execution_time', 0)}s",
            "Is Baseline": m.get("is_baseline", False),
        }
        if m.get("metrics"):
            for k, v in m["metrics"].items():
                if k != primary_metric and k not in ("Clusters", "Samples"):
                    entry[k] = v
        if m["status"] in ("timeout", "failed"):
            entry["Score"] = "-"
            entry["error"] = m.get("error", "")
        comparison.append(entry)

    def sort_key(x):
        if x["Status"].startswith("\u2713"):
            return (0, -(x["Score"] if isinstance(x["Score"], (int, float)) else -999))
        elif x["Status"].startswith("\u23f1"):
            return (1, 0)
        return (2, 0)

    comparison.sort(key=sort_key)
    return comparison


def _build_predictions_table(
    task_type: str, y_test: Optional[np.ndarray], y_pred: Optional[np.ndarray],
    class_names: Optional[List[str]],
) -> List[Dict[str, Any]]:
    """Build sample predictions table."""
    if y_test is None or y_pred is None:
        return []
    predictions = []
    for i in range(min(50, len(y_test))):
        actual_val = class_names[int(y_test[i])] if class_names else round(float(y_test[i]), 4)
        pred_val = class_names[int(y_pred[i])] if class_names else round(float(y_pred[i]), 4)
        error_val = "" if class_names else round(abs(float(y_test[i]) - float(y_pred[i])), 4)
        predictions.append({"Index": i, "Actual": actual_val, "Predicted": pred_val, "Error": error_val})
    return predictions


def _generate_explanation(
    task_type: str, best_model_name: str, metrics: Dict[str, Any],
    feature_importance: List[Dict], target_column: Optional[str],
    data_rows: int, baseline_metrics: Optional[Dict],
) -> Dict[str, str]:
    """Generate human-readable explanation of results."""
    target_str = target_column or "the target variable"
    top_feature = feature_importance[0]["name"] if feature_importance else "the available features"

    if task_type == "regression":
        r2 = metrics.get("R\u00b2", 0)
        if r2 > 0.85:
            quality = "strong predictive fit"
            detail = f"The model explains approximately {int(r2 * 100)}% of the variation in {target_str}."
        elif r2 > 0.6:
            quality = "moderate predictive ability"
            detail = f"The model captures about {int(r2 * 100)}% of the variation in {target_str}, but there is substantial unexplained variance."
        elif r2 > 0.3:
            quality = "limited predictive power"
            detail = f"The model explains only {int(r2 * 100)}% of the variation. Feature relationships may be weak or non-linear."
        else:
            quality = "very weak predictive power"
            detail = f"The model explains only {int(r2 * 100)}% of the variation. The selected features may not have a meaningful relationship with {target_str}."

        baseline_note = ""
        if baseline_metrics:
            bl_r2 = baseline_metrics.get("R\u00b2", 0)
            improvement = r2 - bl_r2
            if improvement > 0.1:
                baseline_note = f" This represents a significant improvement over the baseline (R\u00b2 = {bl_r2:.2f})."
            elif improvement > 0:
                baseline_note = f" This is marginally better than the baseline (R\u00b2 = {bl_r2:.2f})."

        summary = f"The {best_model_name} model demonstrates {quality} for predicting {target_str}.{baseline_note}"
        feature_note = f"{top_feature} is the strongest contributing feature, appearing to have the most influence on predictions." if feature_importance else ""
        return {"summary": summary, "detail": detail, "feature_note": feature_note,
                "data_note": f"Analysis based on {data_rows:,} records using {len(feature_importance)} key features."}

    elif task_type == "classification":
        acc = metrics.get("Accuracy", 0)
        if acc > 0.90:
            quality = "high classification accuracy"
            detail = f"The model correctly classifies {int(acc * 100)}% of samples in the test set."
        elif acc > 0.70:
            quality = "moderate classification performance"
            detail = f"The model correctly classifies {int(acc * 100)}% of samples. Some categories may be harder to distinguish."
        else:
            quality = "limited classification accuracy"
            detail = f"The model correctly classifies only {int(acc * 100)}% of samples. Consider additional features or a different approach."

        summary = f"The {best_model_name} model shows {quality} for predicting {target_str}."
        feature_note = f"{top_feature} appears to be the most discriminating feature for classification." if feature_importance else ""
        return {"summary": summary, "detail": detail, "feature_note": feature_note,
                "data_note": f"Analysis based on {data_rows:,} records."}

    elif task_type == "clustering":
        sil = metrics.get("Silhouette", 0)
        clusters = metrics.get("Clusters", 0)
        quality = "well-separated clusters" if sil > 0.5 else ("moderate cluster separation" if sil > 0.25 else "weak cluster structure")
        return {
            "summary": f"K-Means identified {clusters} clusters with {quality} (silhouette score = {sil:.2f}).",
            "detail": f"A higher silhouette score indicates better-defined clusters. The current score suggests {'clearly distinct' if sil > 0.5 else 'overlapping'} groups in the data.",
            "feature_note": "", "data_note": f"Analysis based on {data_rows:,} records.",
        }

    return {"summary": "Analysis complete.", "detail": "", "feature_note": "", "data_note": ""}


def _generate_warnings(
    task_type: str, metrics: Dict[str, Any], y_train: Optional[np.ndarray],
    y_test: Optional[np.ndarray], class_names: Optional[List[str]],
    data_rows: int, missing_pct: float,
) -> List[Dict[str, str]]:
    """Generate model quality warnings."""
    warnings = []

    if task_type == "regression":
        r2 = metrics.get("R\u00b2", 0)
        if r2 < 0.3:
            warnings.append({"type": "low_performance", "severity": "high",
                "message": "The model has very low predictive performance (R\u00b2 < 0.30). Predictions should not be used for operational decisions.",
                "suggestion": "Consider collecting more data, engineering better features, or investigating if the target variable is predictable."})
        elif r2 < 0.5:
            warnings.append({"type": "moderate_performance", "severity": "medium",
                "message": f"Model R\u00b2 = {r2:.2f} indicates limited predictive power. Use predictions with caution."})

    elif task_type == "classification":
        acc = metrics.get("Accuracy", 0)
        if acc < 0.6:
            warnings.append({"type": "low_accuracy", "severity": "high",
                "message": f"Classification accuracy is only {acc*100:.1f}%. The model performs poorly.",
                "suggestion": "Check for class imbalance, insufficient features, or noise in the target variable."})

        if y_train is not None and class_names:
            _, counts = np.unique(y_train, return_counts=True)
            if len(counts) > 1:
                ratio = max(counts) / (min(counts) + 1e-8)
                if ratio > 5:
                    warnings.append({"type": "class_imbalance", "severity": "medium",
                        "message": f"Severe class imbalance detected (ratio {ratio:.1f}:1). Accuracy may be misleading.",
                        "suggestion": "Consider F1 score and the confusion matrix for a more reliable assessment."})

    elif task_type == "clustering":
        sil = metrics.get("Silhouette", 0)
        if sil < 0.2:
            warnings.append({"type": "weak_clusters", "severity": "medium",
                "message": "Cluster separation is very weak. The data may not have natural groupings with the selected features."})

    if data_rows < 100:
        warnings.append({"type": "small_dataset", "severity": "medium",
            "message": f"Dataset has only {data_rows} rows. Results may not be statistically reliable."})

    if missing_pct > 20:
        warnings.append({"type": "high_missing", "severity": "medium",
            "message": f"{missing_pct:.1f}% of data is missing. Imputation may introduce bias."})

    return warnings


def _generate_insights(
    task_type: str, metrics: Dict[str, Any], feature_importance: List[Dict],
    target_column: Optional[str], y_pred: Optional[np.ndarray], y_test: Optional[np.ndarray],
) -> List[str]:
    """Generate data-derived key insights."""
    insights = []

    if feature_importance:
        top = feature_importance[0]
        insights.append(f"{top['name']} is the strongest predictive feature ({top['percentage']:.1f}% relative importance).")
        if len(feature_importance) >= 2:
            second = feature_importance[1]
            insights.append(f"{second['name']} is the second most influential feature ({second['percentage']:.1f}%).")
        if len(feature_importance) >= 3:
            top3_pct = sum(f["percentage"] for f in feature_importance[:3])
            if top3_pct > 70:
                insights.append(f"The top 3 features represent approximately {top3_pct:.0f}% of the model's relative feature-importance score.")

    if task_type == "regression" and y_test is not None and y_pred is not None:
        residuals = y_test - y_pred
        high_error_mask = np.abs(residuals) > 2 * np.std(residuals)
        high_error_pct = np.mean(high_error_mask) * 100
        if high_error_pct > 10:
            insights.append(f"Model errors increase for {high_error_pct:.0f}% of extreme values, suggesting non-linear patterns.")

    if task_type == "classification" and y_test is not None and y_pred is not None:
        cm = confusion_matrix(y_test, y_pred)
        np.fill_diagonal(cm, 0)
        if cm.max() > 0:
            insights.append("The model most frequently confuses certain class pairs (review confusion matrix for details).")

    if not insights:
        insights.append("The model has been trained and evaluated on the provided dataset.")

    return insights


def _generate_recommendations(
    task_type: str, metrics: Dict[str, Any], feature_importance: List[Dict],
    target_column: Optional[str], warnings: List[Dict], data_rows: int,
) -> List[str]:
    """Generate actionable recommendations from model results."""
    recs = []
    target_str = target_column or "the target"

    if feature_importance:
        recs.append(f"Monitor '{feature_importance[0]['name']}' closely \u2014 it contributes most to predicting {target_str}.")
        if len(feature_importance) >= 2:
            recs.append(f"Investigate the relationship between '{feature_importance[1]['name']}' and {target_str} for operational insights.")

    if task_type == "regression":
        r2 = metrics.get("R\u00b2", 0)
        if r2 < 0.5:
            recs.append("Consider adding more relevant features or domain-specific engineered features to improve predictions.")
        if r2 > 0.8:
            recs.append("Review residual plots to identify operating ranges where predictions are less accurate.")

    if task_type == "classification":
        acc = metrics.get("Accuracy", 0)
        if acc < 0.7:
            recs.append("Collect more labeled examples, especially for underrepresented classes.")

    if any(w["type"] == "class_imbalance" for w in warnings):
        recs.append("Address class imbalance through oversampling, undersampling, or cost-sensitive learning.")

    if data_rows < 500:
        recs.append("Collect additional samples to improve model reliability and generalization.")

    if not recs:
        recs.append("Review the model performance metrics and visualizations for domain-specific insights.")

    return recs


def _build_reasoning(
    best_model_name: str, score: float, primary_metric: str,
    baseline_metrics: Optional[Dict], feature_importance: List[Dict],
) -> Dict[str, str]:
    """Build backwards-compatible reasoning object."""
    top_driver = feature_importance[0]["name"] if feature_importance else "the available features"
    bl_score = baseline_metrics.get(primary_metric, "N/A") if baseline_metrics else "N/A"
    return {
        "Finding": f"'{top_driver}' has the highest relative feature importance.",
        "Why": f"The model relies more heavily on '{top_driver}' than the other selected variables when generating predictions.",
        "Confidence": "High" if score > 0.75 else ("Medium" if score > 0.5 else "Low"),
        "Recommendation": f"Review operations related to '{top_driver}' and collect additional observations across different levels.",
    }


def _error_response(algorithm: str, error_type: str, message: str, suggestion: str = "") -> Dict[str, Any]:
    """Build a structured error response."""
    return {"success": False, "status": "failed", "algorithm": algorithm,
            "error_type": error_type, "message": message, "suggestion": suggestion}
