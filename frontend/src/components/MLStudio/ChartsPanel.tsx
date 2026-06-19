import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
  ScatterChart, Scatter, CartesianGrid, Legend,
} from 'recharts';
import { BarChart2, Activity, PieChart as PieIcon, GitBranch, TrendingUp, Grid3X3 } from 'lucide-react';

const CHART_COLORS = ['#06B6D4', '#3B82F6', '#8B5CF6', '#10B981', '#F97316', '#EF4444', '#F59E0B', '#EC4899'];

const darkTooltipStyle = {
  contentStyle: {
    background: 'rgba(11,20,35,0.95)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    fontSize: '12px',
    color: '#CBD5E1',
  },
  itemStyle: { color: '#CBD5E1' },
  labelStyle: { color: '#F9FAFB', fontWeight: 600 },
};

interface ChartsPanelProps {
  results: any;
}

export default function ChartsPanel({ results }: ChartsPanelProps) {
  if (!results) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Feature Importance */}
      {results.feature_importance && (
        <ChartCard icon={<BarChart2 size={15} className="text-[#3B82F6]" />} title="Feature Importance">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={results.feature_importance} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#94A3B8', fontSize: 11 }} width={90} axisLine={false} tickLine={false} />
              <Tooltip {...darkTooltipStyle} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={16}>
                {results.feature_importance.map((_: any, i: number) => (
                  <Cell key={i} fill={`url(#featureGrad)`} />
                ))}
              </Bar>
              <defs>
                <linearGradient id="featureGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#06B6D4" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Confusion Matrix */}
      {results.confusion_matrix && (
        <ChartCard icon={<Grid3X3 size={15} className="text-[#10B981]" />} title="Confusion Matrix">
          <ConfusionMatrixGrid
            matrix={results.confusion_matrix}
            labels={results.class_names}
          />
        </ChartCard>
      )}

      {/* ROC Curve */}
      {results.roc_curve && (
        <ChartCard icon={<TrendingUp size={15} className="text-[#8B5CF6]" />} title={`ROC Curve (AUC = ${results.roc_curve.auc})`}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={results.roc_curve.fpr.map((fpr: number, i: number) => ({
              fpr, tpr: results.roc_curve.tpr[i],
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="fpr" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} label={{ value: 'False Positive Rate', position: 'insideBottom', offset: -2, fill: '#64748B', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} label={{ value: 'True Positive Rate', angle: -90, position: 'insideLeft', fill: '#64748B', fontSize: 11 }} />
              <Tooltip {...darkTooltipStyle} />
              <Line type="monotone" dataKey="tpr" stroke="#8B5CF6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="fpr" stroke="rgba(255,255,255,0.15)" strokeWidth={1} strokeDasharray="4 4" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Prediction Distribution */}
      {results.prediction_distribution && (
        <ChartCard icon={<PieIcon size={15} className="text-[#F97316]" />} title="Prediction Distribution">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={results.prediction_distribution}
                dataKey="count"
                nameKey="label"
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={55}
                paddingAngle={2}
                strokeWidth={0}
              >
                {results.prediction_distribution.map((_: any, i: number) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip {...darkTooltipStyle} />
              <Legend
                wrapperStyle={{ fontSize: '11px', color: '#94A3B8' }}
                iconType="circle"
                iconSize={8}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Correlation Heatmap */}
      {results.correlation_matrix && (
        <ChartCard icon={<Activity size={15} className="text-[#06B6D4]" />} title="Correlation Heatmap" wide>
          <CorrelationHeatmap matrix={results.correlation_matrix} />
        </ChartCard>
      )}

      {/* Predictions vs Actual (regression scatter) */}
      {results.predictions_vs_actual && (
        <ChartCard icon={<GitBranch size={15} className="text-[#10B981]" />} title="Predictions vs Actual">
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="actual" name="Actual" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} />
              <YAxis dataKey="predicted" name="Predicted" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} />
              <Tooltip {...darkTooltipStyle} />
              <Scatter data={results.predictions_vs_actual} fill="#10B981" fillOpacity={0.6} />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Cluster Scatter */}
      {results.cluster_scatter && (
        <ChartCard icon={<GitBranch size={15} className="text-[#F97316]" />} title="Cluster Plot (PCA 2D)">
          <ClusterScatter data={results.cluster_scatter} />
        </ChartCard>
      )}

      {/* Anomaly Scatter */}
      {results.anomaly_scatter && (
        <ChartCard icon={<Activity size={15} className="text-[#EF4444]" />} title="Anomaly Plot (PCA 2D)">
          <AnomalyScatter data={results.anomaly_scatter} />
        </ChartCard>
      )}
    </div>
  );
}


// ─── Sub-components ──────────────────────────────────────────────────────────

function ChartCard({ icon, title, children, wide }: { icon: React.ReactNode; title: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={`flex min-w-0 flex-col gap-3 rounded-xl border p-5 ${wide ? 'lg:col-span-2' : ''}`}
      style={{ background: 'rgba(11,20,35,0.6)', borderColor: 'rgba(255,255,255,0.08)' }}>
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="font-semibold text-xs text-[#F9FAFB]">{title}</h3>
      </div>
      {children}
    </div>
  );
}


function ConfusionMatrixGrid({ matrix, labels }: { matrix: number[][]; labels?: string[] }) {
  const maxVal = Math.max(...matrix.flat());

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-center border-collapse">
        {labels && (
          <thead>
            <tr>
              <th className="p-2 text-[10px] text-[#475569]" />
              {labels.map((l, i) => (
                <th key={i} className="p-2 text-[10px] text-[#94A3B8] font-medium">{l}</th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {matrix.map((row, i) => (
            <tr key={i}>
              {labels && (
                <td className="p-2 text-[10px] text-[#94A3B8] font-medium">{labels[i]}</td>
              )}
              {row.map((val, j) => {
                const isDiag = i === j;
                const intensity = maxVal > 0 ? val / maxVal : 0;
                return (
                  <td key={j} className="p-3 text-sm font-semibold border"
                    style={{
                      borderColor: 'rgba(255,255,255,0.06)',
                      background: isDiag
                        ? `rgba(16,185,129,${0.08 + intensity * 0.2})`
                        : `rgba(239,68,68,${intensity * 0.12})`,
                      color: isDiag ? '#10B981' : '#F9FAFB',
                    }}
                  >
                    {val}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


function CorrelationHeatmap({ matrix }: { matrix: { columns: string[]; data: number[][] } }) {
  const { columns, data } = matrix;
  const size = Math.min(columns.length, 15); // Cap display

  const getColor = (val: number) => {
    if (val >= 0.7) return 'rgba(16,185,129,0.5)';
    if (val >= 0.4) return 'rgba(6,182,212,0.35)';
    if (val >= 0.0) return 'rgba(59,130,246,0.15)';
    if (val >= -0.4) return 'rgba(249,115,22,0.2)';
    return 'rgba(239,68,68,0.35)';
  };

  return (
    <div className="overflow-x-auto">
      <table className="border-collapse text-center">
        <thead>
          <tr>
            <th className="p-1" />
            {columns.slice(0, size).map((col, i) => (
              <th key={i} className="p-1.5 text-[9px] text-[#64748B] font-medium max-w-[60px] truncate" title={col}>
                {col.length > 8 ? col.slice(0, 8) + '...' : col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.slice(0, size).map((row, i) => (
            <tr key={i}>
              <td className="p-1.5 text-[9px] text-[#64748B] font-medium text-right max-w-[70px] truncate" title={columns[i]}>
                {columns[i].length > 8 ? columns[i].slice(0, 8) + '...' : columns[i]}
              </td>
              {row.slice(0, size).map((val, j) => (
                <td key={j} className="p-2 text-[10px] font-mono border"
                  style={{
                    background: getColor(val),
                    borderColor: 'rgba(255,255,255,0.04)',
                    color: '#CBD5E1',
                    minWidth: '36px',
                  }}
                  title={`${columns[i]} x ${columns[j]} = ${val}`}
                >
                  {val.toFixed(1)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


function ClusterScatter({ data }: { data: { x: number; y: number; cluster: number }[] }) {
  const grouped = useMemo(() => {
    const map: Record<number, { x: number; y: number }[]> = {};
    data.forEach(d => {
      if (!map[d.cluster]) map[d.cluster] = [];
      map[d.cluster].push({ x: d.x, y: d.y });
    });
    return map;
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ScatterChart margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="x" name="PC1" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} />
        <YAxis dataKey="y" name="PC2" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} />
        <Tooltip {...darkTooltipStyle} />
        <Legend wrapperStyle={{ fontSize: '11px' }} iconType="circle" iconSize={8} />
        {Object.entries(grouped).map(([cluster, points], i) => (
          <Scatter
            key={cluster}
            name={`Cluster ${cluster}`}
            data={points}
            fill={CHART_COLORS[i % CHART_COLORS.length]}
            fillOpacity={0.7}
          />
        ))}
      </ScatterChart>
    </ResponsiveContainer>
  );
}


function AnomalyScatter({ data }: { data: { x: number; y: number; label: string }[] }) {
  const normal = data.filter(d => d.label === 'Normal');
  const anomaly = data.filter(d => d.label === 'Anomaly');

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ScatterChart margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="x" name="PC1" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} />
        <YAxis dataKey="y" name="PC2" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} />
        <Tooltip {...darkTooltipStyle} />
        <Legend wrapperStyle={{ fontSize: '11px' }} iconType="circle" iconSize={8} />
        <Scatter name="Normal" data={normal} fill="#10B981" fillOpacity={0.5} />
        <Scatter name="Anomaly" data={anomaly} fill="#EF4444" fillOpacity={0.8} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
