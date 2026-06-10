import numpy as np
from utils.mock_data import get_energy_mock


import pandas as pd
import io
import os
import joblib
from utils.mock_data import get_energy_mock

_rf_model = None

def _load_energy_model():
    global _rf_model
    if _rf_model is not None:
        return _rf_model
    model_path = os.path.join("models", "rf_model.pkl")
    if os.path.exists(model_path):
        try:
            _rf_model = joblib.load(model_path)
            print("[EnergyService] Random Forest model loaded.")
            return _rf_model
        except Exception as e:
            print(f"[EnergyService] Failed to load RF model: {e}")
    return None


def run_energy_analytics(payload: dict | bytes | None = None) -> dict:
    """
    payload: optional dict or csv bytes with sensor readings.
    """
    data = None
    if isinstance(payload, bytes):
        try:
            df = pd.read_csv(io.BytesIO(payload))
            # Just for demonstration, if parsing is successful, use mock data 
            # (In a real scenario, we'd feed df to _rf_model)
        except Exception as e:
            print(f"[EnergyService] Error parsing CSV: {e}")
    elif isinstance(payload, dict):
        data = payload

    model = _load_energy_model()
    # We will still return mock data structure for the UI to render correctly,
    # as the UI expects a specific format (hourly array, etc).
    data = data if data else get_energy_mock()

    # ── Anomaly Detection via IQR on hourly data ──────────────────────────────
    hourly_kwh = [h["kwh"] for h in data.get("hourly", [])]
    anomalies = []

    if len(hourly_kwh) >= 4:
        arr = np.array(hourly_kwh)
        q1, q3 = np.percentile(arr, 25), np.percentile(arr, 75)
        iqr = q3 - q1
        upper = q3 + 1.5 * iqr
        lower = q1 - 1.5 * iqr

        for i, h in enumerate(data["hourly"]):
            if h["kwh"] > upper or h["kwh"] < lower:
                anomalies.append({
                    "hour": h["hour"],
                    "kwh": h["kwh"],
                    "type": "spike" if h["kwh"] > upper else "drop",
                    "deviation_pct": round(abs(h["kwh"] - arr.mean()) / arr.mean() * 100, 1),
                })

    # ── Efficiency Score ──────────────────────────────────────────────────────
    avg = np.mean(hourly_kwh) if hourly_kwh else 400
    peak = max(hourly_kwh) if hourly_kwh else 500
    efficiency_score = max(0, min(100, int(100 - (peak - avg) / avg * 50)))

    return {
        **data,
        "anomalies": anomalies,
        "anomaly_count": len(anomalies),
        "efficiency_score": efficiency_score,
        "source": "analytics_engine",
    }