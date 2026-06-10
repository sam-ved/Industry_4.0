# Industry 4.0 AI Control Center - Setup & Run Guide

## Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- Git
- Anthropic API key (for LLM features)

---

## BACKEND SETUP

### 1. Navigate to Backend Directory
```bash
cd backend
```

### 2. Create Python Virtual Environment
```bash
python -m venv venv

# On Windows:
venv\Scripts\activate

# On macOS/Linux:
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables
Edit `.env` file:
```
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx  # Your Anthropic API key
FRONTEND_URL=http://localhost:5173      # Vite dev server URL
```

### 5. Start Backend Server
```bash
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

✅ Backend running at: **http://localhost:8000**
📚 API docs at: **http://localhost:8000/docs**

---

## FRONTEND SETUP

### 1. Navigate to Frontend Directory
```bash
cd frontend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create `.env.local` file (copy from `.env.example`):
```
VITE_API_BASE_URL=http://localhost:8000
```

### 4. Start Frontend Dev Server
```bash
npm run dev
```

✅ Frontend running at: **http://localhost:5173**

---

## WHAT'S BEEN IMPLEMENTED

### ✅ STEP 1: Backend Connection Fix
- [x] `/health` endpoint returns `{ status: "ok" }`
- [x] Frontend polls health endpoint every 3 seconds
- [x] Backend status indicator shows Online/Offline status
- [x] CORS configured for `http://localhost:5173`

### ✅ STEP 2: API Configuration
- [x] Centralized API config in `src/config/api.ts` (TypeScript)
- [x] Axios-based HTTP client with interceptors
- [x] Configurable base URL via `VITE_API_BASE_URL`
- [x] Health check polling hook: `useBackendStatus`

### ✅ STEP 3: React Router & Navigation
Routes implemented:
- `/` - Main Dashboard
- `/defect-detection` - YOLO Steel Defect Detection
- `/ppe-monitoring` - PPE Compliance Monitoring
- `/energy-analytics` - Energy Analytics & Prediction
- `/predictive-maintenance` - Predictive Maintenance
- `/models` - Models Hub (existing)

All pages have "Back" navigation button and Backend status indicator.

### ✅ STEP 4: Model Input Handler
Created `src/components/ModelInputHandler.tsx`:
- Dynamic file validation per model type
- YOLO: Image upload (JPG, PNG, WebP) up to 10MB
- PPE: Image/Video upload (JPG, PNG, MP4, MOV) up to 50MB
- Energy: CSV upload up to 20MB
- Predictive: CSV upload up to 20MB
- Drag & drop support
- Real-time validation with error messages

### ✅ STEP 5: Backend Model APIs
All routers implemented with consistent response structure:

**POST /api/defect/analyze**
- Accepts image upload
- Returns: `{ status: "ok", data: {...}, llm_insights: "..." }`
- Falls back to mock data if no model available

**POST /api/ppe/analyze**
- Accepts image/video upload
- Returns PPE compliance percentage

**POST /api/energy/analyze**
- Accepts CSV file
- Returns consumption metrics, predictions, optimizations

**POST /api/maintenance/analyze**
- Accepts CSV file
- Returns RUL, failure risk, maintenance schedule

**GET /health**
- Returns `{ status: "healthy" }`

### ✅ STEP 6: LLM Integration
- [x] `POST /api/llm/explain` - Explain model predictions
- [x] `POST /api/llm/dashboard` - Generate dashboard insights
- [x] Uses Anthropic Claude with structured JSON responses
- [x] Per-module analysis functions:
  - `analyze_defect()` - Steel quality analysis
  - `analyze_ppe()` - Safety compliance analysis
  - `analyze_energy()` - Energy optimization insights
  - `analyze_maintenance()` - Fleet health assessment

### ✅ STEP 7: Frontend Dashboard & Analytics
- [x] Dashboard with 4 module cards (clickable, navigate to modules)
- [x] KPI cards showing metrics (Defects, PPE, Energy, Health)
- [x] 24-hour trends chart (Recharts)
- [x] AI Insights panel with system health score
- [x] Alerts display with recommendations
- [x] Real-time data refresh (30-second interval)
- [x] Loading states on all cards
- [x] Module-specific pages with results display

