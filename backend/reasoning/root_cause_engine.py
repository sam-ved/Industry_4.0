# backend/reasoning/root_cause_engine.py
"""
Root Cause Engine — Step 6.

Infers probable root causes by cross-referencing evidence from multiple
models, looking for features that appear across anomaly detection,
feature importance, and correlation findings.
"""

from __future__ import annotations

import logging
from collections import defaultdict

from backend.reasoning.schemas import (
    ConsensusResult,
    EvidencePackage,
    RootCauseResult,
    Severity,
    TaskType,
)

logger = logging.getLogger(__name__)

# Known domain feature patterns → root cause templates
_DOMAIN_PATTERNS: dict[str, dict[str, str]] = {
    "temperature": {
        "cause": "Potential thermal overload / overheating",
        "category": "thermal",
    },
    "pressure": {
        "cause": "Abnormal pressure levels — possible seal or valve issue",
        "category": "mechanical",
    },
    "vibration": {
        "cause": "Excessive vibration — bearing wear or imbalance",
        "category": "mechanical",
    },
    "humidity": {
        "cause": "Environmental moisture exceeding safe thresholds",
        "category": "environmental",
    },
    "voltage": {
        "cause": "Electrical supply instability",
        "category": "electrical",
    },
    "current": {
        "cause": "Abnormal current draw — possible motor degradation",
        "category": "electrical",
    },
    "rpm": {
        "cause": "Speed deviation from nominal operating range",
        "category": "mechanical",
    },
    "torque": {
        "cause": "Torque anomaly — potential mechanical stress",
        "category": "mechanical",
    },
    "power": {
        "cause": "Power consumption anomaly",
        "category": "electrical",
    },
    "speed": {
        "cause": "Operating speed outside normal bounds",
        "category": "mechanical",
    },
    "wear": {
        "cause": "Tool or component wear detected",
        "category": "maintenance",
    },
    "flow": {
        "cause": "Flow rate deviation — blockage or leak possible",
        "category": "mechanical",
    },
}


class RootCauseEngine:
    """Infer probable root causes from multi-model evidence."""

    def analyze(
        self,
        evidence: EvidencePackage,
        consensus: ConsensusResult,
    ) -> list[RootCauseResult]:
        """
        Build root cause hypotheses by:
        1. Identifying features flagged across multiple model types
        2. Matching against domain knowledge patterns
        3. Ranking by evidence count and consensus
        """
        if not evidence.findings:
            return []

        # ── Gather feature evidence ──────────────────────────────────────
        # feature → {model_name, task_type, evidence snippets}
        feature_evidence: dict[str, _FeatureEvidence] = defaultdict(_FeatureEvidence)

        for finding in evidence.findings:
            for feat in finding.important_features:
                key = feat.lower().strip()
                fe = feature_evidence[key]
                fe.models.add(finding.model)
                fe.task_types.add(finding.task_type)
                fe.severities.append(finding.severity)
                fe.evidence_lines.append(
                    f"[{finding.model}] {finding.finding}"
                )

            # Also consider explainability features
            if finding.explainability:
                for fc in finding.explainability.top_features[:3]:
                    key = fc.name.lower().strip()
                    fe = feature_evidence[key]
                    fe.models.add(finding.model)
                    fe.task_types.add(finding.task_type)

        # ── Build root cause hypotheses ──────────────────────────────────
        root_causes: list[RootCauseResult] = []

        # Score each feature by evidence strength
        scored: list[tuple[str, _FeatureEvidence, float]] = []
        for feat, fe in feature_evidence.items():
            score = (
                len(fe.models) * 2.0          # Cross-model agreement is strongest signal
                + len(fe.task_types) * 1.5     # Cross-task-type diversity
                + _severity_bonus(fe.severities)
            )
            scored.append((feat, fe, score))

        scored.sort(key=lambda x: -x[2])

        # Take top 5 features as root cause candidates
        for feat, fe, score in scored[:5]:
            # Match against domain patterns
            pattern = _match_domain_pattern(feat)
            if pattern:
                cause_text = pattern["cause"]
            elif len(fe.models) >= 2:
                cause_text = (
                    f"Feature '{feat}' identified as critical by {len(fe.models)} "
                    f"independent models — likely a primary contributing factor."
                )
            else:
                cause_text = f"Feature '{feat}' flagged by {next(iter(fe.models))} as significant."

            # Confidence based on evidence count
            cause_confidence = min(0.95, 0.3 + 0.15 * len(fe.models) + 0.1 * len(fe.task_types))

            # Build alternative causes from other candidates
            alternatives = [
                f"Alternative: '{other_feat}' (supported by {len(other_fe.models)} model(s))"
                for other_feat, other_fe, _ in scored[:5]
                if other_feat != feat
            ][:3]

            root_causes.append(
                RootCauseResult(
                    cause=cause_text,
                    confidence=round(cause_confidence, 4),
                    evidence=fe.evidence_lines[:5],
                    contributing_features=[feat],
                    supporting_models=list(fe.models),
                    alternative_causes=alternatives,
                )
            )

        # ── Composite root cause ─────────────────────────────────────────
        # If multiple high-scoring features co-occur, create a composite cause
        if len(scored) >= 2:
            top_feats = [s[0] for s in scored[:3]]
            top_models = set()
            for _, fe, _ in scored[:3]:
                top_models.update(fe.models)

            composite = RootCauseResult(
                cause=(
                    f"Combined effect of {', '.join(top_feats)} — "
                    f"multiple correlated factors suggest a systemic issue."
                ),
                confidence=round(min(0.95, 0.5 + 0.1 * len(top_models)), 4),
                evidence=[
                    f"Cross-model agreement on features: {', '.join(top_feats)}",
                    f"Supported by {len(top_models)} model(s): {', '.join(top_models)}",
                ],
                contributing_features=top_feats,
                supporting_models=list(top_models),
                alternative_causes=["Individual feature effects may be independent rather than correlated."],
            )
            root_causes.insert(0, composite)

        logger.info("RootCauseEngine: identified %d root cause hypothesis(es).", len(root_causes))
        return root_causes


# ── Private helpers ──────────────────────────────────────────────────────────


class _FeatureEvidence:
    """Mutable accumulator for feature-level evidence."""
    __slots__ = ("models", "task_types", "severities", "evidence_lines")

    def __init__(self) -> None:
        self.models: set[str] = set()
        self.task_types: set[TaskType] = set()
        self.severities: list[Severity] = []
        self.evidence_lines: list[str] = []


def _severity_bonus(severities: list[Severity]) -> float:
    """Extra score for high-severity findings."""
    bonus = 0.0
    for s in severities:
        if s == Severity.CRITICAL:
            bonus += 2.0
        elif s == Severity.HIGH:
            bonus += 1.0
        elif s == Severity.MEDIUM:
            bonus += 0.5
    return bonus


def _match_domain_pattern(feature_name: str) -> dict[str, str] | None:
    """Check if a feature name matches known industrial domain patterns."""
    lower = feature_name.lower()
    for keyword, pattern in _DOMAIN_PATTERNS.items():
        if keyword in lower:
            return pattern
    return None
