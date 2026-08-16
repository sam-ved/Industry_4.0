import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../common/Card';
import { Play, TrendingUp, Zap, Factory, Target, Settings, DollarSign, Clock } from 'lucide-react';

interface ScenarioBuilderProps {
  onRunSimulation: (mode: string, parameters: any) => void;
  isLoading: boolean;
}

const MODES = [
  { id: 'production_growth', label: 'Production Growth', icon: TrendingUp },
  { id: 'machine_efficiency', label: 'Machine Efficiency', icon: Settings },
  { id: 'renewable_energy', label: 'Renewable Energy', icon: Zap },
  { id: 'shift_planning', label: 'Shift Planning', icon: Clock },
  { id: 'demand_forecast', label: 'Demand Forecast', icon: Factory },
  { id: 'carbon_reduction', label: 'Carbon Reduction', icon: Target },
  { id: 'cost_optimization', label: 'Cost Optimization', icon: DollarSign },
];

export const ScenarioBuilder: React.FC<ScenarioBuilderProps> = ({ onRunSimulation, isLoading }) => {
  const [selectedMode, setSelectedMode] = useState(MODES[0].id);
  const [params, setParams] = useState<any>({
    growth_percentage: 10,
    efficiency: 95,
    renewable_percentage: 50,
    shifts: 3,
    expected_production: 6000,
    target_reduction_pct: 20
  });

  const handleParamChange = (key: string, value: string | number) => {
    setParams({ ...params, [key]: Number(value) });
  };

  const renderInputs = () => {
    switch (selectedMode) {
      case 'production_growth':
        return (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-300">Growth Percentage (%)</label>
            <input 
              type="range" 
              min="1" max="100" 
              value={params.growth_percentage}
              onChange={(e) => handleParamChange('growth_percentage', e.target.value)}
              className="w-full accent-blue-500"
            />
            <div className="text-right text-blue-400 font-bold">{params.growth_percentage}%</div>
          </div>
        );
      case 'machine_efficiency':
        return (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-300">Target Efficiency (%)</label>
            <input 
              type="range" 
              min="50" max="100" 
              value={params.efficiency}
              onChange={(e) => handleParamChange('efficiency', e.target.value)}
              className="w-full accent-green-500"
            />
            <div className="text-right text-green-400 font-bold">{params.efficiency}%</div>
          </div>
        );
      case 'renewable_energy':
        return (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-300">Renewable Energy Share (%)</label>
            <input 
              type="range" 
              min="0" max="100" 
              value={params.renewable_percentage}
              onChange={(e) => handleParamChange('renewable_percentage', e.target.value)}
              className="w-full accent-yellow-500"
            />
            <div className="text-right text-yellow-400 font-bold">{params.renewable_percentage}%</div>
          </div>
        );
      // Fallback for others
      default:
        return (
          <div className="p-4 bg-slate-800 rounded-lg text-slate-400 text-sm">
            Configure parameters for {MODES.find(m => m.id === selectedMode)?.label}...
          </div>
        );
    }
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-lg text-slate-100 flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-400" />
          Scenario Builder
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {MODES.map((mode) => {
            const Icon = mode.icon;
            const isSelected = selectedMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setSelectedMode(mode.id)}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                  isSelected 
                    ? 'bg-blue-500/20 border-blue-500 text-blue-400' 
                    : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs font-medium text-center">{mode.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-6 bg-slate-950/50 rounded-xl border border-slate-800">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Parameters</h3>
          {renderInputs()}
        </div>

        <button 
          onClick={() => onRunSimulation(selectedMode, params)}
          disabled={isLoading}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          {isLoading ? (
            <span className="animate-pulse">Simulating...</span>
          ) : (
            <>
              <Play className="w-5 h-5" />
              Run Simulation
            </>
          )}
        </button>
      </CardContent>
    </Card>
  );
};
