# backend/reasoning/llm_reasoner.py
"""
LLM Reasoner — Step 8.

Enhances a structured ReasoningReport with LLM-generated narrative.

CRITICAL CONSTRAINTS:
- Never sends raw dataset, CSV, or DataFrames.
- Only sends the structured ReasoningReport evidence.
- Gracefully degrades if LLM is unavailable.
- Uses existing Gemini client configuration.
"""

from __future__ import annotations

import hashlib
import json
import logging
import os
from typing import Any

from backend.reasoning.schemas import ReasoningReport

logger = logging.getLogger(__name__)

# LLM prompt template
_SYSTEM_PROMPT = """\
You are an Industrial AI Expert and Reliability Engineer.

Your task is to analyze the structured evidence provided and generate a comprehensive executive report.

STRICT RULES:
1. Reason ONLY using the supplied evidence. Never invent facts.
2. If evidence is insufficient, explicitly state so.
3. Be concise, technical, and actionable.
4. Focus on industrial operations context.

Return ONLY a valid JSON object with these exact keys:
- executive_summary (string: 2-3 sentence overview)
- key_findings (list of strings: top 3-5 most important findings)
- root_cause_narrative (string: narrative explanation of root causes)
- business_impact (string: impact on operations, production, safety)
- confidence_assessment (string: how confident we are and why)
- recommendations (list of strings: prioritized action items)
- future_monitoring (list of strings: what to monitor going forward)
- limitations (list of strings: caveats and limitations of this analysis)
"""


