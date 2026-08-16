import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../common/Card';
import { Server, Zap, Wind } from 'lucide-react';

interface DigitalTwinViewProps {
  twinState: any;
}

export const DigitalTwinView: React.FC<DigitalTwinViewProps> = ({ twinState }) => {
  if (!twinState) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        Connecting to Digital Twin...
      </div>
    );
  }

  const factory = twinState.factory_state;
  const machines = twinState.machines;

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-lg text-slate-100 flex items-center gap-2">
          <Server className="w-5 h-5 text-teal-400" />
          {twinState.twin_name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Factory Level Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <p className="text-xs text-slate-400 uppercase tracking-wider">Production</p>
              <p className="text-xl font-bold text-slate-200 mt-1">{factory.total_production.toLocaleString()}</p>
           </div>
           <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <p className="text-xs text-slate-400 uppercase tracking-wider">Energy Consumed</p>
              <p className="text-xl font-bold text-yellow-400 mt-1">{factory.total_energy_consumption.toLocaleString()} kWh</p>
           </div>
           <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <p className="text-xs text-slate-400 uppercase tracking-wider">CO2 Emissions</p>
              <p className="text-xl font-bold text-rose-400 mt-1">{factory.total_co2_emission.toLocaleString()} kg</p>
           </div>
           <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <p className="text-xs text-slate-400 uppercase tracking-wider">OEE</p>
              <p className="text-xl font-bold text-emerald-400 mt-1">{factory.overall_equipment_effectiveness}%</p>
           </div>
        </div>

        {/* Machine Level Details */}
        <div>
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <SettingsIcon className="w-4 h-4" /> Connected Assets
          </h3>
          <div className="space-y-3">
            {Object.entries(machines).map(([id, machine]: [string, any]) => (
              <div key={id} className="flex items-center justify-between p-3 bg-slate-950/50 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${machine.status === 'idle' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                  <span className="font-medium text-slate-200">{id}</span>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <span className="flex items-center gap-1 text-slate-400"><Zap className="w-4 h-4 text-yellow-500/70"/> {machine.base_power_kW} kW</span>
                  <span className="flex items-center gap-1 text-slate-400"><Wind className="w-4 h-4 text-blue-500/70"/> {machine.temperature}°C</span>
                  <span className="flex items-center gap-1 text-emerald-400">{machine.efficiency}% Eff</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="text-xs text-slate-500 text-right">
          Last sync: {new Date(twinState.last_updated).toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  );
};

const SettingsIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);
