# backend/reasoning/confidence_engine.py
"""
Confidence Engine — Step 5.

Computes overall confidence by fusing per-model confidence scores
with weighted averaging, then applying rule-based adjustments and
consensus-based corrections.
"""

from __future__ import annotations

import logging

from backend.reasoning.schemas import (
    ConfidenceLevel,
    ConfidenceResult,
    ConsensusResult,
    EvidencePackage,
    RuleVerdict,
    TaskType,
)

logger = logging.getLogger(__name__)

# Category weights for the weighted average
_CATEGORY_WEIGHTS: dict[TaskType, float] = {
    TaskType.CLASSIFICATION: 0.25,
    TaskType.ANOMALY: 0.20,
    TaskType.PCA: 0.15,
    TaskType.FEATURE_IMPORTANCE: 0.15,
    TaskType.REGRESSION: 0.15,
    TaskType.CORRELATION: 0.10,
}

# Confidence level thresholds
_LEVEL_THRESHOLDS: list[tuple[float, ConfidenceLevel]] = [
    (0.90, ConfidenceLevel.VERY_HIGH),
    (0.75, ConfidenceLevel.HIGH),
    (0.55, ConfidenceLevel.MEDIUM),
    (0.00, ConfidenceLevel.LOW),
]


class ConfidenceEngine:
    """Compute overall fused confidence from all model findings."""

    def compute(
        self,
        evidence: EvidencePackage,
        rule_verdicts: list[RuleVerdict],
        consensus: ConsensusResult,
    ) -> ConfidenceResult:
        """
        1. Weighted average of per-category confidence.
        2. Apply rule-based adjustments.
        3. Adjust by consensus agreement.
        4. Map to confidence level.
        """
        component_scores: dict[str, float] = {}
        weighted_sum = 0.0
        weight_total = 0.0

        # ── Per-category weighted average ─────────────────────────────────
        category_buckets: dict[TaskType, list[float]] = {
            TaskType.CLASSIFICATION: [f.confidence for f in evidence.classification_findings],
            TaskType.REGRESSION: [f.confidence for f in evidence.regression_findings],
            TaskType.CLUSTERING: [f.confidence for f in evidence.clustering_findings],
            TaskType.ANOMALY: [f.confidence for f in evidence.anomaly_findings],
            TaskType.PCA: [f.confidence for f in evidence.pca_findings],
            TaskType.CORRELATION: [f.confidence for f in evidence.correlation_findings],
            TaskType.FEATURE_IMPORTANCE: [f.confidence for f in evidence.feature_importance_findings],
        }

        for task_type, confidences in category_buckets.items():
            if not confidences:
                continue
            avg = sum(confidences) / len(confidences)
            weight = _CATEGORY_WEIGHTS.get(task_type, 0.10)
            component_scores[task_type.value] = round(avg, 4)
            weighted_sum += avg * weight
            weight_total += weight

        if weight_total > 0:
            base_confidence = weighted_sum / weight_total
        else:
            # Fallback: simple average of all findings
            all_confs = [f.confidence for f in evidence.findings]
            base_confidence = sum(all_confs) / len(all_confs) if all_confs else 0.5

        # ── Rule adjustments ──────────────────────────────────────────────
        adjustments: list[str] = []
        total_adjustment = 0.0
        for verdict in rule_verdicts:
            if verdict.triggered and verdict.confidence_adjustment != 0.0:
                total_adjustment += verdict.confidence_adjustment
                adjustments.append(
                    f"{verdict.rule_name}: {verdict.confidence_adjustment:+.2f}"
                )

        adjusted_confidence = base_confidence + total_adjustment

        # ── Consensus adjustment ──────────────────────────────────────────
        # Strong consensus boosts confidence; weak consensus dampens it
        consensus_factor = (consensus.agreement_score - 0.5) * 0.1  # [-0.05, +0.05]
        adjusted_confidence += consensus_factor
        if abs(consensus_factor) > 0.01:
            adjustments.append(f"consensus: {consensus_factor:+.3f}")

        # Clamp to [0, 1]
        final_confidence = max(0.0, min(1.0, adjusted_confidence))

        # ── Map to level ──────────────────────────────────────────────────
        confidence_level = ConfidenceLevel.LOW
        for threshold, level in _LEVEL_THRESHOLDS:
            if final_confidence >= threshold:
                confidence_level = level
                break

        logger.info(
            "ConfidenceEngine: base=%.3f, adjustments=%s, final=%.3f (%s)",
            base_confidence,
            adjustments,
            final_confidence,
            confidence_level.value,
        )

        return ConfidenceResult(
            overall_confidence=round(final_confidence, 4),
            confidence_level=confidence_level,
            component_scores=component_scores,
            adjustments_applied=adjustments,
        )
