# 🚀 QUICK START - Industry 4.0 AI Control Center

## ⚡ 30-Second Start (Terminal 1: Backend)

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows: this command
source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

✅ **Backend ready at: http://localhost:8000**

---

## ⚡ 30-Second Start (Terminal 2: Frontend)

```bash
cd frontend
npm install
npm run dev
```

✅ **Frontend ready at: http://localhost:5173**

---

## 🔧 Before Running: Set Your API Key

Edit `backend/.env`:
```
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxx  ← Add your Anthropic API key here
FRONTEND_URL=http://localhost:5173
```

Get an API key at: https://console.anthropic.com

---

## 📱 What to Do Once Running

### 1. Open http://localhost:5173 in browser

### 2. Check Backend Status
- Top right shows green "Online" badge if connected
- If red "Offline", backend isn't running on port 8000

### 3. Click Any Module Card
- **Steel Defect Detection** → Upload an image
- **PPE Compliance** → Upload an image or video
- **Energy Analytics** → Upload a CSV with power data
- **Predictive Maintenance** → Upload a CSV with sensor data

### 4. Watch Results Load
- AI analyzes your file
- Shows predictions and insights
- LLM provides human-friendly explanation

---

## ✅ What's Working

| Feature | Status | Notes |
|---------|--------|-------|
| Backend Health Check | ✅ | Polls every 3 seconds |
| Navigation | ✅ | Click cards to jump between modules |
| File Upload Validation | ✅ | Rejects wrong file types |
| Model Inference | ✅ | Uses mock data if no real models |
| LLM Explanations | ✅ | Requires Anthropic API key |
| Charts & Dashboard | ✅ | Shows trends and KPIs |
| Error Handling | ✅ | Shows user-friendly messages |
| Loading States | ✅ | Spinners while processing |

---

## 🧪 Test Without API Key

Backend works fine without the API key - it just won't show LLM insights. Perfect for testing!

Responses will include:
- AI predictions (defects, PPE %, energy usage, RUL)
- Charts and analytics
- System status

Only the "AI Insights" explanations require the API key.

---

## 📊 Example Test Files

### For Defect Detection:
Any JPG or PNG steel/metal image

### For PPE:
Any JPG/PNG of workers or MP4 video

### For Energy Analytics (CSV):
```
timestamp,power_kw,temperature_c,humidity_pct
2024-01-15 08:00,320,22.5,45
2024-01-15 09:00,350,23.1,46
2024-01-15 10:00,380,24.0,48
```

### For Predictive Maintenance (CSV):
```
timestamp,vibration,temperature,runtime_hours,failures
2024-01-15 08:00,1.2,65,1200,0
2024-01-15 09:00,1.5,68,1201,0
2024-01-15 10:00,2.1,72,1202,1
```

---

## 🐛 Quick Troubleshooting

**"Backend Offline" showing?**
- Check backend is running: `python -m uvicorn main:app --port 8000`
- Verify it's on port 8000 (check terminal output)

**Get import errors in frontend?**
- Run: `npm install`
- Restart dev server: `npm run dev`

**Models not loading?**
- That's fine! Backend uses mock data automatically
- To use real models, place them in `backend/models/`

**LLM not responding?**
- Check API key is in `.env`
- Check Anthropic account has credits
- Check backend logs for errors

---

## 📚 Full Documentation

See `SETUP.md` for:
- Complete installation guide
- API endpoint reference
- Architecture overview
- Project structure
- Testing procedures
- Production deployment

---

## 🎯 Next Steps After Testing

1. **Train Real Models**
   - YOLO for steel defects
   - Random Forest/XGBoost for energy & maintenance

2. **Connect Real Data**
   - Replace mock data with live sensors
   - Integrate with plant databases

3. **Deploy to Production**
   - Build frontend: `npm run build`
   - Deploy backend to cloud (AWS/Azure/GCP)
   - Update API_BASE_URL

4. **Add Features**
   - User authentication
   - Data persistence with database
   - Real-time alerts via WebSocket
   - Export to PDF/Excel
   - Email notifications

---

## 💡 Pro Tips

- Backend auto-reloads code changes (uvicorn --reload)
- Frontend hot-reloads (Vite dev server)
- Use F12 DevTools to inspect API responses
- Check backend logs for detailed error info
- Navigate using back buttons on module pages

---

## 🎉 Done!

Your Industry 4.0 AI Control Center is ready to use! 🚀

Questions? Check SETUP.md or inspect terminal output for errors.
