from typing import Dict, Any, List
from backend.simulation.formula_engine import FormulaEngine
from backend.simulation.digital_twin import get_digital_twin

class ScenarioEngine:
    """
    Core engine that orchestrates simulations and handles various simulation modes.
    """

    def __init__(self):
        self.twin = get_digital_twin()
        self.formula = FormulaEngine()

    def run_simulation(self, mode: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Runs a specific simulation mode based on input parameters.
        """
        result = {}
        
        if mode == "production_growth":
            result = self._simulate_production_growth(parameters)
        elif mode == "machine_efficiency":
            result = self._simulate_machine_efficiency(parameters)
        elif mode == "renewable_energy":
            result = self._simulate_renewable_energy(parameters)
        elif mode == "shift_planning":
            result = self._simulate_shift_planning(parameters)
        elif mode == "demand_forecast":
            result = self._simulate_demand_forecast(parameters)
        elif mode == "carbon_reduction":
            result = self._simulate_carbon_reduction(parameters)
        elif mode == "cost_optimization":
            result = self._simulate_cost_optimization(parameters)
        elif mode == "capacity_planning":
            result = self._simulate_capacity_planning(parameters)
        else:
            raise ValueError(f"Unknown simulation mode: {mode}")

        # Update the twin after a successful simulation run (optional depending on if it's a persistent scenario or just What-If)
        # For what-if analysis, we usually return the delta without modifying the base twin, or we apply it to a cloned twin.
        # We will return the result and let the service layer decide if it updates the digital twin.
        
        return {
            "mode": mode,
            "parameters": parameters,
            "results": result
        }

    def _simulate_production_growth(self, params: Dict[str, Any]) -> Dict[str, Any]:
        growth_percentage = params.get("growth_percentage", 0.0)
        base_state = self.twin.get_state()["factory_state"]
        
        growth_impact = self.formula.calculate_production_growth_impact(
            current_production=base_state["total_production"],
            growth_percentage=growth_percentage,
            current_energy=base_state["total_energy_consumption"]
        )
        
        # Estimate new emissions
        new_emissions = self.formula.emission(growth_impact["new_energy"])
        
        # Calculate deltas
        return {
            "predicted_energy": growth_impact["new_energy"],
            "predicted_co2": new_emissions,
            "predicted_production": growth_impact["new_production"],
            "energy_delta": growth_impact["new_energy"] - base_state["total_energy_consumption"],
            "co2_delta": new_emissions - base_state["total_co2_emission"]
        }

    def _simulate_machine_efficiency(self, params: Dict[str, Any]) -> Dict[str, Any]:
        machine_id = params.get("machine_id", "CNC-01")
        new_efficiency = params.get("efficiency", 100.0)
        
        # Mocking the impact: higher efficiency means lower energy for the same production.
        base_state = self.twin.get_state()["factory_state"]
        # Simplified model: 10% efficiency gain = 5% energy reduction for that machine's share
        # Assuming machine consumes 30% of total energy
        machine_energy_share = 0.3
        efficiency_delta = new_efficiency - 85.0 # baseline 85
        
        energy_reduction_pct = (efficiency_delta * 0.5) / 100.0
        new_energy = base_state["total_energy_consumption"] * (1 - (machine_energy_share * energy_reduction_pct))
        
        return {
            "predicted_energy": new_energy,
            "predicted_co2": self.formula.emission(new_energy),
            "energy_savings": base_state["total_energy_consumption"] - new_energy
        }

    def _simulate_renewable_energy(self, params: Dict[str, Any]) -> Dict[str, Any]:
        renewable_percentage = params.get("renewable_percentage", 0.0)
        base_state = self.twin.get_state()["factory_state"]
        
        new_co2 = self.formula.carbon_footprint_with_renewables(
            total_energy=base_state["total_energy_consumption"],
            renewable_percentage=renewable_percentage
        )
        
        grid_consumption = base_state["total_energy_consumption"] * (1 - (renewable_percentage/100))
        solar_usage = base_state["total_energy_consumption"] * (renewable_percentage/100)
        
        # Assuming solar is cheaper than grid
        grid_tariff = 0.15
        solar_cost = 0.05
        new_cost = self.formula.cost(grid_consumption, grid_tariff) + self.formula.cost(solar_usage, solar_cost)
        old_cost = self.formula.cost(base_state["total_energy_consumption"], grid_tariff)
        
        return {
            "grid_consumption": grid_consumption,
            "solar_usage": solar_usage,
            "predicted_co2": new_co2,
            "co2_reduction": base_state["total_co2_emission"] - new_co2,
            "cost_savings": old_cost - new_cost
        }

    def _simulate_shift_planning(self, params: Dict[str, Any]) -> Dict[str, Any]:
        shifts = params.get("shifts", 2)
        base_state = self.twin.get_state()["factory_state"]
        
        # Base is 2 shifts. 3 shifts means 50% more time
        multiplier = shifts / 2.0
        
        return {
            "predicted_production": base_state["total_production"] * multiplier,
            "power_demand": base_state["total_energy_consumption"] * multiplier, # linear assumption
            "energy_cost": self.formula.cost(base_state["total_energy_consumption"] * multiplier, 0.12) # avg tariff
        }

    def _simulate_demand_forecast(self, params: Dict[str, Any]) -> Dict[str, Any]:
        expected_production = params.get("expected_production", 5000)
        base_state = self.twin.get_state()["factory_state"]
        
        if base_state["total_production"] == 0:
            ratio = 1.0
        else:
            ratio = expected_production / base_state["total_production"]
            
        new_energy = base_state["total_energy_consumption"] * ratio
        
        return {
            "predicted_energy": new_energy,
            "predicted_co2": self.formula.emission(new_energy),
            "predicted_cost": self.formula.cost(new_energy, 0.15)
        }

    def _simulate_carbon_reduction(self, params: Dict[str, Any]) -> Dict[str, Any]:
        target_reduction_pct = params.get("target_reduction_pct", 10.0)
        base_state = self.twin.get_state()["factory_state"]
        
        current_co2 = base_state["total_co2_emission"]
        target_co2 = current_co2 * (1 - (target_reduction_pct / 100.0))
        
        # Suggest changes required to hit target
        # E.g., we need to increase renewable percentage
        required_renewable_pct = (target_reduction_pct) # 1:1 ratio if grid emission factor is uniform
        
        return {
            "target_co2": target_co2,
            "suggested_renewable_percentage": required_renewable_pct,
            "estimated_cost_impact": -(target_reduction_pct * 100) # placeholder for cost savings
        }

    def _simulate_cost_optimization(self, params: Dict[str, Any]) -> Dict[str, Any]:
        # Simple heuristic optimization logic
        base_state = self.twin.get_state()["factory_state"]
        
        # Shifting 20% load to off-peak reduces cost by 10%
        optimized_cost = self.formula.cost(base_state["total_energy_consumption"], 0.15) * 0.9
        
        return {
            "optimized_cost": optimized_cost,
            "savings": self.formula.cost(base_state["total_energy_consumption"], 0.15) - optimized_cost,
            "recommendation": "Shift 20% of high-load operations to off-peak hours (10PM - 6AM)."
        }

    def _simulate_capacity_planning(self, params: Dict[str, Any]) -> Dict[str, Any]:
        # What is the max production safe limit?
        base_state = self.twin.get_state()["factory_state"]
        max_utilization = params.get("max_safe_utilization", 90.0)
        
        # Assume base state is at 70% utilization
        current_utilization = 70.0
        max_multiplier = max_utilization / current_utilization
        
        max_production = base_state["total_production"] * max_multiplier
        max_energy = base_state["total_energy_consumption"] * max_multiplier
        
        return {
            "maximum_production": max_production,
            "expected_energy_requirement": max_energy,
            "carbon_footprint": self.formula.emission(max_energy),
            "equipment_stress": "High" if max_utilization > 85 else "Normal"
        }
