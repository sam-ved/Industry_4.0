import requests

results = {
    "predicted_energy": 1000,
    "predicted_co2": 500,
    "predicted_production": 5000,
    "energy_delta": -100,
    "co2_delta": -50
}

r = requests.post("http://localhost:8000/api/v1/simulation/ai-explanation", json={"results": results})
print("ai-explanation status:", r.status_code)
print("response:", r.text)

r2 = requests.get("http://localhost:8000/api/v1/simulation/twin/state")
print("twin state status:", r2.status_code)

