import sys
sys.path.append('.')
from services.model_service import analyze_with_model
import pandas as pd
import io

df = pd.DataFrame([{"machine": "CNC_01", "machine_type": "Lathe", "vibration": 0.5, "temperature": 45.0, "hours_since_last_maintenance": 100, "machine_age_hours": 500}])
csv_bytes = df.to_csv(index=False).encode('utf-8')

print("Testing rul_prediction...")
res_rul = analyze_with_model("rul_prediction", csv_bytes, "test.csv")
print("RUL Result:", res_rul)

print("\nTesting alert_detection...")
res_alert = analyze_with_model("alert_detection", csv_bytes, "test.csv")
print("Alert Result:", res_alert)

print("\nTesting energy_analytics...")
res_energy = analyze_with_model("energy_analytics", csv_bytes, "test.csv")
print("Energy Result:", res_energy)
