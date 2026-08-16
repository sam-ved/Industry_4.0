import os
import sqlite3
import yaml
from typing import List, Dict
from fastapi import HTTPException
from backend.models.schemas import DetectionParameter
from backend.database.db import DB_PATH, get_all_defect_types

class DetectionConfigService:
    @classmethod
    async def create_detection_config(cls, dataset_id: str, defect_types: List[DetectionParameter]) -> Dict:
        """Create detection configuration and save to database."""
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            
            # Clear existing config for this dataset
            cursor.execute("DELETE FROM defect_types WHERE dataset_id = ?", (dataset_id,))
            
            for dt in defect_types:
                cursor.execute("""
                    INSERT INTO defect_types 
                    (id, dataset_id, name, class_id, confidence_threshold, color)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    dt.id, dataset_id, dt.name, dt.class_id, dt.confidence_threshold, dt.color
                ))
                
            conn.commit()
            conn.close()
            
            # Generate YAML
            await cls.generate_dataset_yaml(dataset_id)
            
            return {"status": "success", "message": f"Saved {len(defect_types)} parameters"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @classmethod
    async def get_detection_parameters(cls, dataset_id: str) -> List[DetectionParameter]:
        """Fetch all detection parameters for a dataset"""
        params = get_all_defect_types(dataset_id)
        return params

    @classmethod
    async def update_parameter(cls, param_id: str, updates: Dict) -> Dict:
        """Update a specific parameter at runtime"""
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            
            set_clauses = []
            values = []
            for k, v in updates.items():
                if k in ['confidence_threshold', 'color', 'name']:
                    set_clauses.append(f"{k} = ?")
                    values.append(v)
                    
            if not set_clauses:
                return {"status": "no updates"}
                
            query = f"UPDATE defect_types SET {', '.join(set_clauses)} WHERE id = ?"
            values.append(param_id)
            
            cursor.execute(query, values)
            conn.commit()
            
            # Re-generate YAML just in case class names changed
            cursor.execute("SELECT dataset_id FROM defect_types WHERE id = ?", (param_id,))
            row = cursor.fetchone()
            if row:
                await cls.generate_dataset_yaml(row[0])
                
            conn.close()
            return {"status": "success"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @classmethod
    async def generate_dataset_yaml(cls, dataset_id: str) -> None:
        """Generate YOLO dataset.yaml file"""
        params = await cls.get_detection_parameters(dataset_id)
        if not params:
            return
            
        # Sort by class_id to ensure correct names array mapping
        params.sort(key=lambda x: x.class_id)
        
        nc = len(params)
        names = [p.name for p in params]
        
        # Determine dataset paths based on dataset_id
        # We assume the user has mounted or placed datasets in /app/datasets/{dataset_id}
        dataset_path = os.path.abspath(os.path.join("datasets", dataset_id))
        
        yaml_content = {
            "path": dataset_path,
            "train": "images",
            "val": "images",  # In real scenario, split val/test
            "test": "images",
            "nc": nc,
            "names": names
        }
        
        yaml_path = os.path.join("datasets", dataset_id, "dataset.yaml")
        os.makedirs(os.path.dirname(yaml_path), exist_ok=True)
        with open(yaml_path, "w") as f:
            yaml.dump(yaml_content, f, default_flow_style=False)

    @classmethod
    async def get_class_mapping(cls, dataset_id: str) -> Dict:
        """Return class ID to class name mapping"""
        params = await cls.get_detection_parameters(dataset_id)
        return {p.class_id: p.name for p in params}
