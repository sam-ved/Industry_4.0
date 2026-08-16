# backend/reasoning/recommendation_engine.py
"""
Recommendation Engine — Step 7.

Generates actionable recommendations based on root causes, rule verdicts,
and confidence levels.  Recommendations are prioritised by severity and
include domain-specific actions for industrial features.
"""

from __future__ import annotations

import logging

from backend.reasoning.schemas import (
    ConfidenceLevel,
    ConfidenceResult,
    Priority,
    Recommendation,
    RootCauseResult,
    RuleVerdict,
    Severity,
)

logger = logging.getLogger(__name__)

# ── Domain-specific recommendation templates ─────────────────────────────────

_FEATURE_RECOMMENDATIONS: dict[str, list[dict[str, str]]] = {
    "temperature": [
        {"action": "Inspect cooling system for blockages or degradation.", "category": "maintenance"},
        {"action": "Reduce operating load to allow thermal recovery.", "category": "process"},
        {"action": "Install additional temperature monitoring at critical points.", "category": "monitoring"},
    ],
    "pressure": [
        {"action": "Check seals, gaskets, and pressure relief valves.", "category": "maintenance"},
        {"action": "Review pressure setpoints against specification.", "category": "process"},
        {"action": "Schedule hydraulic/pneumatic system inspection.", "category": "maintenance"},
    ],
    "vibration": [
        {"action": "Inspect bearings and rotating assemblies for wear.", "category": "maintenance"},
        {"action": "Check alignment and balance of rotating components.", "category": "maintenance"},
        {"action": "Deploy vibration analysis for predictive maintenance.", "category": "monitoring"},
    ],
    "voltage": [
        {"action": "Inspect electrical supply and transformer health.", "category": "maintenance"},
        {"action": "Install power quality monitoring equipment.", "category": "monitoring"},
    ],
    "current": [
        {"action": "Check motor windings for insulation degradation.", "category": "maintenance"},
        {"action": "Verify drive settings and load conditions.", "category": "process"},
    ],
    "humidity": [
        {"action": "Review HVAC system performance.", "category": "maintenance"},
        {"action": "Consider dehumidification for sensitive areas.", "category": "process"},
    ],
    "rpm": [
        {"action": "Verify drive and gearbox operation.", "category": "maintenance"},
        {"action": "Check for mechanical obstructions.", "category": "maintenance"},
    ],
    "torque": [
        {"action": "Inspect tool/die condition for wear.", "category": "maintenance"},
        {"action": "Review material feed consistency.", "category": "process"},
    ],
    "wear": [
        {"action": "Schedule tool/component replacement.", "category": "maintenance"},
        {"action": "Adjust process parameters to reduce wear rate.", "category": "process"},
    ],
}

# Severity → Priority mapping
_SEVERITY_PRIORITY: dict[Severity, Priority] = {
    Severity.CRITICAL: Priority.IMMEDIATE,
    Severity.HIGH: Priority.HIGH,
    Severity.MEDIUM: Priority.MEDIUM,
    Severity.LOW: Priority.LOW,
    Severity.INFO: Priority.LOW,
}


class RecommendationEngine:
    """Generate prioritised, actionable recommendations."""

    def generate(
        self,
        root_causes: list[RootCauseResult],
        rule_verdicts: list[RuleVerdict],
        confidence: ConfidenceResult,
    ) -> list[Recommendation]:
        """
        Build recommendations from three sources:
        1. Root cause features → domain-specific actions
        2. Rule verdicts → corrective actions
        3. Confidence level → monitoring intensity
        """
        recommendations: list[Recommendation] = []
        seen_actions: set[str] = set()  # Deduplicate

        # ── From root causes ──────────────────────────────────────────────
        for rc in root_causes:
            for feat in rc.contributing_features:
                recs = _get_feature_recommendations(feat)
                for rec_template in recs:
                    action = rec_template["action"]
                    if action in seen_actions:
                        continue
                    seen_actions.add(action)

                    # Priority based on root cause confidence
                    priority = _confidence_to_priority(rc.confidence)

                    recommendations.append(
                        Recommendation(
                            action=action,
                            priority=priority,
                            rationale=f"Root cause: {rc.cause} (confidence: {rc.confidence:.0%})",
                            source_models=rc.supporting_models,
                            category=rec_template.get("category", "general"),
                        )
                    )

        # ── From rule verdicts ────────────────────────────────────────────
        for verdict in rule_verdicts:
            if not verdict.triggered:
                continue

            rule_rec = _rule_to_recommendation(verdict)
            if rule_rec and rule_rec.action not in seen_actions:
                seen_actions.add(rule_rec.action)
                recommendations.append(rule_rec)

        # ── From confidence level ─────────────────────────────────────────
        confidence_recs = _confidence_level_recommendations(confidence)
        for rec in confidence_recs:
            if rec.action not in seen_actions:
                seen_actions.add(rec.action)
                recommendations.append(rec)

        # ── Default recommendations if none generated ─────────────────────
        if not recommendations:
            recommendations.append(
                Recommendation(
                    action="Continue standard operating procedures with regular monitoring.",
                    priority=Priority.LOW,
                    rationale="No significant issues detected by any model.",
                    category="monitoring",
                )
            )
            recommendations.append(
                Recommendation(
                    action="Consider running additional model types for broader coverage.",
                    priority=Priority.LOW,
                    rationale="More models provide higher confidence in conclusions.",
                    category="general",
                )
            )

        # Sort by priority (Immediate first)
        priority_order = {Priority.IMMEDIATE: 0, Priority.HIGH: 1, Priority.MEDIUM: 2, Priority.LOW: 3}
        recommendations.sort(key=lambda r: priority_order.get(r.priority, 99))

        logger.info("RecommendationEngine: generated %d recommendation(s).", len(recommendations))
        return recommendations


