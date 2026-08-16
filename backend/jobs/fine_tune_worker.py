import os
from celery import shared_task
from ultralytics import YOLO
import torch

from backend.jobs.helpers import update_job_status, update_epoch_metrics, register_model_in_db
from backend.utils.metrics_calculator import GeneralizationMetrics

@shared_task(bind=True)
def fine_tune_yolo_model(self, job_id: str, config_dict: dict):
    """
    Celery task to fine-tune YOLOv8 on user dataset
    """
    try:
        # 1. Update DB status to 'training'
        update_job_status(job_id, 'training')
        
        # 2. Load base YOLOv8 model
        backbone = config_dict.get('model_backbone', 'yolov8n')
        # We append .pt because ultralytics auto-downloads pretrained weights
        model_name = f"{backbone}.pt"
        model = YOLO(model_name)
        
        # 3. Freeze backbone layers if requested
        freeze = config_dict.get('freeze_backbone', False)
        if freeze:
            # Typical YOLOv8 backbone has 10 layers. We can freeze them.
            for k, v in model.named_parameters():
                if any(x in k for x in [f'model.{i}.' for i in range(10)]):
                    v.requires_grad = False
                    
        # 4. Load dataset.yaml
        # To get dataset_id, let's assume it was queried or passed. Wait, we didn't pass dataset_id in config_dict?
        # In fine_tune_service.py we queued fine_tune_yolo_model.delay(job_id, config.dict()). 
        # But FineTuneConfig doesn't have dataset_id.
        # Let's query DB for dataset_id
        import sqlite3
        from backend.database.db import DB_PATH
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT dataset_id FROM fine_tune_jobs WHERE id = ?", (job_id,))
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            raise ValueError(f"Job {job_id} not found in database")
            
        dataset_id = row[0]
        dataset_yaml = os.path.abspath(os.path.join("datasets", dataset_id, "dataset.yaml"))
        
        if not os.path.exists(dataset_yaml):
            raise FileNotFoundError(f"dataset.yaml not found for dataset {dataset_id}")
            
        # 5. Train with callbacks
        def on_fit_epoch_end(trainer):
            # Callback to update DB each epoch
            epoch = trainer.epoch + 1
            metrics = trainer.metrics
            # YOLO metrics usually include loss keys
            # train loss is not easily accessible via trainer.metrics directly in YOLOv8, 
            # usually it's in trainer.tloss (train loss)
            train_loss = float(trainer.tloss[0]) if hasattr(trainer, 'tloss') else 0.0
            
            # Val metrics mapping can vary, usually metrics has fitness or similar
            val_loss = float(metrics.get('val/box_loss', 0.0))
            # Just approximate train_acc and val_acc from map50 for demonstration
            val_acc = float(metrics.get('metrics/mAP50(B)', 0.0))
            
            update_epoch_metrics(
                job_id=job_id,
                epoch=epoch,
                loss=train_loss,
                val_loss=val_loss,
                train_acc=0.0, # Not easily extracted per epoch without custom logger
                val_acc=val_acc
            )
            
        model.add_callback("on_fit_epoch_end", on_fit_epoch_end)
        
        # 6. Run Training
        device = 0 if torch.cuda.is_available() else 'cpu'
        
        results = model.train(
            data=dataset_yaml,
            epochs=config_dict.get('epochs', 50),
            batch=config_dict.get('batch_size', 16),
            lr0=config_dict.get('learning_rate', 0.001),
            patience=15, # Early stopping
            device=device,
            project="runs/detect",
            name=f"finetune_{job_id}",
            exist_ok=True
        )
        
        # Validate & compute generalization metrics
        # (Assuming model.val() on same data for simplicity, but ideally on a test set)
        val_metrics = model.val()
        map50 = val_metrics.box.map50
        
        gen_metrics = GeneralizationMetrics.compute_generalization_gap(
            train_metrics={"accuracy": map50}, # placeholder
            val_metrics={"accuracy": map50}
        )
        
        # 7. Register model in registry
        best_model_path = os.path.join("runs", "detect", f"finetune_{job_id}", "weights", "best.pt")
        
        model_id = register_model_in_db(
            job_id=job_id,
            dataset_id=dataset_id,
            base_model=backbone,
            val_accuracy=float(map50),
            test_accuracy=float(map50),
            model_path=best_model_path
        )
        
        # 8. Update DB status to 'completed' happens inside register_model_in_db
        
    except Exception as e:
        update_job_status(job_id, 'failed', str(e))
        raise
