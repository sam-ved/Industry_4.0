import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { SimulationControls, SimulationParams } from './SimulationControls';
import { RealTimeKPIs, KPIValues } from './RealTimeKPIs';
import { DigitalTwinPanel } from './DigitalTwinPanel';
import { ScenarioManager, Scenario } from './ScenarioManager';
import { AdvancedVisualizations } from './AdvancedVisualizations';
import { ScenarioComparison } from './ScenarioComparison';

interface EnergyResult {
  total_kwh_today: number;
  peak_kwh: number;
  avg_kwh: number;
  efficiency_score: number;
}

interface SimulationWorkspaceProps {
  analyzedData: EnergyResult;
}

export const SimulationWorkspace: React.FC<SimulationWorkspaceProps> = ({ analyzedData }) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [activeScenarioId, setActiveScenarioId] = useState('');
  const [results, setResults] = useState<Record<string, KPIValues>>({});
  const [timelineData, setTimelineData] = useState<any[]>([]);

  // Initialize the baseline scenario based on analyzedData
  useEffect(() => {
    if (scenarios.length === 0 && analyzedData) {
      const baselineParams: SimulationParams = {
        productionVolume: 5000,
        machineUtilization: 85,
        machineEfficiency: analyzedData.efficiency_score || 82,
        workingHours: 16,
        renewableEnergy: 20,
        gridDependency: 80,
        energyTariff: 8,
        motorLoad: 75,
        boilerLoad: 60,
        compressedAir: 50,
        coolingSystem: 65,
        lighting: 20
      };
      
      const baselineId = 'baseline';
      setScenarios([{ id: baselineId, name: 'Current Plant', params: baselineParams }]);
      setActiveScenarioId(baselineId);
    }
  }, [analyzedData, scenarios.length]);

  const activeScenario = scenarios.find(s => s.id === activeScenarioId);

  const simulateScenario = useCallback(async (scenario: Scenario) => {
    setIsSimulating(true);
    try {
      const { params } = scenario;
      const baseEnergy = (params.productionVolume * 2.5) * (100 / params.machineEfficiency);
      const renewableReduction = (baseEnergy * params.renewableEnergy) / 100;
      const finalEnergy = baseEnergy - renewableReduction;
      
      const co2 = (finalEnergy * params.gridDependency / 100) * 0.85; 
      const cost = finalEnergy * params.energyTariff;
      
      const kpis: KPIValues = {
        energyUsage: finalEnergy,
        co2Emissions: co2,
        cost: cost,
        efficiency: params.machineEfficiency,
        carbonReduction: renewableReduction * 0.85 / 1000,
        savings: renewableReduction * params.energyTariff,
        renewablePercentage: params.renewableEnergy,
        powerFactor: 0.92 + (params.machineEfficiency / 1000)
      };

      setResults(prev => ({ ...prev, [scenario.id]: kpis }));

      if (scenario.id === activeScenarioId) {
        const newTimeline = Array.from({ length: 24 }).map((_, i) => {
          const isWorkingHour = i >= 6 && i < (6 + params.workingHours);
          const loadMultiplier = isWorkingHour ? (params.machineUtilization / 100) : 0.1;
          const kw = (finalEnergy / 24) * loadMultiplier;
          return {
            time: `${String(i).padStart(2, '0')}:00`,
            kw: kw,
            co2: kw * (params.gridDependency / 100) * 0.85
          };
        });
        setTimelineData(newTimeline);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSimulating(false);
    }
  }, [activeScenarioId]);

  useEffect(() => {
    if (activeScenario) {
      const timeoutId = setTimeout(() => {
        simulateScenario(activeScenario);
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [activeScenario?.params, activeScenario, simulateScenario]);

  const handleParamChange = (key: keyof SimulationParams, value: number) => {
    setScenarios(prev => prev.map(s => 
      s.id === activeScenarioId 
        ? { ...s, params: { ...s.params, [key]: value } }
        : s
    ));
  };

  const addScenario = () => {
    if (!activeScenario) return;
    const newId = Math.random().toString(36).substr(2, 9);
    setScenarios(prev => [...prev, { id: newId, name: `Scenario ${prev.length + 1}`, params: { ...activeScenario.params } }]);
    setActiveScenarioId(newId);
  };

  const duplicateScenario = (id: string) => {
    const toCopy = scenarios.find(s => s.id === id);
    if (!toCopy) return;
    const newId = Math.random().toString(36).substr(2, 9);
    setScenarios(prev => [...prev, { id: newId, name: `${toCopy.name} (Copy)`, params: { ...toCopy.params } }]);
    setActiveScenarioId(newId);
  };

  const deleteScenario = (id: string) => {
    setScenarios(prev => {
      const filtered = prev.filter(s => s.id !== id);
      if (activeScenarioId === id && filtered.length > 0) setActiveScenarioId(filtered[0].id);
      return filtered;
    });
  };

  const getMachineData = () => {
    if (!activeScenario) return [];
    const eff = activeScenario.params.machineEfficiency;
    const util = activeScenario.params.machineUtilization;
    const stat = (eff < 60 || util > 95) ? 'overloaded' : eff < 80 ? 'warning' : 'healthy';

    return [
      { id: '1', name: 'Extruder Alpha', status: stat, powerUsage: 124.5, efficiency: eff, temperature: 185, emission: 45 },
      { id: '2', name: 'Molding Beta', status: 'healthy' as any, powerUsage: 89.2, efficiency: 92, temperature: 140, emission: 32 },
      { id: '3', name: 'Assembly Line C', status: 'warning' as any, powerUsage: 210.4, efficiency: 75, temperature: 65, emission: 88 },
    ];
  };

  if (!activeScenario) return null;

  return (
    <div className="mt-12 border-t border-slate-800 pt-8 pb-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            Simulation Workspace
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-indigo-500/20 text-indigo-400 border border-indigo-500/20">
              Interactive
            </span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Running live digital twin simulation initialized from your analyzed dataset.
          </p>
        </div>
        {isSimulating && (
          <div className="flex items-center gap-2 text-indigo-400 text-sm font-medium">
            <RefreshCw className="w-4 h-4 animate-spin" /> Live Sync
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {/* Top Row: Scenario Manager */}
        <ScenarioManager 
          scenarios={scenarios} 
          activeScenarioId={activeScenarioId} 
          onSelect={setActiveScenarioId}
          onAdd={addScenario}
          onDuplicate={duplicateScenario}
          onDelete={deleteScenario}
        />

        <div className="flex flex-col xl:flex-row gap-4">
          {/* Left Sidebar: Interactive Controls */}
          <div className="w-full xl:w-[400px] shrink-0">
             <SimulationControls params={activeScenario.params} onChange={handleParamChange} />
          </div>

          {/* Main Stage */}
          <div className="flex-1 space-y-4">
            {results[activeScenarioId] && (
              <RealTimeKPIs kpis={results[activeScenarioId]} />
            )}
            <DigitalTwinPanel machines={getMachineData()} />
            <AdvancedVisualizations timelineData={timelineData} />
            <ScenarioComparison scenarios={scenarios} results={results} />
          </div>
        </div>
      </div>
    </div>
  );
};
