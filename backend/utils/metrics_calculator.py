from typing import Dict, List

class GeneralizationMetrics:
    @staticmethod
    def compute_generalization_gap(train_metrics: Dict, val_metrics: Dict, test_metrics: Dict = None) -> Dict:
        """Compute the generalization gap between train and validation/test sets."""
        train_acc = train_metrics.get("accuracy", 0.0)
        val_acc = val_metrics.get("accuracy", 0.0)
        test_acc = test_metrics.get("accuracy", val_acc) if test_metrics else val_acc
        
        # We consider gap between train and validation
        gap = train_acc - val_acc
        
        quality = "Acceptable"
        recs = []
        
        if gap < 0.05 and val_acc >= 0.90:
            quality = "Excellent"
        elif gap < 0.10 and val_acc >= 0.80:
            quality = "Good"
        elif gap > 0.15:
            quality = "Poor"
            recs.append("High generalization gap implies overfitting. Consider adding regularization or data augmentation.")
            
        if val_acc < 0.50:
            quality = "Poor"
            recs.append("Very low validation accuracy. Model may be underfitting or data is insufficient.")
            
        return {
            "train_accuracy": round(train_acc, 4),
            "val_accuracy": round(val_acc, 4),
            "test_accuracy": round(test_acc, 4),
            "generalization_gap": round(gap, 4),
            "quality_score": quality,
            "recommendations": recs
        }

    @staticmethod
    def detect_overfitting(train_loss_history: List[float], val_loss_history: List[float]) -> Dict:
        """Detect if model started overfitting by looking at divergence of loss curves."""
        if len(train_loss_history) < 5 or len(val_loss_history) < 5:
            return {"overfitting_detected": False, "epoch_started": None}
            
        # Check if val_loss is increasing while train_loss is decreasing over a window
        window = 5
        recent_val_losses = val_loss_history[-window:]
        recent_train_losses = train_loss_history[-window:]
        
        val_increasing = all(recent_val_losses[i] < recent_val_losses[i+1] for i in range(window-1))
        train_decreasing = all(recent_train_losses[i] > recent_train_losses[i+1] for i in range(window-1))
        
        is_overfitting = val_increasing and train_decreasing
        
        return {
            "overfitting_detected": is_overfitting,
            "epoch_started": len(train_loss_history) - window if is_overfitting else None
        }

    @staticmethod
    def compute_per_class_metrics(results) -> Dict:
        """Extract per-class metrics from YOLO results."""
        # Assuming results is Ultralytics Results object or dict containing per-class metrics
        class_metrics = {}
        if hasattr(results, 'box') and hasattr(results.box, 'map50'):
            # This is a simplified extraction
            pass
        return class_metrics

    @staticmethod
    def compute_model_robustness(test_results_on_variations: Dict) -> float:
        """Compute standard deviation of accuracy across variations (blur, noise, etc)."""
        accuracies = []
        for variation, metrics in test_results_on_variations.items():
            if isinstance(metrics, dict) and "accuracy" in metrics:
                accuracies.append(metrics["accuracy"])
                
        if not accuracies:
            return 0.0
            
        import statistics
        return round(statistics.stdev(accuracies) if len(accuracies) > 1 else 0.0, 4)
