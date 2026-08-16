import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../common/Card';
import { SplitSquareHorizontal, TrendingDown, TrendingUp } from 'lucide-react';
import { Scenario } from './ScenarioManager';
import { KPIValues } from './RealTimeKPIs';

interface ScenarioComparisonProps {
  scenarios: Scenario[];
  results: Record<string, KPIValues>;
}

export const ScenarioComparison: React.FC<ScenarioComparisonProps> = ({ scenarios, results }) => {
  if (scenarios.length < 2) {
    return null;
  }

  const baseScenarioId = scenarios[0].id;
  const baseResult = results[baseScenarioId];

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="bg-slate-900/50 border-b border-slate-800">
        <CardTitle className="text-lg text-slate-100 flex items-center gap-2">
          <SplitSquareHorizontal className="w-5 h-5 text-indigo-400" />
          Scenario Comparison
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-300">
          <thead className="text-xs text-slate-400 uppercase bg-slate-800/50 border-b border-slate-700">
            <tr>
              <th className="px-6 py-4 font-medium">Metric</th>
              {scenarios.map(s => (
                <th key={s.id} className={`px-6 py-4 font-medium ${s.id === baseScenarioId ? 'text-indigo-300' : ''}`}>
                  {s.name} {s.id === baseScenarioId && '(Baseline)'}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {[
              { key: 'energyUsage', label: 'Energy (kWh)', reverseBad: false },
              { key: 'co2Emissions', label: 'CO₂ (kg)', reverseBad: false },
              { key: 'cost', label: 'Cost (₹)', reverseBad: false },
              { key: 'efficiency', label: 'Efficiency (%)', reverseBad: true },
            ].map(metric => (
              <tr key={metric.key} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-200">{metric.label}</td>
                {scenarios.map(s => {
                  const val = results[s.id]?.[metric.key as keyof KPIValues] || 0;
                  const baseVal = baseResult?.[metric.key as keyof KPIValues] || 0;
                  
                  let diff = 0;
                  if (baseVal !== 0 && s.id !== baseScenarioId) {
                    diff = ((val - baseVal) / baseVal) * 100;
                  }
                  
                  const isBetter = metric.reverseBad ? diff > 0 : diff < 0;
                  const isWorse = metric.reverseBad ? diff < 0 : diff > 0;

                  return (
                    <td key={s.id} className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-100">{val.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
                        {s.id !== baseScenarioId && diff !== 0 && (
                          <span className={`text-xs flex items-center gap-1 mt-1 ${isBetter ? 'text-green-400' : isWorse ? 'text-red-400' : 'text-slate-500'}`}>
                            {diff > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {Math.abs(diff).toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
};
