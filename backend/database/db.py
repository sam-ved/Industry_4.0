# backend/database/db.py
# SQLite database setup for persistent analysis history

import sqlite3
import os
from datetime import datetime
from typing import List, Dict, Optional
import json

from backend.models.schemas import DetectionParameter, FineTuneConfig

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "analysis_history.db")

def init_db():
    """Initialize database and create tables if not exists"""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Analysis history table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS analysis_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            model_id TEXT NOT NULL,
            model_name TEXT NOT NULL,
            file_name TEXT NOT NULL,
            status TEXT NOT NULL,
            execution_time_ms REAL NOT NULL,
            model_version TEXT NOT NULL,
            results_json TEXT,
            user_id TEXT DEFAULT 'default'
        )
    """)
    
    # Model cache table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS model_cache (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            model_id TEXT UNIQUE NOT NULL,
            model_name TEXT NOT NULL,
            cache_key TEXT NOT NULL,
            cache_value TEXT NOT NULL,
            created_at TEXT NOT NULL,
            expires_at TEXT
        )
    """)
    
    # AI Insights table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS ai_insights (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            module TEXT NOT NULL,
            prediction_data TEXT NOT NULL,
            llm_response TEXT NOT NULL,
            timestamp TEXT NOT NULL
        )
    """)
    
    # Run new schema.sql
    schema_path = os.path.join(BASE_DIR, "schema.sql")
    if os.path.exists(schema_path):
        with open(schema_path, "r") as f:
            cursor.executescript(f.read())
            
    conn.commit()
    conn.close()
    print("[Database] Initialized successfully")

def add_analysis_record(model_id: str | None, model_name: str, file_name: str, status: str, 
                       execution_time_ms: float, model_version: str, results_json: str | None = None):
    """Add analysis record to database"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO analysis_history 
            (timestamp, model_id, model_name, file_name, status, execution_time_ms, model_version, results_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            datetime.now().isoformat(),
            model_id,
            model_name,
            file_name,
            status,
            execution_time_ms,
            model_version,
            results_json
        ))
        
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"[Database] Error adding record: {e}")
        return False

def get_analysis_history(limit: int = 50, model_id: str | None = None) -> List[Dict]:
    """Get analysis history from database"""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        query = "SELECT * FROM analysis_history"
        params = []
        
        if model_id:
            query += " WHERE model_id = ?"
            params.append(model_id)
        
        query += " ORDER BY timestamp DESC LIMIT ?"
        params.append(limit)
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()
        
        return [dict(row) for row in rows]
    except Exception as e:
        print(f"[Database] Error retrieving history: {e}")
        return []

def get_analytics_stats() -> Dict:
    """Get analytics statistics"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Total analyses
        cursor.execute("SELECT COUNT(*) FROM analysis_history")
        total = cursor.fetchone()[0]
        
        # Successful analyses
        cursor.execute("SELECT COUNT(*) FROM analysis_history WHERE status = 'ok'")
        successful = cursor.fetchone()[0]
        
        # Average execution time
        cursor.execute("SELECT AVG(execution_time_ms) FROM analysis_history WHERE status = 'ok'")
        avg_time = cursor.fetchone()[0] or 0
        
        # Most used model
        cursor.execute("SELECT model_id, COUNT(*) as count FROM analysis_history GROUP BY model_id ORDER BY count DESC LIMIT 1")
        most_used = cursor.fetchone()
        
        conn.close()
        
        return {
            "total_analyses": total,
            "successful_analyses": successful,
            "success_rate": round((successful / total * 100) if total > 0 else 0, 1),
            "avg_execution_time_ms": round(avg_time, 2),
            "most_used_model": most_used[0] if most_used else None,
            "most_used_count": most_used[1] if most_used else 0,
        }
    except Exception as e:
        print(f"[Database] Error getting stats: {e}")
        return {}

def get_cache(model_id: str, cache_key: str):
    """Get cached result"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT cache_value FROM model_cache 
            WHERE model_id = ? AND cache_key = ? AND (expires_at IS NULL OR expires_at > ?)
        """, (model_id, cache_key, datetime.now().isoformat()))
        
        result = cursor.fetchone()
        conn.close()
        
        return result[0] if result else None
    except Exception as e:
        print(f"[Database] Cache retrieval error: {e}")
        return None

def set_cache(model_id: str, model_name: str, cache_key: str, cache_value: str, expires_minutes: int = 60):
    """Store cached result"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        expires_at = None
        if expires_minutes:
            from datetime import timedelta
            expires_at = (datetime.now() + timedelta(minutes=expires_minutes)).isoformat()
        
        cursor.execute("""
            INSERT OR REPLACE INTO model_cache
            (model_id, model_name, cache_key, cache_value, created_at, expires_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (model_id, model_name, cache_key, cache_value, datetime.now().isoformat(), expires_at))
        
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"[Database] Cache storage error: {e}")
        return False

def clear_old_cache(days: int = 7):
    """Clear cache entries older than specified days"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        from datetime import timedelta
        old_date = (datetime.now() - timedelta(days=days)).isoformat()
        
        cursor.execute("DELETE FROM model_cache WHERE created_at < ?", (old_date,))
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"[Database] Cache clearing error: {e}")
        return False

