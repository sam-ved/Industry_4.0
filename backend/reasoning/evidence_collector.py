# backend/reasoning/evidence_collector.py
"""
Evidence Collector — Step 2.

Collects outputs from ALL models and produces a single unified
EvidencePackage that becomes the sole input for every reasoning engine.
"""

from __future__ import annotations

import logging
from typing import Any, Optional

from backend.reasoning.schemas import (
    DatasetSummary,
    EvidencePackage,
    ExplainabilityResult,
    FeatureContribution,
    ModelFinding,
    Severity,
    TaskType,
)

logger = logging.getLogger(__name__)


class EvidenceCollector:
    """Aggregates model findings into a single EvidencePackage."""

    # ── Public API ────────────────────────────────────────────────────────

    @staticmethod
    def collect(findings: list[ModelFinding]) -> EvidencePackage:
        """
        Build an EvidencePackage from a list of standardised ModelFinding objects.

        Categorises each finding by task type and extracts dataset metadata
        from whichever finding carries it.
        """
        package = EvidencePackage(findings=findings)

        for f in findings:
            _bucket = {
                TaskType.CLASSIFICATION: package.classification_findings,
                TaskType.REGRESSION: package.regression_findings,
                TaskType.CLUSTERING: package.clustering_findings,
                TaskType.ANOMALY: package.anomaly_findings,
                TaskType.PCA: package.pca_findings,
                TaskType.CORRELATION: package.correlation_findings,
                TaskType.FEATURE_IMPORTANCE: package.feature_importance_findings,
                TaskType.STATISTICS: package.statistics_findings,
            }.get(f.task_type)

            if _bucket is not None:
                _bucket.append(f)
            else:
                logger.warning("Unknown task type '%s' for model '%s'", f.task_type, f.model)

            # Extract dataset summary from the first finding that has it
            if package.dataset_summary.rows is None and f.raw_results:
                ds = f.raw_results.get("dataset_stats")
                if ds:
                    package.dataset_summary = DatasetSummary(
                        rows=ds.get("rows"),
                        columns=ds.get("columns"),
                        numerical_columns=ds.get("numerical_columns", []),
                        categorical_columns=ds.get("categorical_columns", []),
                        missing_value_count=sum(ds.get("missing_values", {}).values()),
                    )

        logger.info(
            "EvidenceCollector: collected %d findings across %d categories",
            len(findings),
            sum(
                1
                for bucket in [
                    package.classification_findings,
                    package.regression_findings,
                    package.clustering_findings,
                    package.anomaly_findings,
                    package.pca_findings,
                    package.correlation_findings,
                    package.feature_importance_findings,
                    package.statistics_findings,
                ]
                if bucket
            ),
        )

        return package

    # ── Conversion helpers ────────────────────────────────────────────────

    @staticmethod
    def from_ml_studio_results(results: dict[str, Any]) -> ModelFinding:
        """
        Convert a raw ML Studio `run_analysis()` result dict into a
        standardised ModelFinding.  This is the bridge between the existing
        inference layer and the new reasoning pipeline.
        """
        algorithm: str = results.get("algorithm", "Unknown")
        task_type_str: str = results.get("task_type", "classification")
        metrics: dict[str, Any] = results.get("metrics", {})
        dataset_stats: dict[str, Any] = results.get("dataset_stats", {})
        feature_importance: Optional[list[dict]] = results.get("feature_importance")
        explainability_data: Optional[dict] = results.get("explainability")

        # Map task type
        task_type = _safe_task_type(task_type_str)

        # Build finding text
        finding = _build_finding_text(algorithm, task_type, metrics)

        # Determine confidence
        confidence = _extract_confidence(task_type, metrics)

        # Determine severity
        severity = _determine_severity(task_type, metrics, confidence)

        # Extract important features
        important_features = _extract_important_features(feature_importance)

        # Build supporting evidence
        evidence = _build_supporting_evidence(algorithm, task_type, metrics, dataset_stats)

        # Build explainability
        explainability = None
        if explainability_data:
            explainability = ExplainabilityResult(
                method=explainability_data.get("method", "feature_importance"),
                top_features=[
                    FeatureContribution(
                        name=f.get("name", f.get("feature", "?")),
                        value=f.get("value", f.get("contribution", 0.0)),
                        direction=f.get("direction"),
                    )
                    for f in explainability_data.get("top_features", [])
                ],
            )
        elif feature_importance:
            explainability = ExplainabilityResult(
                method="feature_importance",
                top_features=[
                    FeatureContribution(
                        name=f.get("name", "?"),
                        value=f.get("value", 0.0),
                    )
                    for f in feature_importance[:10]
                ],
            )

        return ModelFinding(
            model=algorithm,
            task_type=task_type,
            status="ok",
            finding=finding,
            confidence=confidence,
            severity=severity,
            important_features=important_features,
            metrics=metrics,
            supporting_evidence=evidence,
            explainability=explainability,
            raw_results=results,
        )


# ── Private helpers ──────────────────────────────────────────────────────────


def _safe_task_type(raw: str) -> TaskType:
    """Convert a string to TaskType with fallback."""
    try:
        return TaskType(raw.lower())
    except ValueError:
        return TaskType.CLASSIFICATION


