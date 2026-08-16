# backend/reasoning/consensus_engine.py
"""
Multi-Model Consensus Engine — Step 4.

Compares findings from every model to identify:
- Features that multiple models agree are important
- Conflicting severity/confidence assessments
- Overall agreement score
"""

from __future__ import annotations

import logging
from collections import Counter

from backend.reasoning.schemas import (
    ConflictingFinding,
    ConsensusResult,
    EvidencePackage,
    FeatureAgreement,
    Severity,
)

logger = logging.getLogger(__name__)

# Severity ordering for conflict detection
_SEVERITY_RANK: dict[Severity, int] = {
    Severity.CRITICAL: 4,
    Severity.HIGH: 3,
    Severity.MEDIUM: 2,
    Severity.LOW: 1,
    Severity.INFO: 0,
}


class ConsensusEngine:
    """Analyse cross-model agreement and disagreement."""

    def analyze(self, evidence: EvidencePackage) -> ConsensusResult:
        """
        Produce a ConsensusResult from the collected evidence.

        Agreement is measured across two dimensions:
        1. Feature overlap — do models agree on which features matter?
        2. Severity alignment — do models agree on how serious the situation is?
        """
        findings = evidence.findings
        if not findings:
            return ConsensusResult(
                agreement_score=0.0,
                total_models=0,
                summary="No model findings to analyse.",
            )

        total_models = len(findings)

        # ── Feature agreement ─────────────────────────────────────────────
        feature_to_models: dict[str, list[str]] = {}
        for f in findings:
            for feat in f.important_features:
                feature_to_models.setdefault(feat.lower(), []).append(f.model)

        agreed_features: list[FeatureAgreement] = []
        for feat, models in sorted(feature_to_models.items(), key=lambda x: -len(x[1])):
            if len(models) >= 2:
                agreed_features.append(
                    FeatureAgreement(
                        feature=feat,
                        supporting_models=list(set(models)),
                        agreement_count=len(set(models)),
                    )
                )

        # ── Severity conflicts ────────────────────────────────────────────
        severities = [f.severity for f in findings]
        severity_counter = Counter(severities)
        conflicts: list[ConflictingFinding] = []

        # If models span > 2 severity levels, that's a conflict
        unique_severities = list(severity_counter.keys())
        if len(unique_severities) >= 2:
            ranks = [_SEVERITY_RANK[s] for s in unique_severities]
            if max(ranks) - min(ranks) >= 2:
                high_models = [f.model for f in findings if _SEVERITY_RANK[f.severity] >= 3]
                low_models = [f.model for f in findings if _SEVERITY_RANK[f.severity] <= 1]
                if high_models and low_models:
                    conflicts.append(
                        ConflictingFinding(
                            description=(
                                f"Severity disagreement: {', '.join(high_models)} report HIGH/CRITICAL "
                                f"while {', '.join(low_models)} report LOW/INFO."
                            ),
                            models_involved=high_models + low_models,
                        )
                    )

        # ── Confidence conflicts ──────────────────────────────────────────
        confidences = [f.confidence for f in findings]
        if len(confidences) >= 2:
            conf_range = max(confidences) - min(confidences)
            if conf_range > 0.4:
                high_conf_models = [f.model for f in findings if f.confidence > 0.8]
                low_conf_models = [f.model for f in findings if f.confidence < 0.5]
                if high_conf_models and low_conf_models:
                    conflicts.append(
                        ConflictingFinding(
                            description=(
                                f"Confidence spread is {conf_range:.0%}: "
                                f"{', '.join(high_conf_models)} are highly confident "
                                f"while {', '.join(low_conf_models)} show low confidence."
                            ),
                            models_involved=high_conf_models + low_conf_models,
                        )
                    )

        # ── Agreement score ───────────────────────────────────────────────
        agreement_score = self._compute_agreement_score(
            total_models=total_models,
            agreed_features=agreed_features,
            feature_to_models=feature_to_models,
            severity_counter=severity_counter,
            conflicts=conflicts,
        )

        # ── Summary ──────────────────────────────────────────────────────
        summary = self._build_summary(total_models, agreed_features, conflicts, agreement_score)

        return ConsensusResult(
            agreement_score=round(agreement_score, 4),
            agreed_features=agreed_features,
            conflicting_findings=conflicts,
            total_models=total_models,
            summary=summary,
        )

    # ── Private ──────────────────────────────────────────────────────────

    @staticmethod
    def _compute_agreement_score(
        total_models: int,
        agreed_features: list[FeatureAgreement],
        feature_to_models: dict[str, list[str]],
        severity_counter: Counter,
        conflicts: list[ConflictingFinding],
    ) -> float:
        """
        Heuristic agreement score in [0, 1].

        Components:
        - Feature overlap ratio (0.5 weight)
        - Severity consensus (0.3 weight)
        - Conflict penalty (0.2 weight)
        """
        if total_models <= 1:
            return 1.0  # Single model trivially agrees with itself

        # Feature overlap: fraction of total features that 2+ models agree on
        total_features = len(feature_to_models) or 1
        agreed_count = len(agreed_features)
        feature_ratio = min(1.0, agreed_count / total_features)

        # Severity consensus: fraction of models on the dominant severity
        dominant_count = severity_counter.most_common(1)[0][1] if severity_counter else 0
        severity_ratio = dominant_count / total_models

        # Conflict penalty
        conflict_penalty = min(1.0, len(conflicts) * 0.25)

        score = (
            0.5 * feature_ratio
            + 0.3 * severity_ratio
            + 0.2 * (1.0 - conflict_penalty)
        )
        return max(0.0, min(1.0, score))

    @staticmethod
    def _build_summary(
        total_models: int,
        agreed_features: list[FeatureAgreement],
        conflicts: list[ConflictingFinding],
        agreement_score: float,
    ) -> str:
        """Generate a human-readable consensus summary."""
        parts: list[str] = []
        parts.append(f"Analysed {total_models} model(s).")

        if agreed_features:
            top = agreed_features[0]
            parts.append(
                f"Top consensus feature: '{top.feature}' — agreed by "
                f"{top.agreement_count} model(s) ({', '.join(top.supporting_models)})."
            )

        if conflicts:
            parts.append(f"{len(conflicts)} conflict(s) detected between models.")
        else:
            parts.append("No major conflicts detected.")

        if agreement_score >= 0.8:
            parts.append("Overall agreement is strong.")
        elif agreement_score >= 0.5:
            parts.append("Overall agreement is moderate.")
        else:
            parts.append("Overall agreement is weak — findings should be interpreted cautiously.")

        return " ".join(parts)