# ── Private helpers ──────────────────────────────────────────────────────────


def _get_feature_recommendations(feature: str) -> list[dict[str, str]]:
    """Look up domain recommendations for a feature."""
    lower = feature.lower()
    for keyword, recs in _FEATURE_RECOMMENDATIONS.items():
        if keyword in lower:
            return recs
    return []


def _confidence_to_priority(confidence: float) -> Priority:
    """Map root cause confidence to recommendation priority."""
    if confidence >= 0.85:
        return Priority.HIGH
    if confidence >= 0.65:
        return Priority.MEDIUM
    return Priority.LOW


def _rule_to_recommendation(verdict: RuleVerdict) -> Recommendation | None:
    """Convert a triggered rule verdict into a recommendation."""
    action_map: dict[str, str] = {
        "anomaly_high_confidence": "Investigate detected anomalies immediately — high confidence alert.",
        "anomaly_high_rate": "Review operational conditions for root cause of elevated anomaly rate.",
        "classification_low_confidence": "Gather additional training data or engineer features to improve model accuracy.",
        "regression_weak_model": "Consider alternative regression approaches or non-linear models.",
        "clustering_poor_quality": "Re-evaluate cluster count (k) or try density-based clustering (DBSCAN).",
        "missing_data_risk": "Improve data collection to reduce missing values and imputation bias.",
    }

    action = action_map.get(verdict.rule_name)
    if not action:
        return None

    return Recommendation(
        action=action,
        priority=_SEVERITY_PRIORITY.get(verdict.severity, Priority.MEDIUM),
        rationale=verdict.result_description,
        category="model_quality",
    )


def _confidence_level_recommendations(confidence: ConfidenceResult) -> list[Recommendation]:
    """Generate monitoring recommendations based on overall confidence level."""
    recs: list[Recommendation] = []

    if confidence.confidence_level == ConfidenceLevel.LOW:
        recs.append(
            Recommendation(
                action="Increase monitoring frequency — overall model confidence is low.",
                priority=Priority.HIGH,
                rationale=f"Overall confidence: {confidence.overall_confidence:.0%} ({confidence.confidence_level.value})",
                category="monitoring",
            )
        )
        recs.append(
            Recommendation(
                action="Run additional analysis models to corroborate findings.",
                priority=Priority.MEDIUM,
                rationale="Low confidence suggests insufficient evidence for strong conclusions.",
                category="general",
            )
        )
    elif confidence.confidence_level == ConfidenceLevel.MEDIUM:
        recs.append(
            Recommendation(
                action="Maintain heightened monitoring — confidence is moderate.",
                priority=Priority.MEDIUM,
                rationale=f"Overall confidence: {confidence.overall_confidence:.0%} ({confidence.confidence_level.value})",
                category="monitoring",
            )
        )
    elif confidence.confidence_level in (ConfidenceLevel.HIGH, ConfidenceLevel.VERY_HIGH):
        recs.append(
            Recommendation(
                action="Proceed with standard monitoring intervals — findings are reliable.",
                priority=Priority.LOW,
                rationale=f"Overall confidence: {confidence.overall_confidence:.0%} ({confidence.confidence_level.value})",
                category="monitoring",
            )
        )

    return recs