### ✅ STEP 8: Error Handling & UX
- [x] HTTP error handling via Axios interceptors
- [x] API call error messages displayed to users
- [x] Loading spinners during analysis
- [x] Disabled buttons when backend is offline
- [x] File validation with helpful error messages
- [x] Backend status indicator (Online/Offline)
- [x] All pages have consistent dark theme
- [x] Smooth animations and transitions

---

## API ENDPOINT REFERENCE

### Health Check
```bash
GET /health
Response: { "status": "healthy" }
```

### Defect Detection
```bash
POST /api/defect/analyze
Content-Type: multipart/form-data
Body: { "file": <image_file> }

Response:
{
  "status": "ok",
  "data": {
    "defects_detected": 5,
    "confidence_score": 0.92,
    "defect_areas": [...],
    "processing_time_ms": 234,
    "llm_insights": "..."
  }
}
```

### PPE Monitoring
```bash
POST /api/ppe/analyze
Content-Type: multipart/form-data
Body: { "file": <image_or_video_file> }

Response:
{
  "status": "ok",
  "data": {
    "compliance_percentage": 96.4,
    "equipment_detected": [...],
    "missing_equipment": [...],
    "processing_time_ms": 156
  }
}
```

### Energy Analytics
```bash
POST /api/energy/analyze
Content-Type: multipart/form-data
Body: { "file": <csv_file> }

Response:
{
  "status": "ok",
  "data": {
    "total_consumption_kwh": 4200,
    "peak_load_kw": 520,
    "average_load_kw": 380,
    "efficiency_score": 87,
    "predictions": [...],
    "optimizations": [...]
  }
}
```

### Predictive Maintenance
```bash
POST /api/maintenance/analyze
Content-Type: multipart/form-data
Body: { "file": <csv_file> }

Response:
{
  "status": "ok",
  "data": {
    "failure_risk": 0.35,
    "days_until_failure": 45,
    "components_at_risk": [...],
    "maintenance_schedule": [...],
    "health_status": "healthy"
  }
}
```

### LLM Explanation
```bash
POST /api/llm/explain
Content-Type: application/json
Body: {
  "model_output": "...",
  "context": "optional context"
}

Response:
{
  "status": "ok",
  "explanation": "Human-friendly explanation with actionable insights"
}
```

### Dashboard Insights
```bash
GET /api/llm/dashboard

Response:
{
  "status": "ok",
  "summary": {...},
  "llm_insights": {
    "overall_status": "normal",
    "headline": "...",
    "key_alerts": [...],
    "top_recommended_actions": [...],
    "system_health_score": 87
  }
}
```

---

## PROJECT STRUCTURE

### Backend (`/backend`)
```
├── main.py                      # FastAPI app entry point
├── requirements.txt             # Python dependencies
├── .env                         # Environment config (add API key here)
├── routers/                     # API endpoint handlers
│   ├── defect.py               # Defect detection endpoints
│   ├── ppe.py                  # PPE monitoring endpoints
│   ├── energy.py               # Energy analytics endpoints
│   ├── maintenance.py          # Predictive maintenance endpoints
│   ├── llm.py                  # LLM explanation endpoints
│   └── models.py               # Models hub endpoints
├── services/                    # Business logic
│   ├── defect_service.py       # YOLO inference
│   ├── ppe_service.py          # PPE detection
│   ├── energy_service.py       # Energy analytics
│   ├── maintenance_service.py  # RUL estimation
│   ├── model_service.py        # Model management
│   └── llm_service.py          # Claude API calls
├── utils/                       # Helper functions
│   ├── mock_data.py            # Mock responses for testing
│   └── model_loader.py         # Model initialization
└── models/                      # Model files (YOLO, etc.)
```

