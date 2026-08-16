from typing import Dict, Any, List
import numpy as np

class VisualizationEngine:
    @staticmethod
    def generate_interactive_line_chart(y_true: List[float], y_pred: List[float], max_points: int = 100) -> List[Dict[str, Any]]:
        # Downsample if too large
        step = max(1, len(y_true) // max_points)
        return [
            {
                "index": i,
                "actual": round(y_true[i], 4),
                "predicted": round(y_pred[i], 4)
            }
            for i in range(0, len(y_true), step)
        ]

    @staticmethod
    def generate_residual_plot(y_true: List[float], y_pred: List[float], max_points: int = 200) -> List[Dict[str, Any]]:
        step = max(1, len(y_true) // max_points)
        return [
            {
                "predicted": round(y_pred[i], 4),
                "residual": round(y_true[i] - y_pred[i], 4)
            }
            for i in range(0, len(y_true), step)
        ]

    @staticmethod
    def generate_distribution_curve(data: List[float], bins: int = 20) -> List[Dict[str, Any]]:
        if not data:
            return []
        hist_counts, bin_edges = np.histogram(data, bins=bins)
        return [
            {
                "range": f"{bin_edges[i]:.2f} - {bin_edges[i+1]:.2f}",
                "count": int(count),
                "midpoint": round((bin_edges[i] + bin_edges[i+1]) / 2, 4)
            }
            for i, count in enumerate(hist_counts)
        ]

    @staticmethod
    def generate_feature_correlation_matrix(corr_matrix: Dict[str, Any]) -> List[Dict[str, Any]]:
        # Transforms the generic correlation matrix into a heatmap payload
        if not corr_matrix:
            return []
        
        columns = corr_matrix["columns"]
        data = corr_matrix["data"]
        payload = []
        
        for i, col_y in enumerate(columns):
            row_data = {"feature": col_y}
            for j, col_x in enumerate(columns):
                row_data[col_x] = round(data[i][j], 3)
            payload.append(row_data)
            
        return payload

    @staticmethod
    def generate_3d_pca_projection(X_scaled: np.ndarray, labels: np.ndarray = None, max_points: int = 300) -> List[Dict[str, Any]]:
        if X_scaled.shape[1] < 3:
            return []
            
        from sklearn.decomposition import PCA
        pca = PCA(n_components=3)
        coords = pca.fit_transform(X_scaled)
        
        sample_size = min(max_points, len(coords))
        indices = np.random.choice(len(coords), sample_size, replace=False)
        
        return [
            {
                "x": round(float(coords[i, 0]), 4),
                "y": round(float(coords[i, 1]), 4),
                "z": round(float(coords[i, 2]), 4),
                "cluster": int(labels[i]) if labels is not None else 0
            }
            for i in indices
        ]

    @staticmethod
    def generate_time_series_forecast(y_hist: List[float], y_pred: List[float], dates: List[str] = None) -> List[Dict[str, Any]]:
        payload = []
        hist_len = len(y_hist)
        pred_len = len(y_pred)
        
        for i in range(hist_len):
            payload.append({
                "time": dates[i] if dates else f"T-{hist_len-i}",
                "historical": round(y_hist[i], 4),
                "forecast": None
            })
            
        for i in range(pred_len):
            payload.append({
                "time": dates[hist_len+i] if dates else f"T+{i+1}",
                "historical": None,
                "forecast": round(y_pred[i], 4)
            })
            
        return payload
