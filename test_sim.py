import requests

modes = [
    "production_growth", "machine_efficiency", "renewable_energy", 
    "shift_planning", "demand_forecast", "carbon_reduction", "cost_optimization"
]
for mode in modes:
    try:
        r = requests.post("http://localhost:8000/api/v1/simulation/run", json={"mode": mode, "parameters": {}})
        print(f"Mode {mode}: status {r.status_code}")
        if r.status_code != 200:
            print("ERROR:", r.text)
    except Exception as e:
        print(f"Exception on {mode}:", e)
