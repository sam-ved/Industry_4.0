from typing import Dict, Any, List

class InsightService:
    """
    Generates industrial insights from model results (bottlenecks, high variance parameters, etc.).
    """

    @staticmethod
    def generate_industrial_insights(results: Dict[str, Any]) -> List[Dict[str, Any]]:
        insights = []
        task_type = results.get("task_type")
        stats = results.get("dataset_stats", {})
        features = results.get("feature_importance", [])
        energy_stats = results.get("energy_analytics", {})
        prod_stats = results.get("production_analytics", {})
        
        # 1. Energy Analysis
        if "highest_consumer" in energy_stats:
            insights.append({
                "category": "Energy",
                "title": "High Energy Consumption",
                "description": f"Machine '{energy_stats['highest_consumer']}' is the highest energy consumer in this cohort.",
                "severity": "high"
            })
            
        if energy_stats.get("efficiency_index", 100) < 60:
            insights.append({
                "category": "Energy",
                "title": "Low Efficiency Detected",
                "description": "Overall energy efficiency is below 60%. Optimization is required.",
                "severity": "critical"
            })

        # 2. Production & Bottlenecks
        if prod_stats.get("loss_percentage", 0) > 10:
            insights.append({
                "category": "Production",
                "title": "High Production Loss",
                "description": f"Estimated production loss is currently {prod_stats.get('loss_percentage')}%.",
                "severity": "critical"
            })
            
        if "bottleneck_machine" in prod_stats:
            insights.append({
                "category": "Production",
                "title": "Production Bottleneck",
                "description": f"Identified bottleneck at {prod_stats['bottleneck_machine']}.",
                "severity": "high"
            })

        # 3. Model & Feature Level Insights
        if features:
            top_feature = features[0]["name"]
            insights.append({
                "category": "Model",
                "title": "Critical KPI Identified",
                "description": f"Parameter '{top_feature}' has the highest variance impact on the target variable.",
                "severity": "medium"
            })

        # 4. Task Specific Insights
        if task_type == "classification":
            dist = results.get("prediction_distribution", [])
            if dist:
                top_class = sorted(dist, key=lambda x: x["count"], reverse=True)[0]
                insights.append({
                    "category": "Maintenance",
                    "title": "Failure Hotspot",
                    "description": f"The most frequent operational state/failure mode is '{top_class['label']}' ({top_class['count']} occurrences).",
                    "severity": "high"
                })
        elif task_type == "anomaly":
            metrics = results.get("metrics", {})
            anomalies = metrics.get("anomalies_detected", 0)
            if anomalies > 0:
                insights.append({
                    "category": "Maintenance",
                    "title": "Abnormal Sensors Detected",
                    "description": f"Detected {anomalies} abnormal behavior instances requiring immediate inspection.",
                    "severity": "critical"
                })
                
        if not insights:
            insights.append({
                "category": "General",
                "title": "Stable Operations",
                "description": "No critical failure hotspots or bottlenecks were detected in this dataset.",
                "severity": "low"
            })
            
        return insights