def _build_finding_text(algorithm: str, task_type: TaskType, metrics: dict) -> str:
    """Generate a one-sentence summary of what the model found."""
    if task_type == TaskType.CLASSIFICATION:
        acc = metrics.get("accuracy", 0)
        return f"{algorithm} achieved {acc * 100:.1f}% accuracy on classification."

    if task_type == TaskType.REGRESSION:
        r2 = metrics.get("r2", 0)
        rmse = metrics.get("rmse", 0)
        return f"{algorithm} regression — R²={r2:.3f}, RMSE={rmse:.3f}."

    if task_type == TaskType.CLUSTERING:
        n = metrics.get("n_clusters", 0)
        sil = metrics.get("silhouette_score", "N/A")
        return f"{algorithm} identified {n} clusters (silhouette={sil})."

    if task_type == TaskType.ANOMALY:
        count = metrics.get("anomalies_detected", 0)
        pct = metrics.get("anomaly_percentage", 0)
        return f"{algorithm} detected {count} anomalies ({pct:.1f}% of data)."

    return f"{algorithm} analysis completed."


def _extract_confidence(task_type: TaskType, metrics: dict) -> float:
    """Derive a 0–1 confidence value from model metrics."""
    if task_type == TaskType.CLASSIFICATION:
        acc = metrics.get("accuracy", 0)
        f1 = metrics.get("f1_score", 0)
        return round(max(acc, f1), 4)

    if task_type == TaskType.REGRESSION:
        r2 = metrics.get("r2", 0)
        return round(max(0.0, min(1.0, r2)), 4)

    if task_type == TaskType.CLUSTERING:
        sil = metrics.get("silhouette_score", 0)
        if isinstance(sil, (int, float)):
            return round(max(0.0, min(1.0, (sil + 1) / 2)), 4)  # map [-1,1] → [0,1]
        return 0.5

    if task_type == TaskType.ANOMALY:
        # Higher anomaly percentage → lower confidence in "normal" ops
        pct = metrics.get("anomaly_percentage", 5)
        return round(max(0.3, min(0.99, 1.0 - pct / 100)), 4)

    return 0.5


def _determine_severity(task_type: TaskType, metrics: dict, confidence: float) -> Severity:
    """Map model results to a severity level."""
    if task_type == TaskType.ANOMALY:
        pct = metrics.get("anomaly_percentage", 0)
        if pct > 15:
            return Severity.CRITICAL
        if pct > 10:
            return Severity.HIGH
        if pct > 5:
            return Severity.MEDIUM
        return Severity.LOW

    if task_type == TaskType.CLASSIFICATION:
        if confidence < 0.6:
            return Severity.HIGH
        if confidence < 0.75:
            return Severity.MEDIUM
        return Severity.LOW

    if task_type == TaskType.REGRESSION:
        r2 = metrics.get("r2", 0)
        if r2 < 0.3:
            return Severity.HIGH
        if r2 < 0.6:
            return Severity.MEDIUM
        return Severity.LOW

    if task_type == TaskType.CLUSTERING:
        sil = metrics.get("silhouette_score", 0)
        if isinstance(sil, (int, float)) and sil < 0.3:
            return Severity.MEDIUM
        return Severity.LOW

    return Severity.INFO


def _extract_important_features(feature_importance: Optional[list[dict]]) -> list[str]:
    """Pull top feature names from importance rankings."""
    if not feature_importance:
        return []
    return [
        f.get("name", f.get("feature", "?"))
        for f in feature_importance[:5]
    ]


def _build_supporting_evidence(
    algorithm: str,
    task_type: TaskType,
    metrics: dict,
    dataset_stats: dict,
) -> list[str]:
    """Generate bullet-point evidence strings."""
    evidence: list[str] = []

    rows = dataset_stats.get("rows", 0)
    if rows:
        evidence.append(f"Analysis run on {rows:,} data points.")

    if task_type == TaskType.CLASSIFICATION:
        for key in ("accuracy", "precision", "recall", "f1_score"):
            val = metrics.get(key)
            if val is not None:
                evidence.append(f"{key.replace('_', ' ').title()}: {val * 100:.1f}%")

    elif task_type == TaskType.REGRESSION:
        for key in ("r2", "rmse", "mae", "mse"):
            val = metrics.get(key)
            if val is not None:
                label = key.upper() if len(key) <= 4 else key.replace("_", " ").title()
                evidence.append(f"{label}: {val:.4f}")

    elif task_type == TaskType.ANOMALY:
        evidence.append(f"Anomalies detected: {metrics.get('anomalies_detected', 0)}")
        evidence.append(f"Normal samples: {metrics.get('normal_samples', 0)}")
        evidence.append(f"Anomaly rate: {metrics.get('anomaly_percentage', 0):.1f}%")

    elif task_type == TaskType.CLUSTERING:
        evidence.append(f"Clusters found: {metrics.get('n_clusters', 0)}")
        sil = metrics.get("silhouette_score")
        if sil and sil != "N/A":
            evidence.append(f"Silhouette score: {sil}")

    return evidence
