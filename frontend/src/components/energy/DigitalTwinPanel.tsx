import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../common/Card';
import { Box, Factory, Cpu, Zap, CloudRain, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface MachineData {
  id: string;
  name: string;
  status: 'healthy' | 'warning' | 'overloaded';
  powerUsage: number;
  efficiency: number;
  temperature: number;
  emission: number;
}

interface DigitalTwinPanelProps {
  machines: MachineData[];
}

const statusColors = {
  healthy: 'border-green-500 bg-green-500/10 text-green-400',
  warning: 'border-yellow-500 bg-yellow-500/10 text-yellow-400',
  overloaded: 'border-red-500 bg-red-500/10 text-red-400',
};

const statusIcons = {
  healthy: <CheckCircle className="w-4 h-4 text-green-500" />,
  warning: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
  overloaded: <XCircle className="w-4 h-4 text-red-500" />,
};

const MachineNode = ({ data }: { data: MachineData }) => (
  <div className={`relative p-3 rounded-xl border-2 transition-colors ${statusColors[data.status]} w-48 shrink-0`}>
    <div className="flex justify-between items-start mb-2">
      <div className="flex items-center gap-2">
        <Cpu className="w-5 h-5 opacity-80" />
        <span className="font-semibold text-sm truncate">{data.name}</span>
      </div>
      {statusIcons[data.status]}
    </div>
    
    <div className="space-y-1 text-xs opacity-80 mt-3">
      <div className="flex justify-between">
        <span>Power</span>
        <span className="font-mono">{data.powerUsage} kW</span>
      </div>
      <div className="flex justify-between">
        <span>Efficiency</span>
        <span className="font-mono">{data.efficiency}%</span>
      </div>
      <div className="flex justify-between">
        <span>Temp</span>
        <span className="font-mono">{data.temperature}°C</span>
      </div>
      <div className="flex justify-between">
        <span>CO₂</span>
        <span className="font-mono">{data.emission} kg</span>
      </div>
    </div>
    
    {/* Animated glowing dots representing data flow */}
    <motion.div 
      className={`absolute -right-3 top-1/2 w-2 h-2 rounded-full ${data.status === 'healthy' ? 'bg-green-400' : data.status === 'warning' ? 'bg-yellow-400' : 'bg-red-400'}`}
      animate={{ opacity: [0, 1, 0], scale: [1, 1.5, 1], x: [0, 20, 40] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
    />
  </div>
);

export const DigitalTwinPanel: React.FC<DigitalTwinPanelProps> = ({ machines }) => {
  return (
    <Card className="bg-slate-900 border-slate-800 h-full">
      <CardHeader className="bg-slate-900/50 border-b border-slate-800 pb-4">
        <CardTitle className="text-lg text-slate-100 flex items-center gap-2">
          <Factory className="w-5 h-5 text-indigo-400" />
          Live Digital Twin
        </CardTitle>
        <p className="text-sm text-slate-400 mt-1">Real-time energy and carbon flow simulation.</p>
      </CardHeader>
      
      <CardContent className="p-6 overflow-hidden relative">
        {/* Abstract flow diagram */}
        <div className="flex flex-col gap-12 relative min-w-max">
          
          {/* Incoming Power */}
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-xl border border-slate-700 bg-slate-800 flex flex-col items-center">
              <Zap className="w-8 h-8 text-yellow-400 mb-2" />
              <span className="text-xs font-semibold text-slate-300">Energy Source</span>
            </div>
            
            {/* Connecting line */}
            <div className="flex-1 h-1 bg-gradient-to-r from-yellow-500/50 to-blue-500/50 relative overflow-hidden rounded">
              <motion.div 
                className="absolute top-0 bottom-0 left-0 w-1/3 bg-white/40 blur-[2px]"
                animate={{ x: ['-100%', '300%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
            </div>
          </div>
          
          {/* Machine Line */}
          <div className="flex items-center gap-8 px-12 relative">
            <div className="absolute left-0 right-0 top-1/2 h-1 bg-blue-500/20 -z-10 rounded"></div>
            {machines.map((machine, i) => (
              <React.Fragment key={machine.id}>
                <MachineNode data={machine} />
                {i < machines.length - 1 && (
                  <div className="flex-1 min-w-[2rem]"></div>
                )}
              </React.Fragment>
            ))}
          </div>
          
          {/* Output & Emissions */}
          <div className="flex items-center gap-4 justify-end">
            <div className="flex-1 h-1 bg-gradient-to-r from-blue-500/50 to-green-500/50 relative overflow-hidden rounded">
               <motion.div 
                className="absolute top-0 bottom-0 left-0 w-1/3 bg-white/40 blur-[2px]"
                animate={{ x: ['-100%', '300%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
            </div>
            <div className="p-4 rounded-xl border border-green-500/30 bg-green-500/10 flex flex-col items-center mr-8">
              <Box className="w-8 h-8 text-green-400 mb-2" />
              <span className="text-xs font-semibold text-slate-300">Final Output</span>
            </div>
            
            <div className="w-16 h-1 bg-slate-700 relative overflow-hidden rounded -rotate-45 transform origin-right">
              <motion.div 
                className="absolute top-0 bottom-0 left-0 w-1/3 bg-red-400/40 blur-[2px]"
                animate={{ x: ['-100%', '300%'] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
              />
            </div>
            
            <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 flex flex-col items-center -mt-16">
              <CloudRain className="w-8 h-8 text-red-400 mb-2" />
              <span className="text-xs font-semibold text-slate-300">Emissions</span>
            </div>
          </div>
          
        </div>
      </CardContent>
    </Card>
  );
};
