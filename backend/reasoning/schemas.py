# backend/reasoning/schemas.py
"""
Pydantic data contracts for the entire reasoning pipeline.

Every reasoning module inputs/outputs these schemas, ensuring
type safety, validation, and a consistent interface across the system.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, Field


# ── Enums ────────────────────────────────────────────────────────────────────


class Severity(str, Enum):
    """Risk/severity classification."""
    CRITICAL = "Critical"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"
    INFO = "Info"


class ConfidenceLevel(str, Enum):
    """Overall confidence band."""
    VERY_HIGH = "Very High"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"


class TaskType(str, Enum):
    """ML task categories."""
    CLASSIFICATION = "classification"
    REGRESSION = "regression"
    CLUSTERING = "clustering"
    ANOMALY = "anomaly"
    PCA = "pca"
    CORRELATION = "correlation"
    FEATURE_IMPORTANCE = "feature_importance"
    STATISTICS = "statistics"


class Priority(str, Enum):
    """Recommendation priority."""
    IMMEDIATE = "Immediate"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"


# ── Model Finding (Step 1 — standardised model output) ───────────────────────


class FeatureContribution(BaseModel):
    """A single feature's contribution to a model's prediction."""
    name: str
    value: float = Field(description="Importance / contribution magnitude")
    direction: Optional[str] = Field(
        default=None,
        description="Positive or Negative impact direction",
    )


class ModelFinding(BaseModel):
    """
    Standardised output schema that every inference model must produce.

    This is the **atomic unit** of evidence consumed by the reasoning pipeline.
    """
    model: str = Field(description="Human-readable model name, e.g. 'Isolation Forest'")
    task_type: TaskType = Field(description="ML task category")
    status: str = Field(default="ok", description="ok | error | warning")
    finding: str = Field(description="One-sentence human summary of the result")
    confidence: float = Field(
        ge=0.0, le=1.0,
        description="Model self-reported confidence in [0, 1]",
    )
    severity: Severity = Field(default=Severity.INFO)
    important_features: list[str] = Field(
        default_factory=list,
        description="Top features the model considers influential",
    )
    metrics: dict[str, Any] = Field(
        default_factory=dict,
        description="Algorithm-specific metrics (accuracy, silhouette, etc.)",
    )
    supporting_evidence: list[str] = Field(
        default_factory=list,
        description="Bullet-point evidence backing the finding",
    )
    explainability: Optional[ExplainabilityResult] = Field(
        default=None,
        description="SHAP / permutation importance if available",
    )
    raw_results: Optional[dict[str, Any]] = Field(
        default=None,
        description="Original unmodified results dict (for passthrough)",
    )


# ── Explainability ───────────────────────────────────────────────────────────


class ExplainabilityResult(BaseModel):
    """Output of SHAP / permutation importance / feature importance."""
    method: str = Field(description="shap | permutation_importance | feature_importance | lime")
    top_features: list[FeatureContribution] = Field(default_factory=list)


# Rebuild ModelFinding now that ExplainabilityResult exists (forward ref)
ModelFinding.model_rebuild()


# ── Evidence Package (Step 2) ────────────────────────────────────────────────


class DatasetSummary(BaseModel):
    """High-level dataset metadata extracted from model findings."""
    rows: Optional[int] = None
    columns: Optional[int] = None
    numerical_columns: list[str] = Field(default_factory=list)
    categorical_columns: list[str] = Field(default_factory=list)
    missing_value_count: int = 0


class EvidencePackage(BaseModel):
    """
    Aggregated findings from ALL models — the single input for every
    reasoning engine downstream.
    """
    dataset_summary: DatasetSummary = Field(default_factory=DatasetSummary)
    findings: list[ModelFinding] = Field(default_factory=list)

    # Categorised views (populated by EvidenceCollector)
    classification_findings: list[ModelFinding] = Field(default_factory=list)
    regression_findings: list[ModelFinding] = Field(default_factory=list)
    clustering_findings: list[ModelFinding] = Field(default_factory=list)
    anomaly_findings: list[ModelFinding] = Field(default_factory=list)
    pca_findings: list[ModelFinding] = Field(default_factory=list)
    correlation_findings: list[ModelFinding] = Field(default_factory=list)
    feature_importance_findings: list[ModelFinding] = Field(default_factory=list)
    statistics_findings: list[ModelFinding] = Field(default_factory=list)

    collected_at: datetime = Field(default_factory=datetime.utcnow)


# ── Rule Engine (Step 3) ────────────────────────────────────────────────────


class RuleVerdict(BaseModel):
    """Output of a single deterministic rule evaluation."""
    rule_name: str
    triggered: bool = False
    condition_description: str = ""
    result_description: str = ""
    severity: Severity = Severity.INFO
    confidence_adjustment: float = Field(
        default=0.0,
        description="Delta to apply to overall confidence (-0.2 to +0.2)",
    )


# ── Consensus Engine (Step 4) ───────────────────────────────────────────────


class FeatureAgreement(BaseModel):
    """How many models agree on a particular feature's importance."""
    feature: str
    supporting_models: list[str] = Field(default_factory=list)
    agreement_count: int = 0


