# backend/reasoning/report_generator.py
"""
Report Generator — Step 10.

Assembles the final ReasoningReport from all engine outputs.
This is a pure aggregation step — no inference or LLM calls.
"""

from __future__ import annotations

import logging
from datetime import datetime

from backend.reasoning.schemas import (
    ConfidenceLevel,
    ConfidenceResult,
    ConsensusResult,
    EvidencePackage,
    ModelFinding,
    Recommendation,
    ReasoningReport,
    RootCauseResult,
    RuleVerdict,
    Severity,
)

logger = logging.getLogger(__name__)


class ReportGenerator:
    """Assemble the final ReasoningReport from all engine outputs."""

    def generate(
        self,
        evidence: EvidencePackage,
        rule_verdicts: list[RuleVerdict],
        consensus: ConsensusResult,
        confidence: ConfidenceResult,
        root_causes: list[RootCauseResult],
        recommendations: list[Recommendation],
    ) -> ReasoningReport:
        """
        Build a complete ReasoningReport.

        The executive_summary is deterministic at this stage — it will
        be overridden by LLMReasoner.enhance() if LLM is available.
        """
        # Build finding summaries
        findings_summary = [f.finding for f in evidence.findings]

        # Determine overall risk level
        risk_level = self._determine_risk_level(evidence, rule_verdicts, confidence)

        # Build deterministic executive summary
        executive_summary = self._build_executive_summary(
            evidence, consensus, confidence, root_causes, risk_level
        )

        # Collect limitations
        limitations = self._collect_limitations(evidence, confidence, consensus)

        report = ReasoningReport(
            executive_summary=executive_summary,
            dataset_overview=evidence.dataset_summary,
            findings=evidence.findings,
            findings_summary=findings_summary,
            consensus=consensus,
            root_causes=root_causes,
            confidence=confidence,
            rule_verdicts=rule_verdicts,
            risk_level=risk_level,
            recommendations=recommendations,
            llm_narrative=None,
            limitations=limitations,
            generated_at=datetime.utcnow(),
            reasoning_version="1.0.0",
            llm_used=False,
        )

        logger.info(
            "ReportGenerator: assembled report — %d findings, %d rules, %d recommendations, risk=%s",
            len(evidence.findings),
            len([v for v in rule_verdicts if v.triggered]),
            len(recommendations),
            risk_level.value,
        )

        return report

    # ── Private ──────────────────────────────────────────────────────────

    @staticmethod
    def _determine_risk_level(
        evidence: EvidencePackage,
        rule_verdicts: list[RuleVerdict],
        confidence: ConfidenceResult,
    ) -> Severity:
        """
        Determine overall risk from findings, rules, and confidence.

        Logic:
        - If any CRITICAL rule triggered → CRITICAL
        - If any HIGH rule triggered and confidence is not Very High → HIGH
        - If confidence is Low → at least MEDIUM
        - Otherwise derived from finding severities
        """
        triggered_severities = [v.severity for v in rule_verdicts if v.triggered]

        if Severity.CRITICAL in triggered_severities:
            return Severity.CRITICAL

        if Severity.HIGH in triggered_severities:
            if confidence.confidence_level != ConfidenceLevel.VERY_HIGH:
                return Severity.HIGH

        # Check finding severities
        finding_severities = [f.severity for f in evidence.findings]
        if Severity.CRITICAL in finding_severities:
            return Severity.CRITICAL
        if Severity.HIGH in finding_severities:
            return Severity.HIGH

        # Low confidence = at least medium risk
        if confidence.confidence_level == ConfidenceLevel.LOW:
            return Severity.MEDIUM

        if Severity.MEDIUM in triggered_severities or Severity.MEDIUM in finding_severities:
            return Severity.MEDIUM

        return Severity.LOW

    @staticmethod
    def _build_executive_summary(
        evidence: EvidencePackage,
        consensus: ConsensusResult,
        confidence: ConfidenceResult,
        root_causes: list[RootCauseResult],
        risk_level: Severity,
    ) -> str:
        """Build a deterministic executive summary."""
        parts: list[str] = []

        n_models = len(evidence.findings)
        parts.append(f"Comprehensive analysis completed using {n_models} model(s).")

        # Confidence
        parts.append(
            f"Overall confidence is {confidence.confidence_level.value} "
            f"({confidence.overall_confidence:.0%})."
        )

        # Consensus
        if consensus.total_models >= 2:
            if consensus.agreement_score >= 0.8:
                parts.append("Models show strong agreement in their findings.")
            elif consensus.agreement_score >= 0.5:
                parts.append("Models show moderate agreement.")
            else:
                parts.append("Models show significant disagreement — findings should be interpreted with caution.")

        # Root cause
        if root_causes:
            parts.append(f"Primary root cause: {root_causes[0].cause}")

        # Risk
        parts.append(f"Overall risk assessment: {risk_level.value}.")

        return " ".join(parts)

    @staticmethod
    def _collect_limitations(
        evidence: EvidencePackage,
        confidence: ConfidenceResult,
        consensus: ConsensusResult,
    ) -> list[str]:
        """Identify analysis limitations to disclose."""
        limitations: list[str] = []

        if len(evidence.findings) == 1:
            limitations.append(
                "Only one model was used — multi-model consensus is not available."
            )

        if evidence.dataset_summary.missing_value_count > 0:
            limitations.append(
                f"Dataset contains {evidence.dataset_summary.missing_value_count} missing values "
                f"that were imputed, which may introduce bias."
            )

        if confidence.confidence_level in (ConfidenceLevel.LOW, ConfidenceLevel.MEDIUM):
            limitations.append(
                "Overall confidence is below the high-confidence threshold — "
                "recommendations should be validated with domain experts."
            )

        if consensus.conflicting_findings:
            limitations.append(
                f"{len(consensus.conflicting_findings)} conflicting finding(s) between models — "
                f"conclusions may be ambiguous."
            )

        # Check for models with explainability
        models_with_explain = sum(1 for f in evidence.findings if f.explainability)
        models_without = len(evidence.findings) - models_with_explain
        if models_without > 0:
            limitations.append(
                f"{models_without} model(s) lack explainability data (SHAP/feature importance)."
            )

        return limitations
