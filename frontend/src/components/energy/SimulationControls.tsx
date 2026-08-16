import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../common/Card';
import { Sliders, Zap, Factory, Clock, Sun, Plug, DollarSign } from 'lucide-react';

export interface SimulationParams {
  productionVolume: number;
  machineUtilization: number;
  machineEfficiency: number;
  workingHours: number;
  renewableEnergy: number;
  gridDependency: number;
  energyTariff: number;
  motorLoad: number;
  boilerLoad: number;
  compressedAir: number;
  coolingSystem: number;
  lighting: number;
}

interface SimulationControlsProps {
  params: SimulationParams;
  onChange: (key: keyof SimulationParams, value: number) => void;
}

const SliderControl = ({ 
  label, 
  value, 
  min, 
  max, 
  unit, 
  icon: Icon,
  onChange 
}: { 
  label: string; 
  value: number; 
  min: number; 
  max: number; 
  unit: string;
  icon: any;
  onChange: (val: number) => void;
}) => (
  <div className="space-y-3">
    <div className="flex justify-between items-center text-sm">
      <label className="font-medium text-slate-300 flex items-center gap-2">
        <Icon className="w-4 h-4 text-blue-400" />
        {label}
      </label>
      <span className="text-blue-400 font-bold bg-blue-500/10 px-2 py-1 rounded">
        {unit === 'currency' ? `₹${value}/kWh` : `${value}${unit}`}
      </span>
    </div>
    <input 
      type="range" 
      min={min} max={max} 
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full accent-blue-500 bg-slate-800 rounded-lg appearance-none h-2 cursor-pointer"
    />
  </div>
);

export const SimulationControls: React.FC<SimulationControlsProps> = ({ params, onChange }) => {
  return (
    <Card className="bg-slate-900 border-slate-800 h-full overflow-hidden flex flex-col">
      <CardHeader className="bg-slate-900/50 border-b border-slate-800 pb-4">
        <CardTitle className="text-lg text-slate-100 flex items-center gap-2">
          <Sliders className="w-5 h-5 text-blue-400" />
          Interactive Simulation Controls
        </CardTitle>
        <p className="text-sm text-slate-400 mt-1">Adjust parameters to see instant digital twin updates.</p>
      </CardHeader>
      <CardContent className="space-y-6 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">Production & Operations</h3>
            <SliderControl label="Production Volume" value={params.productionVolume} min={0} max={10000} unit=" Units" icon={Factory} onChange={(v) => onChange('productionVolume', v)} />
            <SliderControl label="Machine Utilization" value={params.machineUtilization} min={40} max={100} unit="%" icon={Sliders} onChange={(v) => onChange('machineUtilization', v)} />
            <SliderControl label="Machine Efficiency" value={params.machineEfficiency} min={50} max={100} unit="%" icon={Zap} onChange={(v) => onChange('machineEfficiency', v)} />
            <SliderControl label="Working Hours" value={params.workingHours} min={4} max={24} unit="h" icon={Clock} onChange={(v) => onChange('workingHours', v)} />
          </div>
          <div className="space-y-6">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">Energy & Grid</h3>
            <SliderControl label="Renewable Energy" value={params.renewableEnergy} min={0} max={100} unit="%" icon={Sun} onChange={(v) => onChange('renewableEnergy', v)} />
            <SliderControl label="Grid Dependency" value={params.gridDependency} min={0} max={100} unit="%" icon={Plug} onChange={(v) => onChange('gridDependency', v)} />
            <SliderControl label="Energy Tariff" value={params.energyTariff} min={3} max={20} unit="currency" icon={DollarSign} onChange={(v) => onChange('energyTariff', v)} />
          </div>
        </div>

        <div className="pt-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">Load Distribution</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SliderControl label="Motor Load" value={params.motorLoad} min={0} max={100} unit="%" icon={Zap} onChange={(v) => onChange('motorLoad', v)} />
            <SliderControl label="Boiler Load" value={params.boilerLoad} min={0} max={100} unit="%" icon={Zap} onChange={(v) => onChange('boilerLoad', v)} />
            <SliderControl label="Compressed Air" value={params.compressedAir} min={0} max={100} unit="%" icon={Zap} onChange={(v) => onChange('compressedAir', v)} />
            <SliderControl label="Cooling System" value={params.coolingSystem} min={0} max={100} unit="%" icon={Zap} onChange={(v) => onChange('coolingSystem', v)} />
            <SliderControl label="Lighting" value={params.lighting} min={0} max={100} unit="%" icon={Zap} onChange={(v) => onChange('lighting', v)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