class LLMReasoner:
    """Optional LLM enhancement layer for reasoning reports."""

    def __init__(self) -> None:
        self._client = None
        self._model = "llama-3.1-8b-instant"
        self._available = False
        self._init_client()

    def _init_client(self) -> None:
        """Initialise the Groq client if API key is available."""
        try:
            api_key = os.getenv("GROQ_API_KEY")
            if not api_key:
                logger.warning("LLMReasoner: GROQ_API_KEY not set — LLM reasoning disabled.")
                return

            from groq import AsyncGroq
            self._client = AsyncGroq(api_key=api_key)
            self._available = True
            logger.info("LLMReasoner: Groq client initialised successfully.")
        except Exception as e:
            logger.error("LLMReasoner: Failed to initialise Groq client: %s", e)
            self._available = False

    @property
    def is_available(self) -> bool:
        """Check if LLM reasoning is available."""
        return self._available and self._client is not None

    async def enhance(self, report: ReasoningReport) -> ReasoningReport:
        """
        Enhance a ReasoningReport with LLM-generated narrative.

        If LLM is unavailable, returns the report unchanged with
        a fallback executive summary built from deterministic data.
        """
        if not self.is_available:
            logger.info("LLMReasoner: LLM unavailable — using deterministic summary.")
            report.llm_used = False
            if not report.executive_summary:
                report.executive_summary = self._build_fallback_summary(report)
            return report

        try:
            evidence_payload = self._build_evidence_payload(report)
            llm_result = await self._call_llm(evidence_payload)

            if llm_result:
                report.llm_narrative = llm_result
                report.llm_used = True

                # Use LLM executive summary if available
                llm_summary = llm_result.get("executive_summary", "")
                if llm_summary:
                    report.executive_summary = llm_summary

            return report

        except Exception as e:
            logger.error("LLMReasoner: Enhancement failed: %s", e, exc_info=True)
            report.llm_used = False
            if not report.executive_summary:
                report.executive_summary = self._build_fallback_summary(report)
            return report

    async def _call_llm(self, evidence_payload: str) -> dict[str, Any] | None:
        """Call Groq with structured evidence. Returns parsed JSON or None."""
        if not self._client:
            return None

        try:
            # Check cache first
            from backend.database import get_cache, set_cache
            cache_key = hashlib.md5(evidence_payload.encode()).hexdigest()
            cached = get_cache("reasoning_llm", cache_key)
            if cached:
                try:
                    return json.loads(cached)
                except Exception:
                    pass

            user_prompt = f"Analyze the following industrial AI evidence:\n\n{evidence_payload}"

            response = await self._client.chat.completions.create(
                messages=[
                    {"role": "system", "content": _SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt}
                ],
                model=self._model,
                response_format={"type": "json_object"},
            )

            raw = (response.choices[0].message.content or "").strip()

            # Strip markdown fences if present
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
                raw = raw.strip()

            result = json.loads(raw)

            # Cache the result for 24 hours
            set_cache("reasoning_llm", "reasoning", cache_key, json.dumps(result), expires_minutes=60 * 24)

            return result

        except Exception as e:
            logger.error("LLMReasoner: Groq call failed: %s", e, exc_info=True)
            return None

    @staticmethod
    def _build_evidence_payload(report: ReasoningReport) -> str:
        """
        Build a structured text payload from the report.
        NEVER includes raw data — only structured evidence.
        """
        sections: list[str] = []

        # Dataset overview
        if report.dataset_overview:
            ds = report.dataset_overview
            sections.append(
                f"DATASET: {ds.rows} rows, {ds.columns} columns, "
                f"{ds.missing_value_count} missing values."
            )

        # Model findings
        sections.append(f"\nMODEL FINDINGS ({len(report.findings)} models):")
        for f in report.findings:
            sections.append(
                f"  [{f.model}] ({f.task_type.value}) — {f.finding} "
                f"| Confidence: {f.confidence:.0%} | Severity: {f.severity.value}"
            )
            if f.important_features:
                sections.append(f"    Key features: {', '.join(f.important_features)}")

        # Consensus
        if report.consensus:
            c = report.consensus
            sections.append(f"\nCONSENSUS: Agreement score = {c.agreement_score:.0%}")
            sections.append(f"  {c.summary}")
            for conflict in c.conflicting_findings:
                sections.append(f"  CONFLICT: {conflict.description}")

        # Confidence
        if report.confidence:
            sections.append(
                f"\nOVERALL CONFIDENCE: {report.confidence.overall_confidence:.0%} "
                f"({report.confidence.confidence_level.value})"
            )

        # Root causes
        if report.root_causes:
            sections.append(f"\nROOT CAUSES ({len(report.root_causes)}):")
            for rc in report.root_causes:
                sections.append(f"  - {rc.cause} (confidence: {rc.confidence:.0%})")
                for ev in rc.evidence[:3]:
                    sections.append(f"    Evidence: {ev}")

        # Rule verdicts
        triggered_rules = [v for v in report.rule_verdicts if v.triggered]
        if triggered_rules:
            sections.append(f"\nRULE VERDICTS ({len(triggered_rules)} triggered):")
            for v in triggered_rules:
                sections.append(f"  [{v.severity.value}] {v.result_description}")

        # Recommendations
        if report.recommendations:
            sections.append(f"\nRECOMMENDATIONS ({len(report.recommendations)}):")
            for rec in report.recommendations:
                sections.append(f"  [{rec.priority.value}] {rec.action}")

        # Risk level
        sections.append(f"\nOVERALL RISK: {report.risk_level.value}")

        return "\n".join(sections)

    @staticmethod
    def _build_fallback_summary(report: ReasoningReport) -> str:
        """Build a deterministic executive summary when LLM is unavailable."""
        parts: list[str] = []

        n_models = len(report.findings)
        parts.append(f"Analysis completed using {n_models} model(s).")

        if report.confidence:
            parts.append(
                f"Overall confidence: {report.confidence.overall_confidence:.0%} "
                f"({report.confidence.confidence_level.value})."
            )

        if report.root_causes:
            top = report.root_causes[0]
            parts.append(f"Primary finding: {top.cause}")

        parts.append(f"Risk level: {report.risk_level.value}.")

        if report.recommendations:
            parts.append(f"{len(report.recommendations)} recommendation(s) generated.")

        return " ".join(parts)
