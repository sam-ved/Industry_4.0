from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List
from backend.simulation.simulation_service import SimulationService
from backend.schemas.responses import StandardResponse

router = APIRouter(prefix="/api/v1/simulation", tags=["Simulation Engine"])

def get_simulation_service():
    return SimulationService()

@router.get("/twin/state", response_model=StandardResponse)
async def get_digital_twin_state(service: SimulationService = Depends(get_simulation_service)):
    try:
        state = service.get_digital_twin_state()
        return StandardResponse(status="success", message="Digital twin state retrieved", data=state)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/run", response_model=StandardResponse)
async def run_simulation_scenario(request: Dict[str, Any], service: SimulationService = Depends(get_simulation_service)):
    try:
        mode = request.get("mode")
        parameters = request.get("parameters", {})
        if not mode:
            raise HTTPException(status_code=400, detail="Simulation mode is required.")
            
        results = service.run_scenario(mode, parameters)
        return StandardResponse(status="success", message="Simulation run completed", data=results)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/monte-carlo", response_model=StandardResponse)
async def run_monte_carlo(request: Dict[str, Any], service: SimulationService = Depends(get_simulation_service)):
    try:
        mode = request.get("mode")
        parameters = request.get("parameters", {})
        iterations = request.get("iterations", 1000)
        
        if not mode:
            raise HTTPException(status_code=400, detail="Simulation mode is required.")
            
        results = service.run_monte_carlo(mode, parameters, iterations)
        return StandardResponse(status="success", message="Monte Carlo simulation completed", data=results)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sensitivity", response_model=StandardResponse)
async def run_sensitivity(request: Dict[str, Any], service: SimulationService = Depends(get_simulation_service)):
    try:
        mode = request.get("mode")
        parameters = request.get("parameters", {})
        target_metric = request.get("target_metric")
        
        if not mode or not target_metric:
            raise HTTPException(status_code=400, detail="Mode and target_metric are required.")
            
        results = service.run_sensitivity_analysis(mode, parameters, target_metric)
        return StandardResponse(status="success", message="Sensitivity analysis completed", data=results)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ai-explanation", response_model=StandardResponse)
async def get_ai_explanation(request: Dict[str, Any], service: SimulationService = Depends(get_simulation_service)):
    try:
        results = request.get("results")
        if not results:
             raise HTTPException(status_code=400, detail="Simulation results are required for AI explanation.")
        
        explanation = await service.generate_ai_explanation(results)
        return StandardResponse(status="success", message="AI explanation generated", data=explanation)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/optimize", response_model=StandardResponse)
async def optimize_scenario(request: Dict[str, Any], service: SimulationService = Depends(get_simulation_service)):
    try:
        current_prod = request.get("current_production", 0)
        max_prod = request.get("max_production_limit", 10000)
        max_emission = request.get("max_emission_limit", 5000)
        current_energy = request.get("current_energy", 0)
        
        results = service.optimize(current_prod, max_prod, max_emission, current_energy)
        return StandardResponse(status="success", message="Optimization completed", data=results)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
