# backend/routers/reasoning.py
"""
Reasoning API Router — Step 11.

Exposes the AI Decision Intelligence reasoning pipeline via REST endpoints.
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.reasoning.orchestrator import run_reasoning, run_reasoning_from_results
from backend.reasoning.schemas import ModelFinding

router = APIRouter(prefix="/api/reasoning", tags=["AI Reasoning"])


# ── Request schemas ──────────────────────────────────────────────────────────


class ReasoningRequest(BaseModel):
    """Direct reasoning request with pre-built ModelFindings."""
    findings: list[ModelFinding]
    use_llm: bool = Field(default=True, description="Enable LLM narrative enhancement")


class ReasoningFromResultsRequest(BaseModel):
    """Convenience request accepting raw ML Studio results dicts."""
    results: list[dict[str, Any]] = Field(
        description="List of raw result dicts from ML Studio run_analysis()"
    )
    use_llm: bool = Field(default=True, description="Enable LLM narrative enhancement")


# ── Endpoints ────────────────────────────────────────────────────────────────


@router.post("")
async def reasoning_endpoint(request: ReasoningRequest):
    """
    Main reasoning endpoint.

    Accepts a list of standardised ModelFinding objects,
    runs the full reasoning pipeline, returns a ReasoningReport.
    """
    try:
        report = await run_reasoning(
            findings=request.findings,
            use_llm=request.use_llm,
        )
        return {
            "status": "ok",
            "report": report.model_dump(mode="json"),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Reasoning pipeline failed: {e}")


@router.post("/from-results")
async def reasoning_from_results_endpoint(request: ReasoningFromResultsRequest):
    """
    Convenience endpoint for ML Studio integration.

    Accepts raw ML Studio result dicts, converts them to ModelFindings
    internally, then runs the full reasoning pipeline.
    """
    try:
        report = await run_reasoning_from_results(
            results_list=request.results,
            use_llm=request.use_llm,
        )
        return {
            "status": "ok",
            "report": report.model_dump(mode="json"),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Reasoning pipeline failed: {e}")


@router.get("/health")
async def reasoning_health():
    """Health check for the reasoning subsystem."""
    import os
    from backend.reasoning.llm_reasoner import LLMReasoner

    llm = LLMReasoner()
    return {
        "status": "ok",
        "reasoning_version": "1.0.0",
        "llm_available": llm.is_available,
        "llm_provider": "groq" if llm.is_available else None,
        "groq_key_configured": bool(os.getenv("GROQ_API_KEY")),
    }
