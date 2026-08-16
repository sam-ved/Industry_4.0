import sqlite3
import json
from datetime import datetime
from typing import Optional
from backend.database.db import DB_PATH, update_job_progress, register_model

def update_job_status(job_id: str, status: str, error: Optional[str] = None):
    """Update fine_tune_jobs.status in DB"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # If error exists, append to metrics
        if error:
            cursor.execute("SELECT metrics FROM fine_tune_jobs WHERE id = ?", (job_id,))
            row = cursor.fetchone()
            metrics = json.loads(row[0]) if row and row[0] else {}
            metrics["error"] = error
            cursor.execute("UPDATE fine_tune_jobs SET status = ?, metrics = ?, updated_at = ? WHERE id = ?",
                           (status, json.dumps(metrics), datetime.now().isoformat(), job_id))
        else:
            cursor.execute("UPDATE fine_tune_jobs SET status = ?, updated_at = ? WHERE id = ?",
                           (status, datetime.now().isoformat(), job_id))
                           
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Failed to update job status: {e}")

def update_epoch_metrics(job_id: str, epoch: int, loss: float, val_loss: float, 
                         train_acc: Optional[float] = None, val_acc: Optional[float] = None):
    """Update after each epoch"""
    # Using the one from db.py
    # We could also extend to store train_acc and val_acc in the metrics history here
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute("SELECT metrics FROM fine_tune_jobs WHERE id = ?", (job_id,))
        row = cursor.fetchone()
        metrics = json.loads(row[0]) if row and row[0] else {}
        
        if "history" not in metrics:
            metrics["history"] = []
            
        metrics["history"].append({
            "epoch": epoch,
            "loss": loss,
            "val_loss": val_loss,
            "train_acc": train_acc,
            "val_acc": val_acc
        })
        
        cursor.execute("""
            UPDATE fine_tune_jobs 
            SET epochs_completed = ?, metrics = ?, status = 'training', updated_at = ?
            WHERE id = ?
        """, (epoch, json.dumps(metrics), datetime.now().isoformat(), job_id))
        
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Failed to update epoch metrics: {e}")

def register_model_in_db(job_id: str, dataset_id: str, base_model: str, 
                         val_accuracy: float, test_accuracy: float, model_path: str) -> str:
    """Register trained model, return model_id"""
    # Wrapper around the db.py logic
    metrics = {
        "val_accuracy": val_accuracy,
        "test_accuracy": test_accuracy,
        "base_model": base_model,
        "dataset_id": dataset_id
    }
    return register_model(job_id, model_path, metrics)
