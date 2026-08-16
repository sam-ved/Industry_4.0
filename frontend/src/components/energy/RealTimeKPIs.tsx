import React from 'react';
import { Card, CardContent } from '../common/Card';
import { Zap, CloudRain, DollarSign, TrendingDown, Sun, Activity, Settings, TrendingUp } from 'lucide-react';

export interface KPIValues {
  energyUsage: number;
  co2Emissions: number;
  cost: number;
  efficiency: number;
  carbonReduction: number;
  savings: number;
  renewablePercentage: number;
  powerFactor: number;
}

interface RealTimeKPIsProps {
  kpis: KPIValues;
}

const KPICard = ({ title, value, unit, icon: Icon, colorClass, trend, trendValue }: any) => (
  <Card className="bg-slate-900 border-slate-800 overflow-hidden relative group">
    <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${colorClass} opacity-10 rounded-bl-full transition-transform group-hover:scale-110`} />
    <CardContent className="p-4">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">{title}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-100">{value.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
            <span className="text-sm font-medium text-slate-500">{unit}</span>
          </div>
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend === 'up' ? 'text-red-400' : 'text-green-400'}`}>
              {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        <div className={`p-2 rounded-lg bg-slate-800 border border-slate-700`}>
          <Icon className={`w-5 h-5 ${colorClass.split(' ')[0].replace('from-', 'text-')}`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

export const RealTimeKPIs: React.FC<RealTimeKPIsProps> = ({ kpis }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <KPICard 
        title="Energy Consumption" 
        value={kpis.energyUsage} 
        unit="kWh" 
        icon={Zap} 
        colorClass="from-blue-500 to-cyan-500"
        trend="down"
        trendValue="-2.4% vs prev"
      />
      <KPICard 
        title="CO₂ Emissions" 
        value={kpis.co2Emissions} 
        unit="kg" 
        icon={CloudRain} 
        colorClass="from-red-500 to-orange-500"
        trend="down"
        trendValue="-5.1% vs prev"
      />
      <KPICard 
        title="Operational Cost" 
        value={kpis.cost} 
        unit="₹" 
        icon={DollarSign} 
        colorClass="from-emerald-500 to-teal-500"
        trend="down"
        trendValue="₹1,200 saved"
      />
      <KPICard 
        title="Efficiency Score" 
        value={kpis.efficiency} 
        unit="%" 
        icon={Activity} 
        colorClass="from-purple-500 to-indigo-500"
        trend="up"
        trendValue="+1.2% improvement"
      />
      <KPICard 
        title="Carbon Reduction" 
        value={kpis.carbonReduction} 
        unit="tons" 
        icon={TrendingDown} 
        colorClass="from-green-500 to-emerald-500"
      />
      <KPICard 
        title="Expected Savings" 
        value={kpis.savings} 
        unit="₹/yr" 
        icon={DollarSign} 
        colorClass="from-yellow-400 to-orange-500"
      />
      <KPICard 
        title="Renewable Share" 
        value={kpis.renewablePercentage} 
        unit="%" 
        icon={Sun} 
        colorClass="from-amber-400 to-yellow-500"
      />
      <KPICard 
        title="Power Factor" 
        value={kpis.powerFactor} 
        unit="" 
        icon={Settings} 
        colorClass="from-cyan-400 to-blue-500"
      />
    </div>
  );
};
