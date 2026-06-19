from typing import Dict, Any, List

class InsightEngine:
    @staticmethod
    def generate_report(results: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generates a structured insight report based on ML results.
        Designed to be easily replaceable by an LLM in the future.
        """
        executive_summary = ""
        key_findings = []
        risk_indicators = []
        recommendations = []
        model_interpretation = ""

        # --- Extract Data ---
        algo = results.get("algorithm", "Unknown Algorithm")
        task_type = results.get("task_type", "unknown")
        metrics = results.get("metrics", {})
        dataset_stats = results.get("dataset_stats", {})
        correlations = results.get("correlation_matrix")
        feature_importance = results.get("feature_importance")

        # 1. Dataset Insights
        if dataset_stats:
            rows = dataset_stats.get("rows", 0)
            cols = dataset_stats.get("columns", 0)
            num_cols = len(dataset_stats.get("numerical_columns", []))
            cat_cols = len(dataset_stats.get("categorical_columns", []))
            missing = sum(dataset_stats.get("missing_values", {}).values())

            key_findings.append(f"Dataset contains {rows:,} rows and {cols} columns ({num_cols} numerical, {cat_cols} categorical).")
            
            if missing > 0:
                risk_indicators.append(f"Detected {missing:,} missing values across the dataset.")
                recommendations.append("Ensure missing values are imputed correctly to avoid bias.")
            else:
                key_findings.append("Data quality is high with no missing values detected.")

        # 2. Correlation Analysis
        if correlations and "data" in correlations and "columns" in correlations:
            cols = correlations["columns"]
            data = correlations["data"]
            strong_pos = []
            strong_neg = []
            
            for i in range(len(cols)):
                for j in range(i + 1, len(cols)):
                    val = data[i][j]
                    if val > 0.7:
                        strong_pos.append(f"{cols[i]} and {cols[j]} ({val:.2f})")
                    elif val < -0.7:
                        strong_neg.append(f"{cols[i]} and {cols[j]} ({val:.2f})")
                        
            if strong_pos:
                key_findings.append(f"Strong positive correlation found between: {', '.join(strong_pos[:3])}.")
            if strong_neg:
                key_findings.append(f"Strong negative correlation found between: {', '.join(strong_neg[:3])}.")
                
            if strong_pos or strong_neg:
                recommendations.append("Focus maintenance or operational attention on strongly correlated indicators.")

        # 3. Model Insights
        if task_type == "classification":
            acc = metrics.get("accuracy", 0) * 100
            model_interpretation = f"The {algo} model demonstrates predictive performance with {acc:.1f}% accuracy."
            if acc > 90:
                executive_summary = f"The analysis yielded a highly accurate classification model ({acc:.1f}% accuracy), indicating strong predictable patterns in the data."
            elif acc > 75:
                executive_summary = f"The {algo} model provides moderate predictive capability ({acc:.1f}% accuracy). Further feature engineering may improve results."
            else:
                executive_summary = f"The model shows weak predictive performance ({acc:.1f}% accuracy). Consider gathering more data or revising features."
                risk_indicators.append("Low model accuracy implies the current features may not fully explain the target variable.")

        elif task_type == "regression":
            r2 = metrics.get("r2", 0)
            rmse = metrics.get("rmse", 0)
            model_interpretation = f"The {algo} regression model achieved an R² score of {r2:.3f} with an RMSE of {rmse:.3f}."
            if r2 > 0.8:
                executive_summary = f"The analysis resulted in a strong regression model, explaining {r2*100:.1f}% of the variance in the target."
            elif r2 > 0.5:
                executive_summary = f"The {algo} model has moderate explanatory power (R² = {r2:.3f})."
            else:
                executive_summary = f"The regression model indicates a weak relationship (R² = {r2:.3f})."
                risk_indicators.append("Low R² indicates predictions may be highly volatile.")

        # 4. Feature Importance Insights
        if feature_importance:
            top_features = feature_importance[:3]
            top_names = [f['name'] for f in top_features]
            if top_features:
                top_1 = top_features[0]
                model_interpretation += f" The feature '{top_1['name']}' contributes approximately {top_1['value']*100:.1f}% of the model's predictive power."
                key_findings.append(f"Top influential features are: {', '.join(top_names)}.")
                recommendations.append(f"Monitor high-impact variables heavily, particularly '{top_names[0]}'.")

        # 5. Anomaly Insights
        if task_type == "anomaly":
            anom_pct = metrics.get("anomaly_percentage", 0)
            anom_count = metrics.get("anomalies_detected", 0)
            executive_summary = f"Anomaly detection completed. Identified {anom_count:,} anomalies, representing {anom_pct:.1f}% of the dataset."
            model_interpretation = f"The Isolation Forest flagged {anom_pct:.1f}% of records as anomalous based on unusual multidimensional patterns."
            
            if anom_pct > 10:
                risk_indicators.append(f"A high percentage ({anom_pct:.1f}%) of records were flagged as anomalous.")
                recommendations.append("Verify if the high anomaly rate is due to recent operational changes or sensor drift.")
            else:
                key_findings.append(f"Only {anom_pct:.1f}% of records were anomalous, suggesting relatively stable operations.")
            
            recommendations.append("Investigate the specific anomalous records to identify potential equipment faults or data errors.")

        # 6. Clustering Insights
        if task_type == "clustering":
            n_clusters = metrics.get("n_clusters", 0)
            sil = metrics.get("silhouette_score", 0)
            cluster_dist = results.get("cluster_distribution", [])
            
            executive_summary = f"Clustering analysis segmented the data into {n_clusters} distinct operational groups."
            if sil != "N/A" and isinstance(sil, (int, float)):
                if sil > 0.5:
                    model_interpretation = f"The KMeans model found well-separated clusters (Silhouette Score: {sil:.3f})."
                else:
                    model_interpretation = f"The clusters have some overlap (Silhouette Score: {sil:.3f}), indicating gradual transitions between states."
                    
            if cluster_dist:
                largest = max(cluster_dist, key=lambda x: x["count"])
                smallest = min(cluster_dist, key=lambda x: x["count"])
                total = sum(c["count"] for c in cluster_dist)
                
                key_findings.append(f"Cluster {largest['cluster']} is the largest, containing {largest['count']/total*100:.1f}% of observations, likely representing the dominant operating pattern.")
                if largest['cluster'] != smallest['cluster']:
                    key_findings.append(f"Cluster {smallest['cluster']} is the smallest with {smallest['count']/total*100:.1f}% of observations, potentially representing rare operating modes.")

        # Final Fallback
        if not executive_summary:
            executive_summary = f"Analysis completed successfully using {algo}."
        if not recommendations:
            recommendations.append("Review the charts to understand feature distributions better.")
            recommendations.append("Consider testing alternative algorithms to compare performance.")

        return {
            "executive_summary": executive_summary,
            "key_findings": key_findings,
            "risk_indicators": risk_indicators,
            "recommendations": recommendations,
            "model_interpretation": model_interpretation
        }
