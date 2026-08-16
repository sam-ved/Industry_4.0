import uuid
import sqlite3
import json
from typing import List, Optional
from fastapi import HTTPException
from backend.models.schemas import FineTuneConfig, FineTuneJobStatus
from backend.database.db import DB_PATH, insert_job

class FineTuneService:
    @classmethod
    async def start_fine_tune_job(cls, dataset_id: str, config: FineTuneConfig) -> str:
        """Queue Celery task and store job metadata in DB"""
        job_id = f"job_{uuid.uuid4().hex[:8]}"
        
        # Save to database
        success = insert_job(job_id, dataset_id, config)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to create job in DB")
            
        # Queue Celery task
        # Note: We will import it locally to avoid circular dependencies
        try:
            from backend.jobs.fine_tune_worker import fine_tune_yolo_model
            fine_tune_yolo_model.delay(job_id, config.dict())
        except Exception as e:
            # If celery is not running, we'll just log and maybe fallback or raise
            print(f"Warning: Failed to queue Celery task, check if worker is running. Error: {e}")
            raise HTTPException(status_code=500, detail="Failed to queue Celery task")
            
        return job_id

    @classmethod
    async def get_job_status(cls, job_id: str) -> FineTuneJobStatus:
        """Poll DB for training progress"""
        try:
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            cursor.execute("SELECT * FROM fine_tune_jobs WHERE id = ?", (job_id,))
            row = cursor.fetchone()
            conn.close()
            
            if not row:
                raise HTTPException(status_code=404, detail="Job not found")
                
            metrics = json.loads(row["metrics"]) if row["metrics"] else {}
            epochs_completed = row["epochs_completed"]
            history = metrics.get("history", [])
            
            current_loss = history[-1]["loss"] if history else None
            val_loss = history[-1]["val_loss"] if history else None
            
            # config total epochs could be in metrics from creation
            total_epochs = metrics.get("epochs", 50) 
            progress = (epochs_completed / total_epochs) * 100 if total_epochs > 0 else 0
            
            return FineTuneJobStatus(
                job_id=job_id,
                status=row["status"],
                epoch=epochs_completed,
                progress=min(100.0, round(progress, 2)),
                current_loss=current_loss,
                val_loss=val_loss,
                metrics=metrics
            )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @classmethod
    async def cancel_job(cls, job_id: str) -> bool:
        """Cancel the fine-tuning job."""
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            cursor.execute("UPDATE fine_tune_jobs SET status = 'cancelled' WHERE id = ? AND status IN ('queued', 'training')", (job_id,))
            updated = cursor.rowcount > 0
            conn.commit()
            conn.close()
            
            if updated:
                # To fully cancel, we'd revoke the Celery task here using app.control.revoke
                from backend.celery_app import app
                app.control.revoke(job_id, terminate=True)
                return True
            return False
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @classmethod
    async def list_all_jobs(cls, status: Optional[str] = None) -> List[FineTuneJobStatus]:
        """List all fine-tuning jobs"""
        try:
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            if status:
                cursor.execute("SELECT id FROM fine_tune_jobs WHERE status = ? ORDER BY created_at DESC", (status,))
            else:
                cursor.execute("SELECT id FROM fine_tune_jobs ORDER BY created_at DESC")
                
            rows = cursor.fetchall()
            conn.close()
            
            jobs = []
            for row in rows:
                jobs.append(await cls.get_job_status(row["id"]))
            return jobs
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
