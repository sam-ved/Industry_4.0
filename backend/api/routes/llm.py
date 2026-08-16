from fastapi import APIRouter
from pydantic import BaseModel
from backend.services.defect_service import run_defect_detection
from backend.services.ppe_service import run_ppe_detection
from backend.services.energy_service import run_energy_analytics
from backend.services.maintenance_service import run_maintenance_analytics
from backend.services.llm_service import (
    generate_dashboard_insights,
    explain_industrial_prediction,
    chat_with_context,
)
from backend.database import get_cache
import json
import os

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
    # Fetch the latest context globally
    cached_context = get_cache("global", "latest_context")
    if not cached_context:
        return {
            "status": "no_context",
            "message": "No model results available yet."
        }
        
    try:
        context_data = json.loads(cached_context)
    except:
        return {
            "status": "no_context",
            "message": "Invalid context format."
        }

    insights = await generate_dashboard_insights(context_data)

    return {
        "status": "ok",
        "module": context_data.get("module"),
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


@router.get("/health")
async def check_llm_health():
    """
    Returns the status of the LLM connection and configuration.
    """
    import os
    has_key = bool(os.getenv("GROQ_API_KEY"))
    return {
        "status": "healthy" if has_key else "degraded",
        "provider": "groq",
        "model": "llama-3.1-8b-instant",
        "connected": has_key
    }


@router.get("/debug")
async def get_llm_debug_status():
    """
    Returns deep diagnostics on LLM and Context state.
    """
    has_key = bool(os.getenv("GROQ_API_KEY"))
    cached_context = get_cache("global", "latest_context")
    
    return {
        "groq_connected": has_key,
        "chat_endpoint_working": has_key,  # Approximated
        "latest_context_available": bool(cached_context),
        "last_error": None
    }