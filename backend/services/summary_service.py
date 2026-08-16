from typing import Dict, Any, List
import math

class SummaryService:
    """
    Generates a comprehensive executive summary for industrial AI models.
    """

    @staticmethod
    def generate_executive_summary(results: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parses the model results to construct an Executive Summary payload.
        """
        algorithm = results.get("algorithm", "Unknown Model")
        task_type = results.get("task_type", "Unknown Task")
        stats = results.get("dataset_stats", {})
        metrics = results.get("metrics", {})
        kpis = results.get("industrial_kpis", {})
        health_score = results.get("health_score", {})
        
        # Dataset Summary
        rows = stats.get("rows", 0)
        cols = stats.get("columns", 0)
        missing_values = sum(stats.get("missing_values", {}).values())
        
        # Business Objective
        objective_map = {
            "regression": "Predict continuous industrial parameters for optimization and forecasting.",
            "classification": "Classify operational states to identify defects, failures, or operational modes.",
            "clustering": "Segment operational data to identify hidden patterns and groupings.",
            "anomaly": "Detect abnormal machine behaviors and potential failure modes."
        }
        business_objective = objective_map.get(task_type, "Provide data-driven insights for industrial optimization.")
        
        # Performance Evaluation
        performance = "Average"
        if task_type == "classification":
            acc = metrics.get("accuracy", 0)
            if acc >= 0.90: performance = "Excellent"
            elif acc >= 0.80: performance = "Good"
            elif acc < 0.60: performance = "Poor"
        elif task_type == "regression":
            r2 = metrics.get("r2", 0)
            if r2 >= 0.85: performance = "Excellent"
            elif r2 >= 0.70: performance = "Good"
            elif r2 < 0.40: performance = "Poor"
            
        # Data Quality
        data_quality_score = 100
        if rows > 0:
            missing_ratio = missing_values / (rows * cols)
            data_quality_score -= (missing_ratio * 200) # Heavy penalty for missing
            data_quality_score = max(0, min(100, int(data_quality_score)))
            
        data_quality_issues = []
        if missing_values > 0:
            data_quality_issues.append(f"{missing_values} missing values detected across dataset.")
        if data_quality_score < 70:
            data_quality_issues.append("Data quality is sub-optimal and may affect model reliability.")
        if not data_quality_issues:
            data_quality_issues.append("No significant data quality issues detected.")
            
        # Prediction Reliability
        reliability_score = health_score.get("model_health", 75)
        reliability = "High" if reliability_score >= 85 else "Medium" if reliability_score >= 70 else "Low"
        
        # Industrial Interpretation & Business Impact
        impact = "Potential for significant operational improvement through data-driven decisions."
        if task_type == "regression":
            impact = "Enables precise forecasting to minimize waste and optimize resource allocation."
        elif task_type == "classification":
            impact = "Reduces downtime by accurately classifying failure modes and defects."
        elif task_type == "anomaly":
            impact = "Prevents catastrophic failures by providing early warning of abnormal conditions."
            
        # Important Features
        important_features = results.get("feature_importance", [])
        top_features = [f["name"] for f in important_features[:3]] if important_features else ["N/A"]

        # Expected Improvements
        expected_improvements = [
            "Enhanced visibility into operational metrics.",
            f"Improved decision making using the {algorithm} model."
        ]
        
        # Conclusion
        conclusion = f"The {algorithm} model achieved a {performance.lower()} performance level for {task_type}. "
        if performance in ["Excellent", "Good"]:
            conclusion += "The model is deemed reliable for assisting in production environments, pending domain expert review."
        else:
            conclusion += "Further tuning or data augmentation is recommended before production deployment."

        return {
            "dataset_summary": {
                "total_records": rows,
                "total_features": cols,
                "data_quality_score": data_quality_score,
                "issues": data_quality_issues
            },
            "business_objective": business_objective,
            "model_performance": {
                "algorithm": algorithm,
                "performance_tier": performance,
                "prediction_reliability": reliability,
                "reliability_score": reliability_score
            },
            "business_impact": impact,
            "key_drivers": top_features,
            "expected_improvements": expected_improvements,
            "executive_conclusion": conclusion
        }
