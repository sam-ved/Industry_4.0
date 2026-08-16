import sqlite3
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Optional
from backend.models.schemas import ModelRegistryItem
from backend.database.db import DB_PATH

router = APIRouter(tags=["Model Registry"])

@router.get("/api/models/registry")
async def list_all_models(status: Optional[str] = None) -> List[ModelRegistryItem]:
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        if status:
            cursor.execute("SELECT * FROM model_registry WHERE status = ?", (status,))
        else:
            cursor.execute("SELECT * FROM model_registry")
            
        rows = cursor.fetchall()
        conn.close()
        
        return [
            ModelRegistryItem(
                model_id=row["id"],
                model_name=row["model_name"],
                val_accuracy=row["val_accuracy"],
                generalization_gap=None, # Depending on schema or metrics JSON, we might populate this
                status=row["status"]
            ) for row in rows
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/models/{model_id}")
async def get_model_info(model_id: str) -> Dict:
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM model_registry WHERE id = ?", (model_id,))
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            raise HTTPException(status_code=404, detail="Model not found")
            
        return dict(row)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/models/{model_id}/deploy")
async def deploy_model(model_id: str) -> Dict:
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Mark all currently deployed models as archived or superseded
        cursor.execute("UPDATE model_registry SET status = 'superseded' WHERE status = 'deployed'")
        
        cursor.execute("UPDATE model_registry SET status = 'deployed' WHERE id = ?", (model_id,))
        if cursor.rowcount == 0:
            conn.close()
            raise HTTPException(status_code=404, detail="Model not found")
            
        conn.commit()
        conn.close()
        return {"status": "success", "message": "Model deployed successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/models/{model_id}/rollback")
async def rollback_model(model_id: str) -> Dict:
    # Similar to deploy, just another semantic wrapper
    return await deploy_model(model_id)

@router.delete("/api/models/{model_id}")
async def archive_model(model_id: str) -> Dict:
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute("UPDATE model_registry SET status = 'archived' WHERE id = ?", (model_id,))
        if cursor.rowcount == 0:
            conn.close()
            raise HTTPException(status_code=404, detail="Model not found")
            
        conn.commit()
        conn.close()
        return {"status": "success", "message": "Model archived"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
