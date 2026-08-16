from typing import Dict, Any, List
from backend.simulation.scenario_engine import ScenarioEngine
from backend.simulation.monte_carlo import MonteCarloSimulation
from backend.simulation.sensitivity import SensitivityAnalysis
from backend.simulation.optimization import OptimizationEngine
from backend.simulation.digital_twin import get_digital_twin

class SimulationService:
    def __init__(self):
        self.scenario_engine = ScenarioEngine()
        self.monte_carlo = MonteCarloSimulation()
        self.sensitivity = SensitivityAnalysis()
        self.optimization = OptimizationEngine()
        self.twin = get_digital_twin()

    def run_scenario(self, mode: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Runs a basic simulation scenario.
        """
        return self.scenario_engine.run_simulation(mode, parameters)

    def run_monte_carlo(self, mode: str, parameters: Dict[str, Any], iterations: int = 1000) -> Dict[str, Any]:
        """
        Runs Monte Carlo simulation for risk analysis.
        """
        return self.monte_carlo.run(mode, parameters, iterations)

    def run_sensitivity_analysis(self, mode: str, parameters: Dict[str, Any], target_metric: str) -> Dict[str, Any]:
        """
        Runs sensitivity analysis to identify key drivers.
        """
        return self.sensitivity.analyze(mode, parameters, target_metric)

    def optimize(self, current_production: float, max_production: float, max_emission: float, current_energy: float) -> Dict[str, Any]:
        """
        Runs optimization based on constraints.
        """
        return self.optimization.optimize_production(current_production, max_production, max_emission, current_energy)

    def get_digital_twin_state(self) -> Dict[str, Any]:
        """
        Retrieves the current state of the Digital Twin.
        """
        return self.twin.get_state()

    async def generate_ai_explanation(self, simulation_results: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generates an AI explanation of the simulation results like an Energy Consultant.
        """
        try:
            from groq import AsyncGroq
            import os
            client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY"))
            
            prompt = f"""
            You are a Principal AI Solutions Architect and Energy Consultant.
            Analyze the following industrial simulation results:
            {simulation_results}
            
            Provide a professional explanation detailing:
            1. Why energy/emissions changed
            2. Root cause
            3. Engineering interpretation
            4. Financial/Operational implications
            5. Recommended actions (with expected savings, priority, and implementation difficulty)
            
            You MUST respond with a valid JSON object matching exactly this structure:
            {{
              "explanation": "Detailed explanation here...",
              "root_cause": "Detailed root cause analysis here...",
              "implications": "Detailed implications here...",
              "recommendations": [
                {{
                  "action": "Action text",
                  "expected_savings": "Savings text",
                  "priority": "High",
                  "difficulty": "Easy"
                }}
              ]
            }}
            Do not include any other keys. Do not include markdown formatting.
            """
            
            response = await client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="llama-3.1-8b-instant",
                response_format={"type": "json_object"}
            )
            import json
            return json.loads(response.choices[0].message.content)
            
        except Exception as e:
            # Fallback if API fails
            return {
                "explanation": f"AI explanation unavailable: {str(e)}",
                "root_cause": "Simulation parameter change",
                "implications": "Requires manual review",
                "recommendations": [
                    {
                        "action": "Review simulation inputs manually.",
                        "expected_savings": "Unknown",
                        "priority": "Low",
                        "difficulty": "Easy"
                    }
                ]
            }
