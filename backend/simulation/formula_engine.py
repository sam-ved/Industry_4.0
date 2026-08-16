class FormulaEngine:
    """
    Implements industrial engineering formulas wherever ML prediction is unavailable.
    """
    
    @staticmethod
    def specific_energy_consumption(total_energy: float, total_production: float) -> float:
        if total_production == 0:
            return 0.0
        return total_energy / total_production

    @staticmethod
    def energy_intensity(energy: float, unit_output: float) -> float:
        if unit_output == 0:
            return 0.0
        return energy / unit_output

    @staticmethod
    def emission(energy: float, emission_factor: float = 0.5) -> float:
        """Calculate CO2 emission. Default emission factor ~ 0.5 kg CO2 per kWh (depends on grid)."""
        return energy * emission_factor

    @staticmethod
    def cost(energy: float, tariff: float) -> float:
        return energy * tariff

    @staticmethod
    def efficiency(useful_output: float, input_energy: float) -> float:
        if input_energy == 0:
            return 0.0
        return min((useful_output / input_energy) * 100.0, 100.0)

    @staticmethod
    def power_demand(load: float, operating_hours: float) -> float:
        return load * operating_hours

    @staticmethod
    def carbon_footprint_with_renewables(
        total_energy: float, 
        renewable_percentage: float, 
        grid_emission_factor: float = 0.5
    ) -> float:
        """
        Calculates CO2 emissions considering renewable energy contribution.
        Renewable energy is assumed to have 0 emissions.
        """
        grid_energy = total_energy * (1.0 - (renewable_percentage / 100.0))
        return grid_energy * grid_emission_factor

    @staticmethod
    def machine_temperature_impact(
        base_efficiency: float, 
        machine_temp: float, 
        optimal_temp: float = 75.0,
        degradation_factor: float = 0.5
    ) -> float:
        """
        Calculates efficiency drop when machine temperature exceeds optimal.
        For every degree above optimal, efficiency drops by degradation_factor %.
        """
        if machine_temp <= optimal_temp:
            return base_efficiency
        
        temp_diff = machine_temp - optimal_temp
        efficiency_drop = temp_diff * degradation_factor
        return max(base_efficiency - efficiency_drop, 0.0)

    @staticmethod
    def calculate_production_growth_impact(
        current_production: float,
        growth_percentage: float,
        current_energy: float
    ) -> dict:
        """
        Estimates the impact of production growth using linear scaling (simplified).
        """
        new_production = current_production * (1.0 + (growth_percentage / 100.0))
        new_energy = current_energy * (1.0 + (growth_percentage / 100.0)) # Linear assumption
        return {
            "new_production": new_production,
            "new_energy": new_energy,
            "sec": FormulaEngine.specific_energy_consumption(new_energy, new_production)
        }
