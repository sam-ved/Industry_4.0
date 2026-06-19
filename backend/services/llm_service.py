from backend.database import get_cache, set_cache, log_ai_insight
import logging
import os
import sys
import json
import hashlib
from google import genai
from google.genai import types
from dotenv import load_dotenv

# Add backend directory to sys.path to allow direct execution

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
MODEL = "gemini-2.5-flash"

INDUSTRIAL_PERSONA = (
    "You are an expert Industrial Engineer, Reliability Engineer, and Manufacturing Consultant. "
    "Your objective is to act as an Industrial AI Copilot. "
    "Analyze the provided prediction data and generate concise, technical, and actionable insights. "
    "Do NOT act like a generic assistant. Avoid generic AI wording. "
    "Return ONLY a valid JSON object matching the exact requested keys, without markdown fences or additional text."
)


async def _call_gemini_async(system_prompt: str, user_prompt: str) -> dict:
    """Core Gemini call — always returns structured JSON."""
    try:
        response = await client.aio.models.generate_content(
            model=MODEL,
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                response_mime_type="application/json",
            )
        )
        raw = response.text or ""
        # Strip markdown fences if present
        raw = raw.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        return json.loads(raw.strip())
    except Exception as e:
        logger.error(f"[LLM Service Error] {str(e)}", exc_info=True)
        return {
            "summary": "AI Analysis unavailable due to API error.",
            "overall_status": "degraded",
            "headline": "AI Service Temporarily Unavailable",
            "key_alerts": [],
            "top_recommended_actions": ["Check Gemini API key, billing balance, and quota limit."],
            "positive_highlights": [],
            "system_health_score": 50,
            "severity_assessment": "unknown",
            "risk_level": "unknown",
            "consumption_trend": "unknown",
            "failure_risk": "unknown",
            "error": str(e)
        }


def get_module_prompt(module: str, prediction: dict) -> str:
    if module == "steel":
        return f"""
Analyze the following steel defect detection results:
{json.dumps(prediction, indent=2)}

Return a JSON object with these EXACT keys:
- summary (string: Defect explanation)
- root_cause (string: Possible causes)
- business_impact (string: Production impact)
- recommendation (string: Recommended actions)
- risk_level (string: Severity level)
"""
    elif module == "ppe":
        return f"""
Analyze the following PPE monitoring results:
{json.dumps(prediction, indent=2)}

Return a JSON object with these EXACT keys:
- summary (string: Compliance summary)
- root_cause (string: Violations found)
- business_impact (string: Safety assessment)
- recommendation (string: Corrective actions)
- risk_level (string: Risk level)
"""
    elif module == "energy":
        return f"""
Analyze the following energy analytics results:
{json.dumps(prediction, indent=2)}

Return a JSON object with these EXACT keys:
- summary (string: Energy consumption summary)
- root_cause (string: Potential inefficiencies)
- business_impact (string: Cost-saving/Carbon reduction opportunities)
- recommendation (string: Operational recommendations)
- risk_level (string: Normal/Elevated/Critical based on anomalies/trends)
"""
    elif module == "maintenance":
        return f"""
Analyze the following predictive maintenance results:
{json.dumps(prediction, indent=2)}

Return a JSON object with these EXACT keys:
- summary (string: Machine condition assessment)
- root_cause (string: Expected failure mechanism / RUL context)
- business_impact (string: Downtime risk / Business impact)
- recommendation (string: Maintenance schedule recommendation)
- risk_level (string: Failure risk level)
"""
    else:
        return f"""
Analyze the following industrial data:
{json.dumps(prediction, indent=2)}

Return a JSON object with these EXACT keys:
- summary (string)
- root_cause (string)
- business_impact (string)
- recommendation (string)
- risk_level (string)
"""


def generate_fallback_response(module: str, prediction: dict) -> dict:
    # Rule-based fallback if LLM API fails
    return {
        "summary": f"Automated analysis for {module} module completed successfully.",
        "root_cause": "System operating under standard rule-based parameters (API Unavailable).",
        "recommendation": "Review the detailed prediction metrics and monitor the affected assets.",
        "risk_level": "Unknown",
        "business_impact": "Monitor performance closely to prevent operational deviations."
    }


async def explain_industrial_prediction(module: str, prediction: dict) -> dict:
    # 1. Cost Optimization: Check cache
    payload_str = json.dumps(prediction, sort_keys=True)
    cache_key = hashlib.md5(f"{module}_{payload_str}".encode()).hexdigest()

    cached = get_cache("llm_explain", cache_key)
    if cached:
        try:
            return json.loads(cached)
        except Exception:
            pass

    # 2. Build Prompts
    system_prompt = INDUSTRIAL_PERSONA
    user_prompt = get_module_prompt(module, prediction)

    # 3. Call LLM
    try:
        logger.info("Calling Gemini")
        logger.info(user_prompt)
        response = await client.aio.models.generate_content(
            model=MODEL,
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                response_mime_type="application/json",
            )
        )
        logger.info("Gemini Response")
        logger.info(response.text)

        raw = (response.text or "").strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]

        response_data = json.loads(raw.strip())

        # Validate keys
        required_keys = ["summary", "root_cause",
                         "recommendation", "risk_level", "business_impact"]
        for key in required_keys:
            if key not in response_data:
                response_data[key] = "N/A"

    except Exception as e:
        logger.error(f"[LLM Service Error] {str(e)}", exc_info=True)
        response_data = generate_fallback_response(module, prediction)

    # 4. Cache response
    set_cache("llm_explain", module, cache_key, json.dumps(
        response_data), expires_minutes=60*24)

    # 4.5 Save Global Context
    global_context = {
        "module": module,
        "prediction": prediction
    }
    set_cache("global", "system", "latest_context",
              json.dumps(global_context), expires_minutes=60*24)

    # 5. Log History
    log_ai_insight(module, payload_str, json.dumps(response_data))

    return response_data


async def generate_dashboard_insights(context_data: dict) -> dict:
    """Master dashboard reasoning — generates insights based on the latest module execution context."""
    system_prompt = (
        "You are the AI brain of an Industry 4.0 control center. "
        "Given the latest model execution context, generate an executive intelligence report for the main dashboard. "
        "Return ONLY a JSON object with these exact keys: "
        "executive_summary (string, a concise summary of the module's findings), "
        "key_findings (list of 3 strings detailing the most important points), "
        "recommendations (list of 3 strings with prioritized actionable advice)."
    )
    user_prompt = f"Latest model context: {json.dumps(context_data, indent=2)}"
    return await _call_gemini_async(system_prompt, user_prompt)


async def chat_with_context(context_data: dict, messages: list) -> str:
    """Conversational chat about a model's output context."""
    system_prompt = (
        "You are an expert industrial AI analyst. Your job is to help users understand "
        "the AI model's output results and answer their questions about it. "
        "Provide clear, actionable, and concise responses. "
        f"Here is the context data from the ML model: {json.dumps(context_data)}"
    )
    try:
        gemini_messages = []
        for m in messages:
            if m["role"] == "user":
                gemini_messages.append(
                    {"role": "user", "parts": [{"text": m["content"]}]})
            else:
                gemini_messages.append(
                    {"role": "model", "parts": [{"text": m["content"]}]})

        response = await client.aio.models.generate_content(
            model=MODEL,
            contents=gemini_messages,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt
            )
        )
        return response.text or ""
    except Exception as e:
        logger.error(f"[LLM Service Error] {str(e)}", exc_info=True)
        return "AI chat is currently unavailable. Please check your Gemini API key and quota."
