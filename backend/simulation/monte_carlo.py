import random
import numpy as np
from typing import Dict, Any, List
from backend.simulation.scenario_engine import ScenarioEngine

class MonteCarloSimulation:
    """
    Generates thousands of possible operating scenarios to provide 
    Confidence Intervals, Worst/Best Cases, and Risk Scores.
    """
    
    def __init__(self):
        self.engine = ScenarioEngine()

    def run(self, base_mode: str, base_params: Dict[str, Any], iterations: int = 1000) -> Dict[str, Any]:
        """
        Runs Monte Carlo simulation by adding stochastic noise to the base parameters.
        """
        results = []
        
        # Determine which parameters to randomize based on mode
        for _ in range(iterations):
            randomized_params = self._randomize_parameters(base_mode, base_params)
            sim_result = self.engine.run_simulation(base_mode, randomized_params)
            results.append(sim_result["results"])
            
        return self._aggregate_results(results)

    def _randomize_parameters(self, mode: str, base_params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Add Gaussian noise to the base parameters.
        """
        params = base_params.copy()
        
        # E.g., if mode is production_growth, vary the growth_percentage slightly
        if "growth_percentage" in params:
            # vary by +/- 2%
            params["growth_percentage"] += random.gauss(0, 2)
            
        if "efficiency" in params:
            params["efficiency"] += random.gauss(0, 5) # efficiency varies slightly
            params["efficiency"] = min(max(params["efficiency"], 0), 100) # clip 0-100
            
        if "expected_production" in params:
            params["expected_production"] += random.gauss(0, params["expected_production"] * 0.05)
            
        return params

    def _aggregate_results(self, results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Aggregates list of result dictionaries to extract statistics.
        """
        if not results:
            return {}
            
        keys_to_aggregate = [k for k, v in results[0].items() if isinstance(v, (int, float))]
        
        aggregated = {
            "iterations": len(results),
            "statistics": {}
        }
        
        for key in keys_to_aggregate:
            values = [r[key] for r in results]
            
            mean_val = np.mean(values)
            std_val = np.std(values)
            
            aggregated["statistics"][key] = {
                "mean": mean_val,
                "median": np.median(values),
                "min": np.min(values),
                "max": np.max(values),
                "p5": np.percentile(values, 5),
                "p95": np.percentile(values, 95),
                "std_dev": std_val
            }
            
        # Calculate a generic risk score (variance over mean)
        # Using the first aggregated key as the primary metric for risk
        if keys_to_aggregate:
            primary_key = keys_to_aggregate[0]
            stats = aggregated["statistics"][primary_key]
            if stats["mean"] != 0:
                risk_score = (stats["std_dev"] / stats["mean"]) * 100
                aggregated["risk_score"] = min(risk_score, 100) # 0-100 scale
            else:
                aggregated["risk_score"] = 0
                
        return aggregated
