# backend/reasoning/orchestrator.py
"""
Reasoning Orchestrator.

Single entry point that coordinates the entire reasoning pipeline:
Evidence → Rules → Consensus → Confidence → Root Cause → Recommendations → Report → LLM.
"""

from __future__ import annotations

import logging
from typing import Any

from backend.reasoning.confidence_engine import ConfidenceEngine
from backend.reasoning.consensus_engine import ConsensusEngine
from backend.reasoning.evidence_collector import EvidenceCollector
from backend.reasoning.llm_reasoner import LLMReasoner
from backend.reasoning.recommendation_engine import RecommendationEngine
from backend.reasoning.report_generator import ReportGenerator
from backend.reasoning.root_cause_engine import RootCauseEngine
from backend.reasoning.rule_engine import RuleEngine
from backend.reasoning.schemas import ModelFinding, ReasoningReport

logger = logging.getLogger(__name__)

# Singleton LLM reasoner (expensive to initialise, reuse across requests)
_llm_reasoner: LLMReasoner | None = None


def _get_llm_reasoner() -> LLMReasoner:
    """Lazy singleton for the LLM reasoner."""
    global _llm_reasoner
    if _llm_reasoner is None:
        _llm_reasoner = LLMReasoner()
    return _llm_reasoner


async def run_reasoning(
    findings: list[ModelFinding],
    use_llm: bool = True,
) -> ReasoningReport:
    """
    Execute the full reasoning pipeline.

    Args:
        findings: Standardised model outputs from one or more models.
        use_llm: Whether to enhance the report with LLM reasoning.
                 If False (or LLM unavailable), returns the deterministic report.

    Returns:
        Complete ReasoningReport with all analysis sections populated.
    """
    logger.info("Orchestrator: starting reasoning pipeline with %d finding(s).", len(findings))

    # Step 2 — Collect evidence
    evidence = EvidenceCollector.collect(findings)

    # Step 3 — Evaluate rules
    rule_verdicts = RuleEngine().evaluate(evidence)

    # Step 4 — Consensus analysis
    consensus = ConsensusEngine().analyze(evidence)

    # Step 5 — Confidence fusion
    confidence = ConfidenceEngine().compute(evidence, rule_verdicts, consensus)

    # Step 6 — Root cause inference
    root_causes = RootCauseEngine().analyze(evidence, consensus)

    # Step 7 — Recommendations
    recommendations = RecommendationEngine().generate(root_causes, rule_verdicts, confidence)

    # Step 10 — Assemble report
    report = ReportGenerator().generate(
        evidence=evidence,
        rule_verdicts=rule_verdicts,
        consensus=consensus,
        confidence=confidence,
        root_causes=root_causes,
        recommendations=recommendations,
    )

    # Step 8 — LLM enhancement (optional)
    if use_llm:
        llm = _get_llm_reasoner()
        if llm.is_available:
            report = await llm.enhance(report)
        else:
            logger.info("Orchestrator: LLM unavailable — returning deterministic report.")

    logger.info(
        "Orchestrator: pipeline complete — risk=%s, confidence=%s, %d recommendation(s).",
        report.risk_level.value,
        report.confidence.confidence_level.value if report.confidence else "N/A",
        len(report.recommendations),
    )

    return report


async def run_reasoning_from_results(
    results_list: list[dict[str, Any]],
    use_llm: bool = True,
) -> ReasoningReport:
    """
    Convenience function: convert raw ML Studio results dicts into
    ModelFindings, then run the full reasoning pipeline.

    This is the primary entry point for the /api/reasoning/from-results endpoint.
    """
    findings: list[ModelFinding] = []
    for raw in results_list:
        try:
            finding = EvidenceCollector.from_ml_studio_results(raw)
            findings.append(finding)
        except Exception as e:
            logger.error("Orchestrator: failed to convert result: %s", e, exc_info=True)

    if not findings:
        # Return empty report rather than failing
        return ReasoningReport(
            executive_summary="No valid model findings could be processed.",
            limitations=["All submitted results failed validation."],
        )

    return await run_reasoning(findings, use_llm=use_llm)
