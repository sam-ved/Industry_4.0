from typing import Dict, Any, List
import scipy.optimize as optimize
from backend.simulation.formula_engine import FormulaEngine

class OptimizationEngine:
    """
    Implements optimization algorithms to find best scenarios.
    Objective: Minimize Energy, Emission, Cost or Maximize Production, Efficiency.
    Subject to constraints.
    """
    
    def __init__(self):
        self.formula = FormulaEngine()

    def optimize_production(self, current_production: float, max_production_limit: float, max_emission_limit: float, current_energy: float) -> Dict[str, Any]:
        """
        Maximizes production subject to an emission limit.
        """
        # Objective: minimize (-production) => maximize production
        def objective(x):
            return -x[0]

        # Constraint 1: Emissions <= max_emission_limit
        # emissions = energy * 0.5. 
        # energy = current_energy * (x[0] / current_production)
        def emission_constraint(x):
            energy = current_energy * (x[0] / current_production)
            emissions = self.formula.emission(energy)
            return max_emission_limit - emissions

        constraints = [{'type': 'ineq', 'fun': emission_constraint}]
        
        # Bounds: production between current and max_production_limit
        bounds = [(current_production, max_production_limit)]
        
        initial_guess = [current_production]
        
        result = optimize.minimize(objective, initial_guess, bounds=bounds, constraints=constraints)
        
        optimized_production = result.x[0]
        optimized_energy = current_energy * (optimized_production / current_production)
        
        return {
            "success": result.success,
            "optimized_production": optimized_production,
            "expected_energy": optimized_energy,
            "expected_emission": self.formula.emission(optimized_energy)
        }
