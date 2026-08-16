from typing import Dict, Any, List
from backend.analytics.visualization_engine import VisualizationEngine

class VisualizationService:
    """
    Centralizes all chart data formatting for Recharts on the frontend.
    """

    @staticmethod
    def format_visualizations(results: Dict[str, Any], task_type: str) -> Dict[str, Any]:
        vis = results.get("visualizations", {})
        
        # Ensure we have a feature importance payload if available
        features = results.get("feature_importance", [])
        if features and "feature_importance_chart" not in vis:
            vis["feature_importance_chart"] = [
                {"name": f["name"], "value": f["value"]} for f in features
            ]

        # Classification specific charts
        if task_type == "classification":
            cm = results.get("confusion_matrix")
            classes = results.get("class_names", [f"Class {i}" for i in range(len(cm) if cm else 0)])
            if cm and "confusion_matrix_chart" not in vis:
                cm_data = []
                for i, row in enumerate(cm):
                    for j, val in enumerate(row):
                        cm_data.append({
                            "actual": classes[i],
                            "predicted": classes[j],
                            "value": val
                        })
                vis["confusion_matrix_chart"] = cm_data
                
            roc = results.get("roc_curve")
            if roc and "roc_curve_chart" not in vis:
                roc_data = []
                for fpr, tpr in zip(roc.get("fpr", []), roc.get("tpr", [])):
                    roc_data.append({"fpr": fpr, "tpr": tpr})
                vis["roc_curve_chart"] = roc_data
                
        # Regression specific charts
        elif task_type == "regression":
            pvsa = results.get("predictions_vs_actual", [])
            if pvsa and "prediction_vs_actual_chart" not in vis:
                vis["prediction_vs_actual_chart"] = pvsa
                
        # Clustering specific charts
        elif task_type == "clustering":
            scatter = results.get("cluster_scatter", [])
            if scatter and "cluster_scatter_chart" not in vis:
                vis["cluster_scatter_chart"] = scatter
                
        # Anomaly specific charts
        elif task_type == "anomaly":
            scatter = results.get("anomaly_scatter", [])
            if scatter and "anomaly_scatter_chart" not in vis:
                vis["anomaly_scatter_chart"] = scatter
                
        return vis
