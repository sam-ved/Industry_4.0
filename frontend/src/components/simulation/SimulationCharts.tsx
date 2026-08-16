import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../common/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity } from 'lucide-react';

interface SimulationChartsProps {
  results: any;
  baseState: any;
}

export const SimulationCharts: React.FC<SimulationChartsProps> = ({ results, baseState }) => {
  if (!results || !baseState) return null;

  // Transform data for charting (e.g., comparison between Base and Simulated)
  const comparisonData = [
    {
      name: 'Energy (kWh)',
      Base: baseState.total_energy_consumption,
      Simulated: results.predicted_energy || baseState.total_energy_consumption,
    },
    {
      name: 'Emissions (kg CO2)',
      Base: baseState.total_co2_emission,
      Simulated: results.predicted_co2 || baseState.total_co2_emission,
    },
    {
      name: 'Production (units)',
      Base: baseState.total_production,
      Simulated: results.predicted_production || baseState.total_production,
    }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-lg text-slate-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400" />
            Scenario Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#f8fafc' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Legend />
                <Bar dataKey="Base" fill="#64748b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Simulated" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Additional charts can be added here based on mode, e.g. Sensitivity Tornado, Monte Carlo Distribution */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-lg text-slate-100">Key Performance Indicators</CardTitle>
        </CardHeader>
        <CardContent>
           <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800">
                <p className="text-sm text-slate-400">Energy Delta</p>
                <p className={`text-2xl font-bold ${results.energy_delta < 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {results.energy_delta ? `${results.energy_delta > 0 ? '+' : ''}${results.energy_delta.toFixed(2)}` : '0.00'} kWh
                </p>
              </div>
              <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800">
                <p className="text-sm text-slate-400">CO2 Delta</p>
                <p className={`text-2xl font-bold ${results.co2_delta < 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {results.co2_delta ? `${results.co2_delta > 0 ? '+' : ''}${results.co2_delta.toFixed(2)}` : '0.00'} kg
                </p>
              </div>
              <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800">
                <p className="text-sm text-slate-400">Cost Savings</p>
                <p className={`text-2xl font-bold text-green-400`}>
                  ${results.cost_savings ? results.cost_savings.toFixed(2) : '0.00'}
                </p>
              </div>
              <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800">
                <p className="text-sm text-slate-400">Efficiency Shift</p>
                <p className="text-2xl font-bold text-blue-400">
                  {results.energy_savings ? `+${(results.energy_savings / baseState.total_energy_consumption * 100).toFixed(1)}%` : '0.0%'}
                </p>
              </div>
           </div>
        </CardContent>
      </Card>
    </div>
  );
};