### Frontend (`/frontend`)
```
├── src/
│   ├── App.tsx                 # Main app with routing
│   ├── main.tsx                # Entry point
│   ├── config/
│   │   └── api.ts              # Axios configuration
│   ├── services/
│   │   └── api.ts              # API service layer
│   ├── hooks/
│   │   ├── useBackendStatus.ts # Health check polling
│   │   ├── useDashboard.ts     # Dashboard data fetching
│   │   └── useModelsHub.ts     # Models hub logic
│   ├── components/
│   │   ├── ModelInputHandler.tsx    # File upload component
│   │   ├── BackendStatusIndicator.tsx # Status badge
│   │   ├── common/                 # Reusable components
│   │   │   ├── Card.jsx
│   │   │   ├── BackgroundGlow.jsx
│   │   │   └── UploadDropzone.jsx
│   │   └── ModelsHub/              # Models Hub components
│   └── pages/
│       ├── Dashboard.tsx             # Main dashboard
│       ├── DefectDetection.tsx       # Defect detection page
│       ├── PPEMonitoring.tsx         # PPE monitoring page
│       ├── EnergyAnalytics.tsx       # Energy analytics page
│       ├── PredictiveMaintenance.tsx # Maintenance page
│       └── ModelsHub.jsx             # Models hub page
├── .env.example                # Environment template
├── package.json                # Dependencies
├── vite.config.js              # Vite configuration
└── index.html                  # HTML entry point
```

---

## TESTING THE SYSTEM

### 1. Test Backend Health
```bash
curl http://localhost:8000/health
```
Expected: `{"status":"healthy"}`

### 2. Test Defect Detection (Mock)
```bash
curl -X POST http://localhost:8000/api/defect/status
```
Expected: Mock defect data with LLM insights

### 3. Open Frontend
Navigate to **http://localhost:5173** in your browser

### 4. Check Backend Status
- Backend status indicator should show "Online" (green)
- If it shows "Offline", verify backend is running on port 8000

### 5. Test Module Navigation
- Click on any of the 4 module cards
- Each should navigate to its respective page
- Upload test files and analyze

### 6. Test API Integration
Open browser DevTools (F12) → Network tab:
- Upload an image for defect detection
- Watch the API request to `/api/defect/analyze`
- See the response with predictions and LLM insights

---

## TROUBLESHOOTING

### Backend won't start
```
Error: "Port 8000 already in use"
→ Change port: python -m uvicorn main:app --port 8001
```

### Frontend shows "Backend Offline"
```
→ Ensure backend is running on http://localhost:8000
→ Check VITE_API_BASE_URL in .env.local
→ Verify CORS settings in backend main.py
```

### LLM responses failing
```
→ Verify ANTHROPIC_API_KEY in backend .env
→ Check Claude API quota/rate limits
→ Use mock data for testing (models work without LLM)
```

### YOLO model not loading
```
→ Backend automatically uses mock data if model file missing
→ Place trained model at: backend/models/best.pt (for YOLO)
→ Check models/ directory for existing models
```

---

## NEXT STEPS

### To Production:
1. Deploy backend to cloud (AWS, Azure, GCP)
2. Build frontend: `npm run build`
3. Serve frontend from CDN
4. Update VITE_API_BASE_URL to production backend URL
5. Set up proper authentication
6. Add database for historical data
7. Implement user management & role-based access

### To Add Real Models:
1. Train/download YOLO model, place in `backend/models/`
2. Train Random Forest/XGBoost on your data
3. Update service files to load real models
4. Test with real data files

### To Enhance:
1. Add database integration (PostgreSQL)
2. Implement user authentication (OAuth2)
3. Add data export (PDF, CSV, Excel)
4. Create alert notification system
5. Add real-time WebSocket updates
6. Implement audit logging

---

## API DOCUMENTATION

Full API documentation available at: **http://localhost:8000/docs**

When backend is running, visit the link above for interactive Swagger UI.

---

## Support

For issues or questions, check:
1. Backend logs: Check terminal where uvicorn is running
2. Frontend console: F12 → Console tab
3. Network requests: F12 → Network tab
4. API responses: F12 → Network tab → click request → Response tab
