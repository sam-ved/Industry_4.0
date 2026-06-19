import numpy as np
from sklearn.ensemble import IsolationForest
import os
import io
import pandas as pd
import xgboost as xgb
import joblib
from backend.utils.mock_data import get_maintenance_mock

_xgb_model = None

def _load_maintenance_model():
    global _xgb_model
    if _xgb_model is not None:
        return _xgb_model
    model_path = os.path.join("models", "rul_xgb_regressor.pkl")
    if os.path.exists(model_path):
        try:
            _xgb_model = joblib.load(model_path)
            print("[MaintenanceService] XGBoost model loaded.")
            return _xgb_model
        except Exception as e:
            print(f"[MaintenanceService] Failed to load XGB model: {e}")
    return None


# Lightweight RUL estimator (linear degradation model)
# Replace with your trained model when available
def _estimate_rul(vibration: float, temperature: float, baseline_hours: float = 720) -> int:
    vib_penalty  = max(0, (vibration - 1.0) * 80)
    temp_penalty = max(0, (temperature - 60) * 3.5)
    rul = int(baseline_hours - vib_penalty - temp_penalty)
    return max(0, rul)


def run_maintenance_analytics(payload: dict | bytes | None = None) -> dict:
    data = get_maintenance_mock()
    model = _load_maintenance_model()

    parsed_payload = None
    if isinstance(payload, bytes):
        try:
            df = pd.read_csv(io.BytesIO(payload))
            # Just converting first few rows to mock payload structure to avoid crashes
            parsed_payload = {"machines": df.to_dict('records')}
        except Exception:
            pass
    elif isinstance(payload, dict):
        parsed_payload = payload

    # If real sensor readings passed in, compute RUL from them
    if parsed_payload and "machines" in parsed_payload:
        for m in data["machines"]:
            match = next((p for p in parsed_payload["machines"] if p.get("machine_id") == m["machine_id"]), None)
            if match:
                m["rul_hours"]        = _estimate_rul(match.get("vibration_mm_s", 1.0), match.get("temperature_c", 65))
                m["vibration_mm_s"]   = match.get("vibration_mm_s", m["vibration_mm_s"])
                m["temperature_c"]    = match.get("temperature_c", m["temperature_c"])
                m["status"]           = "critical" if m["rul_hours"] < 72 else "warning" if m["rul_hours"] < 168 else "healthy"
                m["anomaly_detected"] = m["vibration_mm_s"] > 3.5 or m["temperature_c"] > 85

    # ── Isolation Forest anomaly detection on fleet sensor data ───────────────
    machines = data["machines"]
    if len(machines) >= 3:
        X = np.array([[m["vibration_mm_s"], m["temperature_c"]] for m in machines])
        clf = IsolationForest(contamination=0.2, random_state=42)  # type: ignore
        preds = clf.fit_predict(X)
        for i, m in enumerate(machines):
            m["isolation_forest_anomaly"] = bool(preds[i] == -1)
    else:
        for m in machines:
            m["isolation_forest_anomaly"] = False

    # Recalculate fleet stats
    data["fleet_avg_rul"]    = round(np.mean([m["rul_hours"] for m in machines]), 1)
    data["fleet_avg_health"] = round(np.mean([m["health_score"] for m in machines]), 1)
    data["critical_count"]   = sum(1 for m in machines if m["status"] == "critical")
    data["warning_count"]    = sum(1 for m in machines if m["status"] == "warning")
    data["healthy_count"]    = sum(1 for m in machines if m["status"] == "healthy")
    data["anomaly_count"]    = sum(1 for m in machines if m.get("isolation_forest_anomaly"))

    return {**data, "source": "analytics_engine"}