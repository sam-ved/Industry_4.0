# backend/reasoning/rule_engine.py
"""
Rule Engine — Step 3.

Deterministic reasoning that runs BEFORE the LLM.
Each rule is a simple condition → action pair. Rules are modular:
extend by appending to RULES list, no other code changes needed.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Callable

from backend.reasoning.schemas import (
    EvidencePackage,
    RuleVerdict,
    Severity,
    TaskType,
)

logger = logging.getLogger(__name__)


# ── Rule definition ──────────────────────────────────────────────────────────


@dataclass
class Rule:
    """A single deterministic rule."""
    name: str
    description: str
    evaluate: Callable[[EvidencePackage], RuleVerdict | None]


# ── Built-in rules ──────────────────────────────────────────────────────────


def _rule_anomaly_high_confidence(evidence: EvidencePackage) -> RuleVerdict | None:
    """IF anomaly confidence > 0.9 THEN severity = HIGH."""
    for f in evidence.anomaly_findings:
        if f.confidence > 0.9:
            return RuleVerdict(
                rule_name="anomaly_high_confidence",
                triggered=True,
                condition_description="Anomaly model confidence exceeds 90%",
                result_description=f"Model '{f.model}' reports {f.confidence * 100:.0f}% confidence — severity elevated to HIGH.",
                severity=Severity.HIGH,
                confidence_adjustment=0.05,
            )
    return None


def _rule_anomaly_high_rate(evidence: EvidencePackage) -> RuleVerdict | None:
    """IF anomaly percentage > 10% THEN operational alert."""
    for f in evidence.anomaly_findings:
        pct = f.metrics.get("anomaly_percentage", 0)
        if pct > 10:
            return RuleVerdict(
                rule_name="anomaly_high_rate",
                triggered=True,
                condition_description="Anomaly rate exceeds 10% of data",
                result_description=f"{pct:.1f}% of records flagged as anomalous — possible sensor drift or operational issue.",
                severity=Severity.HIGH,
                confidence_adjustment=-0.05,
            )
    return None


def _rule_classification_low_confidence(evidence: EvidencePackage) -> RuleVerdict | None:
    """IF classification confidence < 60% THEN mark LOW CONFIDENCE."""
    for f in evidence.classification_findings:
        acc = f.metrics.get("accuracy", f.confidence)
        if acc < 0.60:
            return RuleVerdict(
                rule_name="classification_low_confidence",
                triggered=True,
                condition_description="Classification accuracy below 60%",
                result_description=f"Model '{f.model}' accuracy is {acc * 100:.1f}% — predictions may be unreliable.",
                severity=Severity.HIGH,
                confidence_adjustment=-0.15,
            )
    return None


def _rule_classification_high_accuracy(evidence: EvidencePackage) -> RuleVerdict | None:
    """IF classification accuracy > 90% THEN strong predictive model."""
    for f in evidence.classification_findings:
        acc = f.metrics.get("accuracy", 0)
        if acc > 0.90:
            return RuleVerdict(
                rule_name="classification_high_accuracy",
                triggered=True,
                condition_description="Classification accuracy exceeds 90%",
                result_description=f"Model '{f.model}' demonstrates strong accuracy ({acc * 100:.1f}%).",
                severity=Severity.LOW,
                confidence_adjustment=0.10,
            )
    return None


def _rule_regression_weak_model(evidence: EvidencePackage) -> RuleVerdict | None:
    """IF R² < 0.5 THEN weak regression model."""
    for f in evidence.regression_findings:
        r2 = f.metrics.get("r2", 1.0)
        if r2 < 0.5:
            return RuleVerdict(
                rule_name="regression_weak_model",
                triggered=True,
                condition_description="Regression R² below 0.5",
                result_description=f"Model '{f.model}' R²={r2:.3f} — model explains less than half the variance.",
                severity=Severity.MEDIUM,
                confidence_adjustment=-0.10,
            )
    return None


def _rule_clustering_poor_quality(evidence: EvidencePackage) -> RuleVerdict | None:
    """IF silhouette score < 0.3 THEN clustering quality poor."""
    for f in evidence.clustering_findings:
        sil = f.metrics.get("silhouette_score", 1.0)
        if isinstance(sil, (int, float)) and sil < 0.3:
            return RuleVerdict(
                rule_name="clustering_poor_quality",
                triggered=True,
                condition_description="Silhouette score below 0.3",
                result_description=f"Clustering quality is poor (silhouette={sil:.3f}) — clusters are weakly separated.",
                severity=Severity.MEDIUM,
                confidence_adjustment=-0.08,
            )
    return None


def _rule_feature_cross_model_agreement(evidence: EvidencePackage) -> RuleVerdict | None:
    """IF multiple models identify the same feature THEN increase confidence."""
    feature_counts: dict[str, list[str]] = {}
    for f in evidence.findings:
        for feat in f.important_features:
            feature_counts.setdefault(feat, []).append(f.model)

    agreed = {feat: models for feat, models in feature_counts.items() if len(models) >= 2}

    if agreed:
        top_feature = max(agreed, key=lambda k: len(agreed[k]))
        models_str = ", ".join(agreed[top_feature])
        return RuleVerdict(
            rule_name="feature_cross_model_agreement",
            triggered=True,
            condition_description="Same feature flagged by 2+ models",
            result_description=f"Feature '{top_feature}' independently identified by {len(agreed[top_feature])} models ({models_str}).",
            severity=Severity.INFO,
            confidence_adjustment=0.10,
        )
    return None


def _rule_missing_data_risk(evidence: EvidencePackage) -> RuleVerdict | None:
    """IF dataset has significant missing values THEN flag data quality risk."""
    missing = evidence.dataset_summary.missing_value_count
    rows = evidence.dataset_summary.rows or 1
    if missing > 0:
        pct = (missing / max(rows, 1)) * 100
        if pct > 5:
            return RuleVerdict(
                rule_name="missing_data_risk",
                triggered=True,
                condition_description="More than 5% of data cells are missing",
                result_description=f"{missing:,} missing values detected ({pct:.1f}% of cells) — results may be biased by imputation.",
                severity=Severity.MEDIUM,
                confidence_adjustment=-0.05,
            )
    return None


# ── Rule registry ────────────────────────────────────────────────────────────

RULES: list[Rule] = [
    Rule("anomaly_high_confidence", "High-confidence anomaly detection", _rule_anomaly_high_confidence),
    Rule("anomaly_high_rate", "Excessive anomaly rate", _rule_anomaly_high_rate),
    Rule("classification_low_confidence", "Weak classification model", _rule_classification_low_confidence),
    Rule("classification_high_accuracy", "Strong classification model", _rule_classification_high_accuracy),
    Rule("regression_weak_model", "Weak regression model", _rule_regression_weak_model),
    Rule("clustering_poor_quality", "Poor clustering separation", _rule_clustering_poor_quality),
    Rule("feature_cross_model_agreement", "Cross-model feature agreement", _rule_feature_cross_model_agreement),
    Rule("missing_data_risk", "Missing data quality risk", _rule_missing_data_risk),
]


# ── Engine ───────────────────────────────────────────────────────────────────


class RuleEngine:
    """Evaluate all rules against an EvidencePackage."""

    def __init__(self, rules: list[Rule] | None = None) -> None:
        self._rules = rules if rules is not None else RULES

    def evaluate(self, evidence: EvidencePackage) -> list[RuleVerdict]:
        """Run every registered rule. Returns only triggered verdicts."""
        verdicts: list[RuleVerdict] = []

        for rule in self._rules:
            try:
                verdict = rule.evaluate(evidence)
                if verdict and verdict.triggered:
                    verdicts.append(verdict)
                    logger.info("Rule '%s' triggered: %s", rule.name, verdict.result_description)
            except Exception as e:
                logger.error("Rule '%s' failed: %s", rule.name, e, exc_info=True)

        logger.info("RuleEngine: %d / %d rules triggered.", len(verdicts), len(self._rules))
        return verdicts
