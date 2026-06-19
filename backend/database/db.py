# backend/database/db.py
# SQLite database setup for persistent analysis history

import sqlite3
import os
from datetime import datetime
from typing import List, Dict

DB_PATH = os.path.join("backend", "database", "analysis_history.db")

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
