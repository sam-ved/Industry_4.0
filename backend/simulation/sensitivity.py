from typing import Dict, Any, List
from backend.simulation.scenario_engine import ScenarioEngine
import numpy as np

class SensitivityAnalysis:
    """
    Determines which parameter most influences Energy, Emission, and Cost.
    Ranks parameters to show feature importance.
    """
    
    def __init__(self):
        self.engine = ScenarioEngine()

    def analyze(self, mode: str, base_params: Dict[str, Any], target_metric: str) -> Dict[str, Any]:
        """
        Runs one-at-a-time (OAT) sensitivity analysis on the parameters.
        """
        base_result = self.engine.run_simulation(mode, base_params)["results"]
        
        if target_metric not in base_result:
            return {"error": f"Target metric {target_metric} not found in simulation results."}
            
        base_target_val = base_result[target_metric]
        if base_target_val == 0:
            return {"error": "Base target value is 0, cannot compute relative sensitivity."}

        importance = {}
        perturbation = 0.10 # +/- 10%
        
        for param_name, param_val in base_params.items():
            if not isinstance(param_val, (int, float)):
                continue
                
            # Perturb up
            params_up = base_params.copy()
            params_up[param_name] = param_val * (1 + perturbation)
            res_up = self.engine.run_simulation(mode, params_up)["results"]
            val_up = res_up.get(target_metric, base_target_val)
            
            # Perturb down
            params_down = base_params.copy()
            params_down[param_name] = param_val * (1 - perturbation)
            res_down = self.engine.run_simulation(mode, params_down)["results"]
            val_down = res_down.get(target_metric, base_target_val)
            
            # Calculate sensitivity index (Elasticity)
            # % change in output / % change in input
            delta_out = abs(val_up - val_down) / base_target_val
            delta_in = 2 * perturbation
            
            sensitivity_index = delta_out / delta_in
            importance[param_name] = sensitivity_index
            
        # Rank parameters by importance
        ranked_importance = dict(sorted(importance.items(), key=lambda item: item[1], reverse=True))
        
        return {
            "target_metric": target_metric,
            "feature_importance": ranked_importance
        }
