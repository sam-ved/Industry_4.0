import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../common/Card';
import { Layers, Plus, Copy, Trash2, CheckCircle2 } from 'lucide-react';
import { SimulationParams } from './SimulationControls';

export interface Scenario {
  id: string;
  name: string;
  params: SimulationParams;
}

interface ScenarioManagerProps {
  scenarios: Scenario[];
  activeScenarioId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

export const ScenarioManager: React.FC<ScenarioManagerProps> = ({
  scenarios,
  activeScenarioId,
  onSelect,
  onAdd,
  onDuplicate,
  onDelete
}) => {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="bg-slate-900/50 border-b border-slate-800 pb-4">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg text-slate-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              Production Scenario Builder
            </CardTitle>
            <p className="text-sm text-slate-400 mt-1">Create and compare unlimited operating scenarios.</p>
          </div>
          <button 
            onClick={onAdd}
            className="p-2 bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> New
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex gap-3 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700">
        {scenarios.map(scenario => {
          const isActive = scenario.id === activeScenarioId;
          return (
            <div 
              key={scenario.id} 
              className={`flex-shrink-0 w-64 p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between h-24 ${
                isActive ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
              }`}
              onClick={() => onSelect(scenario.id)}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  {isActive && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                  <span className={`font-semibold text-sm ${isActive ? 'text-indigo-200' : 'text-slate-300'}`}>
                    {scenario.name}
                  </span>
                </div>
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => onDuplicate(scenario.id)} className="p-1 text-slate-400 hover:text-blue-400" title="Duplicate">
                    <Copy className="w-3 h-3" />
                  </button>
                  {scenarios.length > 1 && (
                    <button onClick={() => onDelete(scenario.id)} className="p-1 text-slate-400 hover:text-red-400" title="Delete">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="text-xs text-slate-500 flex gap-3">
                <span>Prod: {scenario.params.productionVolume}</span>
                <span>Eff: {scenario.params.machineEfficiency}%</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
