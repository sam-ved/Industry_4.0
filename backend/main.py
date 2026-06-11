import os
# pyrefly: ignore [missing-import]
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from datetime import datetime
import os

from routers import defect, ppe, energy, maintenance, llm, models, ml_studio
from database import init_db
from services.defect_service import run_defect_detection
from services.ppe_service import run_ppe_detection
from services.energy_service import run_energy_analytics
from services.maintenance_service import run_maintenance_analytics
from utils.mock_data import get_dashboard_summary

load_dotenv()
print("Gemini Key Loaded:", bool(os.getenv("GEMINI_API_KEY")))
# Initialize database
init_db()

app = FastAPI(
    title="Industry 4.0 AI Backend",
    description="ML inference + LLM reasoning for Steel Defect, PPE, Energy, and Predictive Maintenance.",
    version="1.0.0",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("FRONTEND_URL", "http://localhost:5173"),
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(defect.router)
app.include_router(ppe.router)
app.include_router(energy.router)
app.include_router(maintenance.router)
app.include_router(llm.router)
app.include_router(models.router)
app.include_router(ml_studio.router)


@app.get("/")
async def root():
    return {"message": "Industry 4.0 AI Backend running", "docs": "/docs"}


@app.get("/health")
async def health():
    return {
        "status": "online",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/dashboard/summary")
async def dashboard_summary():
    defect_data = run_defect_detection()
    ppe_data = run_ppe_detection()
    energy_data = run_energy_analytics()
    maint_data = run_maintenance_analytics()
    
    summary = get_dashboard_summary(defect_data, ppe_data, energy_data, maint_data)
    return {"status": "ok", "data": summary}

@app.get("/test-gemini")
async def test_gemini():
    try:
        from google import genai
        client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        response = await client.aio.models.generate_content(
            model="gemini-2.5-flash",
            contents="Analyze a PPE compliance issue where a worker is wearing a vest but not wearing a helmet."
        )
        return {"success": True, "response": response.text.strip()}
    except Exception as e:
        return {"success": False, "error": str(e)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)