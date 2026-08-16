import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
  ScatterChart, Scatter, CartesianGrid, Legend, ReferenceLine
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
  if (!results || !results.visualizations) return null;
  const viz = results.visualizations;

  const regressionDomain = useMemo(() => {
    if (!viz.actual_vs_predicted || viz.actual_vs_predicted.length === 0) return [0, 0];
    const vals = viz.actual_vs_predicted.flatMap((d: any) => [d.actual, d.predicted]).filter((v: any) => typeof v === 'number' && !isNaN(v));
    if (vals.length === 0) return [0, 0];
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const pad = Math.max(0.1, (max - min) * 0.05);
    return [Math.floor(min - pad), Math.ceil(max + pad)];
  }, [viz.actual_vs_predicted]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

      {/* Confusion Matrix */}
      {viz.confusion_matrix && (
        <ChartCard 
          icon={<Grid3X3 size={15} className="text-[#10B981]" />} 
          title="Confusion Matrix"
          description="Compares predicted vs actual categories. The diagonal cells (green) indicate correct predictions, while off-diagonal cells (red) are misclassifications."
        >
          <ConfusionMatrixGrid
            matrix={viz.confusion_matrix.matrix}
            labels={viz.confusion_matrix.classes}
          />
        </ChartCard>
      )}

      {/* ROC Curve */}
      {viz.roc_curve && (
        <ChartCard 
          icon={<TrendingUp size={15} className="text-[#8B5CF6]" />} 
          title={`ROC Curve (AUC = ${viz.roc_curve.auc})`}
          description="Measures the model's ability to distinguish between classes. A curve closer to the top-left corner (higher AUC) represents better performance."
        >
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={viz.roc_curve.fpr.map((fpr: number, i: number) => ({
              fpr, tpr: viz.roc_curve.tpr[i],
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

      {/* Class Distribution */}
      {viz.class_distribution && (
        <ChartCard 
          icon={<PieIcon size={15} className="text-[#F97316]" />} 
          title="Class Distribution"
          description="A breakdown of how often the model predicted each outcome category across the dataset."
        >
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={viz.class_distribution}
                dataKey="count"
                nameKey="label"
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={55}
                paddingAngle={2}
                strokeWidth={0}
              >
                {viz.class_distribution.map((_: any, i: number) => (
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
        <ChartCard 
          icon={<Activity size={15} className="text-[#06B6D4]" />} 
          title="Correlation Heatmap" 
          wide
          description="Shows the linear relationship between different variables. Values closer to 1 (green) or -1 (red) indicate a strong correlation, while 0 (blue) indicates no correlation."
        >
          <CorrelationHeatmap matrix={results.correlation_matrix} />
        </ChartCard>
      )}

      {/* Predictions vs Actual (regression scatter) */}
      {viz.actual_vs_predicted && (
        <ChartCard 
          icon={<GitBranch size={15} className="text-[#10B981]" />} 
          title="Predictions vs Actual"
          description="Scatter plot comparing the model's predicted values against the actual true values. Points closer to the diagonal line represent accurate predictions."
        >
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart margin={{ top: 5, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="actual" type="number" name="Actual" domain={regressionDomain} tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} label={{ value: 'Actual Target', position: 'insideBottom', offset: -15, fill: '#64748B', fontSize: 11 }} />
              <YAxis dataKey="predicted" type="number" name="Predicted" domain={regressionDomain} tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} label={{ value: 'Predicted Target', angle: -90, position: 'insideLeft', offset: -10, fill: '#64748B', fontSize: 11 }} />
              <Tooltip {...darkTooltipStyle} />
              <Scatter data={viz.actual_vs_predicted.filter((d: any) => typeof d.actual === 'number' && !isNaN(d.actual) && typeof d.predicted === 'number' && !isNaN(d.predicted))} fill="#10B981" fillOpacity={0.6} />
              <ReferenceLine segment={[{ x: regressionDomain[0], y: regressionDomain[0] }, { x: regressionDomain[1], y: regressionDomain[1] }]} stroke="rgba(255,255,255,0.4)" strokeDasharray="3 3" />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Residuals vs Predicted */}
      {viz.residuals && (
        <ChartCard 
          icon={<GitBranch size={15} className="text-[#F59E0B]" />} 
          title="Residual Analysis"
          description="Displays the prediction error (residual) against the predicted value. Ideally, points should be randomly scattered around the zero line without obvious patterns."
        >
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart margin={{ top: 5, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="predicted" type="number" name="Predicted" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} label={{ value: 'Predicted Target', position: 'insideBottom', offset: -15, fill: '#64748B', fontSize: 11 }} />
              <YAxis dataKey="residual" type="number" name="Residual" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} label={{ value: 'Residual (Error)', angle: -90, position: 'insideLeft', offset: -10, fill: '#64748B', fontSize: 11 }} />
              <Tooltip {...darkTooltipStyle} />
              <Scatter data={viz.residuals.filter((d: any) => typeof d.predicted === 'number' && !isNaN(d.predicted) && typeof d.residual === 'number' && !isNaN(d.residual))} fill="#F59E0B" fillOpacity={0.6} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.5)" strokeDasharray="3 3" />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Cluster Scatter */}
      {viz.pca_2d && (
        <ChartCard 
          icon={<GitBranch size={15} className="text-[#F97316]" />} 
          title="Cluster Plot (PCA 2D)"
          description="Visualizes natural groupings within the data. Points of the same color belong to the same discovered cluster."
        >
          <ClusterScatter data={viz.pca_2d} />
        </ChartCard>
      )}

      {/* Anomaly Scatter */}
      {results.anomaly_scatter && (
        <ChartCard 
          icon={<Activity size={15} className="text-[#EF4444]" />} 
          title="Anomaly Plot (PCA 2D)"
          description="Highlights unusual data points. Red points represent detected anomalies that deviate significantly from the normal operational data."
        >
          <AnomalyScatter data={results.anomaly_scatter} />
        </ChartCard>
      )}
    </div>
  );
}


// ─── Sub-components ──────────────────────────────────────────────────────────

function ChartCard({ icon, title, description, children, wide }: { icon: React.ReactNode; title: string; description?: React.ReactNode; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={`flex min-w-0 flex-col gap-3 rounded-xl border p-5 ${wide ? 'lg:col-span-2' : ''}`}
      style={{ background: 'rgba(11,20,35,0.6)', borderColor: 'rgba(255,255,255,0.08)' }}>
      <div>
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-semibold text-xs text-[#F9FAFB]">{title}</h3>
        </div>
        {description && (
          <p className="text-[10.5px] text-[#94A3B8] mt-1.5 leading-relaxed">{description}</p>
        )}
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
