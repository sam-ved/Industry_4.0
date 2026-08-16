import os
import uuid
import json
import hashlib
from typing import List, Dict, Optional
from fastapi import UploadFile, HTTPException
from PIL import Image
import io
import shutil

class DatasetService:
    BASE_DIR = "datasets"

    @classmethod
    async def upload_dataset(cls, dataset_name: str, files: List[UploadFile], annotations: List[UploadFile]) -> Dict:
        """Upload dataset images and YOLO annotations, saving them to disk."""
        dataset_id = f"ds_{uuid.uuid4().hex[:8]}"
        ds_dir = os.path.join(cls.BASE_DIR, dataset_id)
        images_dir = os.path.join(ds_dir, "images")
        labels_dir = os.path.join(ds_dir, "labels")

        os.makedirs(images_dir, exist_ok=True)
        os.makedirs(labels_dir, exist_ok=True)

        total_size = 0
        image_count = 0

        for file in files:
            content = await file.read()
            total_size += len(content)
            img_path = os.path.join(images_dir, file.filename)
            with open(img_path, "wb") as f:
                f.write(content)
            image_count += 1

        for annotation in annotations:
            content = await annotation.read()
            total_size += len(content)
            ann_path = os.path.join(labels_dir, annotation.filename)
            with open(ann_path, "wb") as f:
                f.write(content)

        metadata = {
            "dataset_id": dataset_id,
            "dataset_name": dataset_name,
            "image_count": image_count,
            "total_mb": total_size / (1024 * 1024)
        }
        
        with open(os.path.join(ds_dir, "metadata.json"), "w") as f:
            json.dump(metadata, f)

        # Here we should also insert to the datasets table using db.py
        # But we'll handle the db insertion logic either here or in the router.
        
        return metadata

    @classmethod
    async def get_dataset_stats(cls, dataset_id: str) -> Dict:
        """Calculate class distribution and return basic stats."""
        ds_dir = os.path.join(cls.BASE_DIR, dataset_id)
        if not os.path.exists(ds_dir):
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        metadata_path = os.path.join(ds_dir, "metadata.json")
        if os.path.exists(metadata_path):
            with open(metadata_path, "r") as f:
                stats = json.load(f)
        else:
            stats = {"dataset_id": dataset_id}
            
        class_distribution = await cls.parse_yolo_annotations(dataset_id)
        stats["class_distribution"] = class_distribution
        return stats

    @classmethod
    async def validate_dataset_quality(cls, dataset_id: str) -> Dict:
        """Validate resolution (>= 416x416), check for duplicate images, and class min 50 images."""
        ds_dir = os.path.join(cls.BASE_DIR, dataset_id)
        images_dir = os.path.join(ds_dir, "images")
        
        if not os.path.exists(images_dir):
            raise HTTPException(status_code=404, detail="Dataset not found")
            
        hashes = set()
        duplicates = 0
        invalid_res = 0
        
        for filename in os.listdir(images_dir):
            if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
                path = os.path.join(images_dir, filename)
                with open(path, "rb") as f:
                    content = f.read()
                    file_hash = hashlib.md5(content).hexdigest()
                    if file_hash in hashes:
                        duplicates += 1
                    hashes.add(file_hash)
                    
                    try:
                        img = Image.open(io.BytesIO(content))
                        if img.width < 416 or img.height < 416:
                            invalid_res += 1
                    except Exception:
                        pass
        
        class_dist = await cls.parse_yolo_annotations(dataset_id)
        underrepresented_classes = [c for c, count in class_dist.items() if count < 50]
        
        is_valid = duplicates == 0 and invalid_res == 0 and len(underrepresented_classes) == 0
        
        if not is_valid:
            # We don't raise 400 here, we let the caller decide what to do with the report
            pass

        return {
            "is_valid": is_valid,
            "duplicates": duplicates,
            "invalid_resolution": invalid_res,
            "underrepresented_classes": underrepresented_classes,
            "class_distribution": class_dist
        }

    @classmethod
    async def delete_dataset(cls, dataset_id: str) -> bool:
        """Delete dataset from disk."""
        ds_dir = os.path.join(cls.BASE_DIR, dataset_id)
        if os.path.exists(ds_dir):
            shutil.rmtree(ds_dir)
            return True
        raise HTTPException(status_code=404, detail="Dataset not found")

    @classmethod
    async def parse_yolo_annotations(cls, dataset_id: str) -> Dict[str, int]:
        """Parse YOLO annotation files to count instances per class."""
        labels_dir = os.path.join(cls.BASE_DIR, dataset_id, "labels")
        class_counts = {}
        
        if not os.path.exists(labels_dir):
            return class_counts
            
        for filename in os.listdir(labels_dir):
            if filename.endswith(".txt"):
                path = os.path.join(labels_dir, filename)
                with open(path, "r") as f:
                    for line in f:
                        parts = line.strip().split()
                        if parts:
                            class_id = parts[0]
                            class_counts[class_id] = class_counts.get(class_id, 0) + 1
                            
        return class_counts
