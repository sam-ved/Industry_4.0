import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../common/Card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Activity, BarChart2 } from 'lucide-react';

interface VisualizationsProps {
  timelineData: any[];
}

const darkTooltipStyle = {
  contentStyle: {
    background: 'rgba(11,20,35,0.95)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: '#CBD5E1',
  },
  itemStyle: { color: '#CBD5E1' },
};

export const AdvancedVisualizations: React.FC<VisualizationsProps> = ({ timelineData }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Load Curve */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="bg-slate-900/50 border-b border-slate-800">
          <CardTitle className="text-sm text-slate-200 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            Power Load Curve (24h)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timelineData}>
              <defs>
                <linearGradient id="colorKw" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="time" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip {...darkTooltipStyle} />
              <Area type="monotone" dataKey="kw" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorKw)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Carbon Emission Breakdown */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="bg-slate-900/50 border-b border-slate-800">
          <CardTitle className="text-sm text-slate-200 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-red-400" />
            Emissions by Source
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={timelineData.slice(0, 5)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" stroke="#64748B" fontSize={12} />
              <YAxis dataKey="time" type="category" stroke="#64748B" fontSize={12} width={60} />
              <Tooltip {...darkTooltipStyle} />
              <Bar dataKey="co2" fill="#EF4444" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
