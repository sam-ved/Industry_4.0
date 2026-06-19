import requests
import time

BASE_URL = "http://127.0.0.1:8000"

def test_algorithms():
    # 1. Upload a sample dataset
    print("Uploading dataset...")
    csv_content = """target,feature1,feature2
0,1.2,3.4
1,2.1,4.5
0,1.1,3.2
1,2.5,4.8
0,1.0,3.0
1,2.8,5.0
0,1.3,3.5
1,2.2,4.6
0,1.1,3.1
1,2.9,5.2
"""
    files = {"file": ("test.csv", csv_content, "text/csv")}
    res = requests.post(f"{BASE_URL}/ml-studio/upload", files=files)
    if res.status_code != 200:
        print("Upload failed:", res.text)
        return
    
    file_id = res.json()["data"]["file_id"]
    print(f"File ID: {file_id}")

    algorithms = [
        {"name": "Logistic Regression", "type": "classification"},
        {"name": "Random Forest Classifier", "type": "classification"},
        {"name": "KNN", "type": "classification"},
        {"name": "SVM", "type": "classification"},
        {"name": "Linear Regression", "type": "regression"},
        {"name": "Random Forest Regressor", "type": "regression"},
        {"name": "KMeans", "type": "clustering"},
        {"name": "Isolation Forest", "type": "anomaly"}
    ]

    for algo in algorithms:
        print(f"\nTesting {algo['name']} ({algo['type']})...")
        payload = {
            "file_id": file_id,
            "target_column": "target" if algo["type"] in ["classification", "regression"] else None,
            "features": ["feature1", "feature2"],
            "algorithm": algo["name"],
            "task_type": algo["type"]
        }
        try:
            res = requests.post(f"{BASE_URL}/ml-studio/run", json=payload)
            print(f"Status: {res.status_code}")
            if res.status_code != 200:
                print("Response:", res.text)
            else:
                print("Success.")
        except Exception as e:
            print("Request error:", str(e))

if __name__ == "__main__":
    test_algorithms()
