from fastapi import APIRouter
from pydantic import BaseModel
from services.defect_service import run_defect_detection
from services.ppe_service import run_ppe_detection
from services.energy_service import run_energy_analytics
from services.maintenance_service import run_maintenance_analytics
from services.llm_service import (
    generate_dashboard_insights,
    explain_industrial_prediction,
    chat_with_context,
)
from utils.mock_data import get_dashboard_summary

router = APIRouter(prefix="/api/llm", tags=["LLM Insights"])


# ──── Pydantic Models ─────────────────────────────────────────────────────────
class ExplainRequest(BaseModel):
    module: str
    prediction: dict

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    context_data: dict
    messages: list[ChatMessage]


# ──── Endpoints ───────────────────────────────────────────────────────────────

@router.get("/dashboard")
async def dashboard_insights():
    """
    Aggregates all 4 modules → feeds into Claude → returns
    executive-level AI reasoning for the main dashboard panel.
    """
    defect      = run_defect_detection()
    ppe         = run_ppe_detection()
    energy      = run_energy_analytics()
    maintenance = run_maintenance_analytics()

    summary  = get_dashboard_summary(defect, ppe, energy, maintenance)
    insights = await generate_dashboard_insights(summary)

    return {
        "status": "ok",
        "summary": summary,
        "llm_insights": insights,
    }


@router.post("/explain")
async def explain_model_output(request: ExplainRequest):
    """
    Takes a model prediction output and returns AI-generated explanation
    + actionable insights for end users.
    """
    explanation = await explain_industrial_prediction(request.module, request.prediction)
    return {
        "status": "ok",
        "explanation": explanation,
    }


@router.post("/chat")
async def chat_with_ml_model(request: ChatRequest):
    """
    Takes ML model output context and chat history, returns AI response.
    """
    messages_dict = [{"role": msg.role, "content": msg.content} for msg in request.messages]
    response_text = await chat_with_context(request.context_data, messages_dict)
    return {
        "status": "ok",
        "reply": response_text,
    }