def log_ai_insight(module: str, prediction_data: str, llm_response: str):
    """Log an AI insight explanation to the database"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO ai_insights
            (module, prediction_data, llm_response, timestamp)
            VALUES (?, ?, ?, ?)
        """, (module, prediction_data, llm_response, datetime.now().isoformat()))
        
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"[Database] AI Insight logging error: {e}")
        return False

def get_ai_insights(module: str | None = None, limit: int = 50) -> List[Dict]:
    """Retrieve AI insight history"""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        query = "SELECT * FROM ai_insights"
        params = []
        
        if module:
            query += " WHERE module = ?"
            params.append(module)
            
        query += " ORDER BY timestamp DESC LIMIT ?"
        params.append(limit)
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()
        
        return [dict(row) for row in rows]
    except Exception as e:
        print(f"[Database] AI Insight retrieval error: {e}")
        return []

def get_dataset(dataset_id: str) -> Dict:
    """Fetch dataset by ID"""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM datasets WHERE id = ?", (dataset_id,))
        row = cursor.fetchone()
        conn.close()
        
        return dict(row) if row else {}
    except Exception as e:
        print(f"[Database] Error retrieving dataset: {e}")
        return {}

def get_all_defect_types(dataset_id: str) -> List[DetectionParameter]:
    """Fetch all detection parameters for a dataset"""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM defect_types WHERE dataset_id = ?", (dataset_id,))
        rows = cursor.fetchall()
        conn.close()
        
        params = []
        for row in rows:
            params.append(DetectionParameter(
                id=row["id"],
                name=row["name"],
                class_id=row["class_id"],
                confidence_threshold=row["confidence_threshold"],
                color=row["color"],
                enabled=True
            ))
        return params
    except Exception as e:
        print(f"[Database] Error retrieving defect types: {e}")
        return []

def insert_job(job_id: str, dataset_id: str, config: FineTuneConfig) -> bool:
    """Insert fine-tuning job into DB"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO fine_tune_jobs 
            (id, dataset_id, status, metrics)
            VALUES (?, ?, ?, ?)
        """, (
            job_id,
            dataset_id,
            "queued",
            json.dumps(config.dict())
        ))
        
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"[Database] Error inserting job: {e}")
        return False

def update_job_progress(job_id: str, epoch: int, loss: float, val_loss: float) -> bool:
    """Update training progress"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Fetch current metrics
        cursor.execute("SELECT metrics FROM fine_tune_jobs WHERE id = ?", (job_id,))
        row = cursor.fetchone()
        metrics = json.loads(row[0]) if row and row[0] else {}
        
        if "history" not in metrics:
            metrics["history"] = []
            
        metrics["history"].append({
            "epoch": epoch,
            "loss": loss,
            "val_loss": val_loss
        })
        
        cursor.execute("""
            UPDATE fine_tune_jobs 
            SET epochs_completed = ?, metrics = ?, status = 'training', updated_at = ?
            WHERE id = ?
        """, (
            epoch,
            json.dumps(metrics),
            datetime.now().isoformat(),
            job_id
        ))
        
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"[Database] Error updating job progress: {e}")
        return False

def register_model(job_id: str, model_path: str, metrics: Dict) -> str:
    """Register trained model in registry, return model_id"""
    try:
        import uuid
        model_id = f"mdl_{uuid.uuid4().hex[:8]}"
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        model_name = f"Model from job {job_id}"
        val_accuracy = metrics.get("val_accuracy", 0.0)
        
        cursor.execute("""
            INSERT INTO model_registry 
            (id, model_name, val_accuracy, status, model_path)
            VALUES (?, ?, ?, ?, ?)
        """, (
            model_id,
            model_name,
            val_accuracy,
            "active",
            model_path
        ))
        
        # Mark job as completed
        cursor.execute("""
            UPDATE fine_tune_jobs 
            SET status = 'completed', updated_at = ?
            WHERE id = ?
        """, (datetime.now().isoformat(), job_id))
        
        conn.commit()
        conn.close()
        return model_id
    except Exception as e:
        print(f"[Database] Error registering model: {e}")
        return ""