class ConflictingFinding(BaseModel):
    """When two models disagree on severity or conclusion."""
    description: str
    models_involved: list[str] = Field(default_factory=list)


class ConsensusResult(BaseModel):
    """Multi-model agreement analysis."""
    agreement_score: float = Field(
        ge=0.0, le=1.0,
        default=0.0,
        description="Overall agreement fraction across models",
    )
    agreed_features: list[FeatureAgreement] = Field(default_factory=list)
    conflicting_findings: list[ConflictingFinding] = Field(default_factory=list)
    total_models: int = 0
    summary: str = ""


# ── Confidence Engine (Step 5) ──────────────────────────────────────────────


class ConfidenceResult(BaseModel):
    """Fused confidence score with human-readable level."""
    overall_confidence: float = Field(ge=0.0, le=1.0, default=0.5)
    confidence_level: ConfidenceLevel = ConfidenceLevel.MEDIUM
    component_scores: dict[str, float] = Field(
        default_factory=dict,
        description="Per-category confidence contributions",
    )
    adjustments_applied: list[str] = Field(
        default_factory=list,
        description="Rule-based adjustments that modified the score",
    )


# ── Root Cause Engine (Step 6) ──────────────────────────────────────────────


class RootCauseResult(BaseModel):
    """A single inferred root cause with supporting evidence."""
    cause: str = Field(description="Human-readable root cause description")
    confidence: float = Field(ge=0.0, le=1.0, default=0.5)
    evidence: list[str] = Field(default_factory=list)
    contributing_features: list[str] = Field(default_factory=list)
    supporting_models: list[str] = Field(default_factory=list)
    alternative_causes: list[str] = Field(default_factory=list)


# ── Recommendation Engine (Step 7) ──────────────────────────────────────────


class Recommendation(BaseModel):
    """An actionable recommendation."""
    action: str
    priority: Priority = Priority.MEDIUM
    rationale: str = ""
    source_models: list[str] = Field(default_factory=list)
    category: str = Field(
        default="general",
        description="e.g. maintenance, monitoring, process, safety",
    )


# ── Final Report (Steps 8–10) ───────────────────────────────────────────────


class ReasoningReport(BaseModel):
    """
    The final assembled report — output of the entire reasoning pipeline.

    Contains deterministic analysis from all engines plus optional
    LLM-generated narrative.
    """
    # Core sections
    executive_summary: str = ""
    dataset_overview: Optional[DatasetSummary] = None

    # Model results
    findings: list[ModelFinding] = Field(default_factory=list)
    findings_summary: list[str] = Field(
        default_factory=list,
        description="One-line summary per model finding",
    )

    # Reasoning outputs
    consensus: Optional[ConsensusResult] = None
    root_causes: list[RootCauseResult] = Field(default_factory=list)
    confidence: Optional[ConfidenceResult] = None
    rule_verdicts: list[RuleVerdict] = Field(default_factory=list)

    # Actionable
    risk_level: Severity = Severity.INFO
    recommendations: list[Recommendation] = Field(default_factory=list)

    # LLM-enhanced (optional)
    llm_narrative: Optional[dict[str, Any]] = Field(
        default=None,
        description="Structured LLM output (executive summary, business impact, etc.)",
    )

    # Meta
    limitations: list[str] = Field(default_factory=list)
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    reasoning_version: str = "1.0.0"
    llm_used: bool = False
