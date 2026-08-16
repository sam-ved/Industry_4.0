from typing import Dict, Any, List
from datetime import datetime

class DigitalTwin:
    """
    Lightweight Digital Twin for Industrial Processes.
    Represents the real-time simulation state of the Factory, Machines, Production, and Energy flow.
    """
    
    def __init__(self, name: str = "Primary Factory Twin"):
        self.name = name
        self.last_updated = datetime.utcnow()
        self.machines: Dict[str, Dict[str, Any]] = {}
        self.factory_state: Dict[str, Any] = {
            "total_production": 0,
            "total_energy_consumption": 0.0,
            "total_co2_emission": 0.0,
            "renewable_percentage": 0.0,
            "overall_equipment_effectiveness": 0.0,
        }
        self.scenarios_run = 0

    def add_machine(self, machine_id: str, capacity: float, base_power_kW: float, efficiency: float = 100.0):
        self.machines[machine_id] = {
            "capacity": capacity,
            "base_power_kW": base_power_kW,
            "efficiency": efficiency,
            "status": "idle",
            "current_load": 0.0,
            "temperature": 25.0
        }
        self._update_timestamp()

    def update_machine_state(self, machine_id: str, updates: Dict[str, Any]):
        if machine_id in self.machines:
            self.machines[machine_id].update(updates)
            self._update_timestamp()

    def update_factory_state(self, updates: Dict[str, Any]):
        self.factory_state.update(updates)
        self.scenarios_run += 1
        self._update_timestamp()

    def get_state(self) -> Dict[str, Any]:
        return {
            "twin_name": self.name,
            "last_updated": self.last_updated.isoformat(),
            "factory_state": self.factory_state,
            "machines": self.machines,
            "scenarios_run": self.scenarios_run
        }
        
    def _update_timestamp(self):
        self.last_updated = datetime.utcnow()

# A global instance to act as the single source of truth for the digital twin in memory
_digital_twin_instance = None

def get_digital_twin() -> DigitalTwin:
    global _digital_twin_instance
    if _digital_twin_instance is None:
        _digital_twin_instance = DigitalTwin()
        # Initialize with some default mock machines for the demo
        _digital_twin_instance.add_machine("CNC-01", capacity=1000, base_power_kW=50, efficiency=85.0)
        _digital_twin_instance.add_machine("CONVEYOR-MAIN", capacity=5000, base_power_kW=15, efficiency=95.0)
        _digital_twin_instance.add_machine("HVAC-01", capacity=0, base_power_kW=120, efficiency=70.0)
        
        _digital_twin_instance.update_factory_state({
            "total_production": 5000,
            "total_energy_consumption": 15000.0, # kWh
            "total_co2_emission": 7500.0, # kg
            "renewable_percentage": 10.0,
            "overall_equipment_effectiveness": 78.5,
        })
    return _digital_twin_instance
