from typing import Dict, Any, List
import math

class IndustrialKPIEngine:
    @staticmethod
    def compute_regression_kpis(y_true: List[float], y_pred: List[float], confidences: List[float] = None) -> Dict[str, float]:
        if not y_true or not y_pred:
            return {}

        n = len(y_true)
        errors = [y_true[i] - y_pred[i] for i in range(n)]
        abs_errors = [abs(e) for e in errors]
        squared_errors = [e ** 2 for e in errors]
        
        mae = sum(abs_errors) / n
        mse = sum(squared_errors) / n
        rmse = math.sqrt(mse)
        
        mean_y = sum(y_true) / n
        ss_tot = sum((y - mean_y) ** 2 for y in y_true)
        ss_res = sum(squared_errors)
        r2 = 1 - (ss_res / ss_tot) if ss_tot != 0 else 0
        
        mape_vals = [abs(e / y) for e, y in zip(errors, y_true) if y != 0]
        mape = (sum(mape_vals) / len(mape_vals)) * 100 if mape_vals else 0
        
        # Drift score mock (assumes drift increases if variance of errors is high compared to var of target)
        var_err = mse - (sum(errors)/n)**2
        var_y = ss_tot / n if n > 0 else 1
        drift_score = min(var_err / (var_y + 1e-9) * 100, 100)
        
        avg_confidence = sum(confidences) / len(confidences) if confidences else 1.0

        return {
            "model_accuracy_proxy": max(0, r2 * 100),  # Not technically accuracy, but often presented as such in industrial dashboards
            "rmse": rmse,
            "mae": mae,
            "r2_score": r2,
            "mape": mape,
            "prediction_confidence": avg_confidence * 100,
            "drift_score": drift_score
        }

    @staticmethod
    def compute_classification_kpis(y_true: List[Any], y_pred: List[Any], confidences: List[float] = None) -> Dict[str, float]:
        if not y_true or not y_pred:
            return {}

        n = len(y_true)
        correct = sum(1 for i in range(n) if y_true[i] == y_pred[i])
        accuracy = correct / n
        
        # Precision, recall, F1 - weighted approx
        classes = list(set(y_true))
        precisions = []
        recalls = []
        for c in classes:
            tp = sum(1 for i in range(n) if y_pred[i] == c and y_true[i] == c)
            fp = sum(1 for i in range(n) if y_pred[i] == c and y_true[i] != c)
            fn = sum(1 for i in range(n) if y_pred[i] != c and y_true[i] == c)
            
            p = tp / (tp + fp) if tp + fp > 0 else 0
            r = tp / (tp + fn) if tp + fn > 0 else 0
            precisions.append(p)
            recalls.append(r)
            
        avg_precision = sum(precisions) / len(precisions) if precisions else 0
        avg_recall = sum(recalls) / len(recalls) if recalls else 0
        f1 = 2 * (avg_precision * avg_recall) / (avg_precision + avg_recall) if (avg_precision + avg_recall) > 0 else 0
        
        avg_confidence = sum(confidences) / len(confidences) if confidences else accuracy
        confusion_rate = 1 - accuracy

        return {
            "accuracy": accuracy * 100,
            "precision": avg_precision * 100,
            "recall": avg_recall * 100,
            "f1_score": f1 * 100,
            "roc_auc": 0, # Cannot compute simple AUC without probas here, handled in service
            "confusion_rate": confusion_rate * 100,
            "prediction_confidence": avg_confidence * 100
        }

    @staticmethod
    def compute_clustering_kpis(n_clusters: int, silhouette_score: float = None, inertia: float = None) -> Dict[str, float]:
        return {
            "silhouette_score": silhouette_score if silhouette_score is not None else 0,
            "davies_bouldin_index": 0, # Requires complex pairwise distances
            "cluster_purity": 0, # Requires ground truth
            "number_of_clusters": n_clusters,
            "cluster_density": inertia if inertia is not None else 0 # Mocking density with inertia
        }
