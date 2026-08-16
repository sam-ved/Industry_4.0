from typing import Dict, Any, List

class InsightAndReasoningEngine:
    @staticmethod
    def generate_insights(results: Dict[str, Any]) -> List[str]:
        """
        Generates intelligent findings based on quantitative evidence.
        """
        insights = []
        task_type = results.get("task_type")
        correlations = results.get("correlation_matrix", {})
        feature_importance = results.get("feature_importance", [])
        
        # Simulated reasoning based on feature importance
        if feature_importance:
            top_f = feature_importance[0]
            name = top_f["name"].lower()
            val = abs(top_f["value"])
            if val > 0.3:
                # Add reasoning
                if "temp" in name:
                    insights.append(f"Production efficiency decreases significantly when '{top_f['name']}' fluctuates, indicating thermal instability.")
                elif "press" in name:
                    insights.append(f"Pressure variation in '{top_f['name']}' is highly correlated with unstable output.")
                elif "vib" in name:
                    insights.append(f"Machine vibration ('{top_f['name']}') is the strongest predictor of defects.")
                elif "energy" in name or "power" in name:
                    insights.append(f"High variance in '{top_f['name']}' suggests inconsistent machine load during operating cycles.")
                else:
                    insights.append(f"'{top_f['name']}' is the dominant factor driving the current prediction model, explaining {val*100:.1f}% of variance.")

        # Correlation insights
        if correlations and "data" in correlations:
            cols = correlations["columns"]
            data = correlations["data"]
            found = False
            for i in range(len(cols)):
                if found: break
                for j in range(i + 1, len(cols)):
                    val = data[i][j]
                    if val > 0.8:
                        c1, c2 = cols[i].lower(), cols[j].lower()
                        if "idle" in c1 or "idle" in c2:
                            insights.append(f"Idle time is highly correlated ({val:.2f}) with {cols[j] if 'idle' in c1 else cols[i]}, suggesting operational bottlenecks.")
                            found = True
                            break
                        elif "energy" in c1 or "power" in c1:
                            insights.append(f"Energy consumption is strictly tied ({val:.2f}) to {cols[j]}, indicating load-dependent power draw.")
                            found = True
                            break

        if task_type == "clustering":
            cluster_dist = results.get("cluster_distribution", [])
            if cluster_dist:
                largest = max(cluster_dist, key=lambda x: x["count"])
                smallest = min(cluster_dist, key=lambda x: x["count"])
                insights.append(f"Cluster {largest['cluster']} contains {largest['count']} machines/events, representing the normal operational baseline.")
                if largest['cluster'] != smallest['cluster']:
                    insights.append(f"Cluster {smallest['cluster']} machines require preventive maintenance due to anomalous groupings.")
                    
        if not insights:
            insights.append("System is operating within standard parameters. No critical bottlenecks detected.")

        return insights
