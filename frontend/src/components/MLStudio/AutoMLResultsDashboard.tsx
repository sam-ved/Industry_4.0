import { useState } from 'react';
import {
  Download, AlertTriangle, BarChart2, Lightbulb, FileSpreadsheet, Bot,
  BrainCircuit, Clock, ChevronDown, ChevronUp, Info, Shield, Zap,
  TrendingUp, AlertCircle,
} from 'lucide-react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import ChartsPanel from './ChartsPanel';

interface AutoMLResultsDashboardProps {
  results: any;
}

export default function AutoMLResultsDashboard({ results }: AutoMLResultsDashboardProps) {
  const [isDownloadDialogOpen, setIsDownloadDialogOpen] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState('pdf');
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const [showPerformanceDetails, setShowPerformanceDetails] = useState(false);

  if (!results || results.status === 'failed') return null;

  const {
    task_type, target_column, data_quality, best_model, model_comparison,
    feature_importance, predictions, reasoning, recommendations,
    explanation, warnings, insights, sampling_info, performance,
    execution_time, features_count, is_automl,
  } = results;

  const displayedFeatures = showAllFeatures
    ? (feature_importance || [])
    : (feature_importance || []).slice(0, 5);

  return (
    <div className="flex flex-col gap-8">

      {/* ─── 1. Analysis Summary Header ──────────────────────────────── */}
      <div className="flex flex-col gap-4 p-6 rounded-xl border" style={{ background: 'rgba(11,20,35,0.6)', borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold text-[#F9FAFB] flex items-center gap-2">
              <BrainCircuit size={24} className="text-[#8B5CF6]" />
              {is_automl ? 'AutoML Analysis Complete' : 'Analysis Complete'}
            </h2>
            <p className="text-[#94A3B8] mt-1 text-sm">
              Algorithm: <span className="text-white font-medium">{best_model?.name}</span>
              <span className="mx-2 text-[rgba(255,255,255,0.15)]">|</span>
              Task: <span className="text-white capitalize">{task_type}</span>
              {target_column && (
                <>
                  <span className="mx-2 text-[rgba(255,255,255,0.15)]">|</span>
                  Target: <span className="text-white font-medium">{target_column}</span>
                </>
              )}
            </p>
          </div>
          <button
            onClick={() => setIsDownloadDialogOpen(true)}
            className="flex items-center gap-2 bg-[#06B6D4] hover:bg-[#0891B2] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Download size={16} /> Export Report
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-2">
          <SummaryCard label="Rows" value={data_quality?.rows?.toLocaleString() || '-'} />
          <SummaryCard label="Features" value={features_count || '-'} />
          <SummaryCard label="Numeric" value={data_quality?.numerical_columns ?? '-'} />
          <SummaryCard label="Categorical" value={data_quality?.categorical_columns ?? '-'} />
          <SummaryCard label="Missing" value={`${data_quality?.missing_percent || 0}%`} warning={(data_quality?.missing_percent || 0) > 0} />
          {target_column && <SummaryCard label="Target" value={target_column} accent />}
        </div>
      </div>

      {/* ─── Sampling Indicator ───────────────────────────────────── */}
      {sampling_info?.sampled && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
          style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.15)' }}>
          <Info size={14} className="text-[#06B6D4] flex-shrink-0" />
          <span className="text-xs text-[#06B6D4]">{sampling_info.message}</span>
        </div>
      )}

      {/* ─── 2. Warnings ─────────────────────────────────────────── */}
      {warnings && warnings.length > 0 && (
        <div className="flex flex-col gap-2">
          {warnings.map((w: any, i: number) => (
            <div key={i} className="flex items-start gap-3 px-4 py-3 rounded-xl"
              style={{
                background: w.severity === 'high' ? 'rgba(239,68,68,0.06)' : 'rgba(249,115,22,0.06)',
                border: `1px solid ${w.severity === 'high' ? 'rgba(239,68,68,0.15)' : 'rgba(249,115,22,0.15)'}`,
              }}>
              <AlertTriangle size={14} className={`flex-shrink-0 mt-0.5 ${w.severity === 'high' ? 'text-[#EF4444]' : 'text-[#F97316]'}`} />
              <div>
                <p className={`text-xs font-medium ${w.severity === 'high' ? 'text-[#EF4444]' : 'text-[#F97316]'}`}>
                  {w.message}
                </p>
                {w.suggestion && (
                  <p className="text-[10px] text-[#94A3B8] mt-1">{w.suggestion}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── 3. Performance Metrics Cards ────────────────────────── */}
      {best_model?.metrics && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-[rgba(255,255,255,0.05)] pb-2">
            <TrendingUp size={18} className="text-[#10B981]" />
            <h3 className="text-lg font-semibold text-white">Performance</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(best_model.metrics).map(([key, value]: [string, any]) => {
              if (key === 'Clusters' || key === 'Samples') {
                return <MetricCard key={key} label={key} value={value} />;
              }
              const quality = getMetricQuality(key, value);
              return <MetricCard key={key} label={key} value={value} quality={quality} />;
            })}
          </div>
        </div>
      )}

      {/* ─── 4. What Does This Mean? ────────────────────────────── */}
      {explanation && (
        <div className="p-6 rounded-xl border" style={{ background: 'rgba(59,130,246,0.04)', borderColor: 'rgba(59,130,246,0.15)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Info size={18} className="text-[#60A5FA]" />
            <h3 className="text-lg font-semibold text-white">What Does This Mean?</h3>
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-sm text-[#E2E8F0] leading-relaxed">{explanation.summary}</p>
            <p className="text-sm text-[#CBD5E1] leading-relaxed">{explanation.detail}</p>
            {explanation.feature_note && (
              <p className="text-sm text-[#94A3B8] leading-relaxed">{explanation.feature_note}</p>
            )}
            <p className="text-xs text-[#64748B] mt-1">{explanation.data_note}</p>
          </div>
        </div>
      )}

      {/* ─── 5. Key Insights ────────────────────────────────────── */}
      {insights && insights.length > 0 && (
        <div className="p-5 rounded-xl border" style={{ background: 'rgba(16,185,129,0.04)', borderColor: 'rgba(16,185,129,0.15)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Zap size={16} className="text-[#10B981]" />
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Key Insights</h3>
          </div>
          <ul className="flex flex-col gap-2">
            {insights.map((insight: string, i: number) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-[#10B981] mt-0.5 flex-shrink-0">•</span>
                <span className="text-sm text-[#E2E8F0]">{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* ─── 6. Model Comparison ──────────────────────────────── */}
        {model_comparison && model_comparison.length > 0 && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-[rgba(255,255,255,0.05)] pb-2">
              <BarChart2 size={18} className="text-[#06B6D4]" />
              <h3 className="text-lg font-semibold text-white">Model Comparison</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-[#94A3B8]">
                <thead className="bg-[rgba(255,255,255,0.02)]">
                  <tr>
                    <th className="p-3 rounded-tl-lg font-medium text-white">Model</th>
                    {task_type === 'regression' ? (
                      <>
                        <th className="p-3 font-medium text-white text-right">R²</th>
                        <th className="p-3 font-medium text-white text-right">RMSE</th>
                        <th className="p-3 font-medium text-white text-right">MAE</th>
                      </>
                    ) : task_type === 'classification' ? (
                      <>
                        <th className="p-3 font-medium text-white text-right">Accuracy</th>
                        <th className="p-3 font-medium text-white text-right">Precision</th>
                        <th className="p-3 font-medium text-white text-right">Recall</th>
                        <th className="p-3 font-medium text-white text-right">F1</th>
                      </>
                    ) : task_type === 'clustering' ? (
                      <>
                        <th className="p-3 font-medium text-white text-right">Silhouette</th>
                        <th className="p-3 font-medium text-white text-right">Clusters</th>
                      </>
                    ) : (
                      <th className="p-3 font-medium text-white text-right">Score</th>
                    )}
                    <th className="p-3 rounded-tr-lg font-medium text-white text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(255,255,255,0.05)]">
                  {model_comparison.filter((m: any) => !m['Is Baseline']).map((m: any, i: number) => {
                    const isBest = m.Status?.includes('Best');
                    const isFailed = m.Status?.includes('Failed') || m.Status?.includes('Timeout');
                    return (
                      <tr key={i} className={isBest ? 'bg-[rgba(16,185,129,0.05)]' : ''}>
                        <td className="p-3">
                          <span className={isBest ? 'text-[#10B981] font-semibold' : 'text-[#E2E8F0]'}>{m.Model}</span>
                        </td>
                        {task_type === 'regression' ? (
                          <>
                            <td className={`p-3 text-right font-medium ${isFailed ? 'text-[#64748B]' : 'text-white'}`}>{typeof m['R²'] === 'number' ? m['R²'].toFixed(4) : m['R²'] || m.Score || '-'}</td>
                            <td className={`p-3 text-right font-medium ${isFailed ? 'text-[#64748B]' : 'text-white'}`}>{typeof m['RMSE'] === 'number' ? m['RMSE'].toFixed(4) : m['RMSE'] || '-'}</td>
                            <td className={`p-3 text-right font-medium ${isFailed ? 'text-[#64748B]' : 'text-white'}`}>{typeof m['MAE'] === 'number' ? m['MAE'].toFixed(4) : m['MAE'] || '-'}</td>
                          </>
                        ) : task_type === 'classification' ? (
                          <>
                            <td className={`p-3 text-right font-medium ${isFailed ? 'text-[#64748B]' : 'text-white'}`}>{typeof m['Accuracy'] === 'number' ? (m['Accuracy'] * 100).toFixed(1) + '%' : m['Accuracy'] || m.Score || '-'}</td>
                            <td className={`p-3 text-right font-medium ${isFailed ? 'text-[#64748B]' : 'text-white'}`}>{typeof m['Precision'] === 'number' ? (m['Precision'] * 100).toFixed(1) + '%' : m['Precision'] || '-'}</td>
                            <td className={`p-3 text-right font-medium ${isFailed ? 'text-[#64748B]' : 'text-white'}`}>{typeof m['Recall'] === 'number' ? (m['Recall'] * 100).toFixed(1) + '%' : m['Recall'] || '-'}</td>
                            <td className={`p-3 text-right font-medium ${isFailed ? 'text-[#64748B]' : 'text-white'}`}>{typeof m['F1'] === 'number' ? (m['F1'] * 100).toFixed(1) + '%' : m['F1'] || '-'}</td>
                          </>
                        ) : task_type === 'clustering' ? (
                          <>
                            <td className={`p-3 text-right font-medium ${isFailed ? 'text-[#64748B]' : 'text-white'}`}>{typeof m['Silhouette'] === 'number' ? m['Silhouette'].toFixed(4) : m['Silhouette'] || m.Score || '-'}</td>
                            <td className={`p-3 text-right font-medium ${isFailed ? 'text-[#64748B]' : 'text-white'}`}>{m['Clusters'] || '-'}</td>
                          </>
                        ) : (
                          <td className={`p-3 text-right font-medium ${isFailed ? 'text-[#64748B]' : 'text-white'}`}>{typeof m.Score === 'number' ? m.Score.toFixed(4) : m.Score}</td>
                        )}
                        <td className={`p-3 text-center text-xs font-medium ${
                          isBest ? 'text-[#10B981]' : isFailed ? 'text-[#F97316]' : 'text-[#94A3B8]'
                        }`}>
                          {m.Status}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {model_comparison.find((m: any) => m['Is Baseline']) && (
                <div className="mt-3 text-xs text-[#64748B] flex items-center justify-end px-2">
                  <span className="font-semibold text-[#94A3B8] mr-2">REFERENCE BASELINE</span>
                  <span>{model_comparison.find((m: any) => m['Is Baseline']).Model}: </span>
                  <span className="ml-1 text-white font-medium">
                    {model_comparison.find((m: any) => m['Is Baseline']).Score !== undefined && typeof model_comparison.find((m: any) => m['Is Baseline']).Score === 'number' 
                      ? model_comparison.find((m: any) => m['Is Baseline']).Score.toFixed(4) 
                      : model_comparison.find((m: any) => m['Is Baseline']).Score}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── 7. Feature Importance ────────────────────────────── */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-[rgba(255,255,255,0.05)] pb-2">
            <Lightbulb size={18} className="text-[#F59E0B]" />
            <h3 className="text-lg font-semibold text-white">Feature Importance</h3>
          </div>
          {feature_importance?.length > 0 ? (
            <div className="flex flex-col gap-3">
              {displayedFeatures.map((f: any, i: number) => {

                const pct = f.percentage != null ? f.percentage : ((f.value / (feature_importance[0]?.value || 1)) * 100);
                return (
                  <div key={i} className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#E2E8F0] truncate max-w-[180px]">
                        <span className="text-[#64748B] mr-1.5">{i + 1}.</span>
                        {f.name}
                      </span>
                      <span className="text-[#94A3B8] font-medium">{pct.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 w-full bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, pct)}%`,
                          background: `linear-gradient(90deg, #F59E0B, #F97316)`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}

              {feature_importance.length > 5 && (
                <button
                  onClick={() => setShowAllFeatures(!showAllFeatures)}
                  className="flex items-center justify-center gap-1 text-[10px] text-[#64748B] hover:text-[#94A3B8] transition-colors mt-1"
                >
                  {showAllFeatures ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  {showAllFeatures ? 'Show less' : `Show all ${feature_importance.length} features`}
                </button>
              )}

              <p className="text-[10px] text-[#64748B] italic">
                Ranked by relative contribution to model predictions.
              </p>
            </div>
          ) : (
            <p className="text-sm text-[#64748B]">Feature importance not available for this model.</p>
          )}
        </div>
      </div>

      {/* ─── 8. AI Reasoning ─────────────────────────────────────── */}
      {reasoning && (
        <div className="p-6 rounded-xl border" style={{ background: 'rgba(139,92,246,0.04)', borderColor: 'rgba(139,92,246,0.15)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Bot size={20} className="text-[#A78BFA]" />
            <h3 className="text-lg font-bold text-white">AI Reasoning</h3>
            {reasoning.Confidence && (
              <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                reasoning.Confidence === 'High' ? 'bg-[rgba(16,185,129,0.1)] text-[#10B981]'
                  : reasoning.Confidence === 'Medium' ? 'bg-[rgba(249,115,22,0.1)] text-[#F97316]'
                    : 'bg-[rgba(239,68,68,0.1)] text-[#EF4444]'
              }`}>
                {reasoning.Confidence} Confidence
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <h4 className="text-xs font-semibold text-[#A78BFA] mb-1 uppercase tracking-wider">Finding</h4>
              <p className="text-sm text-[#E2E8F0] leading-relaxed">{reasoning.Finding}</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[#A78BFA] mb-1 uppercase tracking-wider">Why it matters</h4>
              <p className="text-sm text-[#E2E8F0] leading-relaxed">{reasoning.Why}</p>
            </div>
            <div className="md:col-span-2">
              <h4 className="text-xs font-semibold text-[#A78BFA] mb-1 uppercase tracking-wider">Recommendation</h4>
              <p className="text-sm text-[#E2E8F0] leading-relaxed">{reasoning.Recommendation}</p>
            </div>
          </div>
        </div>
      )}

      {/* ─── 9. Visual Analysis ──────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-[rgba(255,255,255,0.05)] pb-2">
          <BarChart2 size={18} className="text-[#8B5CF6]" />
          <h3 className="text-lg font-semibold text-white">Visual Analysis</h3>
        </div>
        <ChartsPanel results={results} />
      </div>

      {/* ─── 10. Sample Predictions ──────────────────────────────── */}
      {predictions?.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-[rgba(255,255,255,0.05)] pb-2">
            <FileSpreadsheet size={18} className="text-[#10B981]" />
            <h3 className="text-lg font-semibold text-white">Sample Predictions</h3>
            <span className="text-[10px] text-[#64748B] ml-2">({predictions.length} samples)</span>
          </div>
          <div className="overflow-x-auto max-h-[300px] custom-scrollbar">
            <table className="w-full text-left text-sm text-[#94A3B8]">
              <thead className="sticky top-0 bg-[#081120] border-b border-[rgba(255,255,255,0.05)]">
                <tr>
                  <th className="p-3 font-medium text-white">#</th>
                  <th className="p-3 font-medium text-white">Actual</th>
                  <th className="p-3 font-medium text-white">Predicted</th>
                  {task_type === 'regression' && <th className="p-3 font-medium text-white">Error</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(255,255,255,0.05)]">
                {predictions.map((p: any, i: number) => (
                  <tr key={i} className="hover:bg-[rgba(255,255,255,0.02)]">
                    <td className="p-3">{p.Index}</td>
                    <td className="p-3">{typeof p.Actual === 'number' ? p.Actual.toFixed(2) : p.Actual}</td>
                    <td className="p-3 font-medium text-[#E2E8F0]">{typeof p.Predicted === 'number' ? p.Predicted.toFixed(2) : p.Predicted}</td>
                    {task_type === 'regression' && (
                      <td className="p-3 text-[#F97316]">{typeof p.Error === 'number' ? p.Error.toFixed(2) : p.Error}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── 11. Recommendations ─────────────────────────────────── */}
      {recommendations?.length > 0 && (
        <div className="p-5 rounded-xl border" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)' }}>
          <h3 className="text-sm font-semibold text-white mb-3 uppercase tracking-wider flex items-center gap-2">
            <Shield size={14} className="text-[#06B6D4]" />
            Recommended Actions
          </h3>
          <ol className="list-decimal pl-5 text-sm text-[#E2E8F0] flex flex-col gap-2">
            {recommendations.map((r: string, i: number) => <li key={i}>{r}</li>)}
          </ol>
        </div>
      )}



      {/* ─── Download Dialog ─────────────────────────────────────── */}
      <Dialog open={isDownloadDialogOpen} onClose={() => setIsDownloadDialogOpen(false)} sx={{ '& .MuiPaper-root': { background: '#0F172A', color: 'white' } }}>
        <DialogTitle>Export Analysis Report</DialogTitle>
        <DialogContent>
          <p className="text-sm text-[#94A3B8] mb-4">Select a format to download the full report.</p>
          <FormControl fullWidth>
            <InputLabel sx={{ color: '#94A3B8' }}>Format</InputLabel>
            <Select
              value={downloadFormat}
              label="Format"
              onChange={(e) => setDownloadFormat(e.target.value)}
              sx={{ color: 'white', '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' } }}
            >
              <MenuItem value="pdf">PDF Document</MenuItem>
              <MenuItem value="docx">Word Document</MenuItem>
              <MenuItem value="csv">CSV (Predictions only)</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDownloadDialogOpen(false)} sx={{ color: '#94A3B8' }}>Cancel</Button>
          <Button variant="contained" sx={{ bgcolor: '#06B6D4' }} onClick={() => setIsDownloadDialogOpen(false)}>Download</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}


// ─── Sub-components ──────────────────────────────────────────────────────────

function SummaryCard({ label, value, accent, capitalize: cap, warning }: {
  label: string; value: any; accent?: boolean; capitalize?: boolean; warning?: boolean;
}) {
  return (
    <div className="p-3 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)]">
      <p className="text-[10px] uppercase text-[#64748B] font-bold">{label}</p>
      <p className={`text-sm font-bold mt-0.5 truncate ${
        warning ? 'text-[#F97316]' : accent ? 'text-[#10B981]' : 'text-white'
      } ${cap ? 'capitalize' : ''}`}>
        {value}
        {warning && <AlertCircle size={12} className="inline ml-1 -mt-0.5" />}
      </p>
    </div>
  );
}


function MetricCard({ label, value, quality }: {
  label: string; value: any; quality?: { label: string; color: string };
}) {


  // For R², MAE, RMSE display raw value
  const displayValue = typeof value === 'number'
    ? (['R²', 'MAE', 'RMSE', 'Silhouette'].includes(label)
        ? value.toFixed(4)
        : (['Accuracy', 'Precision', 'Recall', 'F1'].includes(label)
            ? `${(value * 100).toFixed(1)}%`
            : (label === 'Clusters' || label === 'Samples' ? value : value.toFixed(2))))
    : value;

  return (
    <div className="p-4 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] flex flex-col gap-1">
      <p className="text-[10px] uppercase text-[#64748B] font-bold tracking-wider">{label}</p>
      <p className="text-xl font-bold text-[#F9FAFB]">{displayValue}</p>
      {quality && (
        <span className={`text-[10px] font-medium ${quality.color}`}>{quality.label}</span>
      )}
    </div>
  );
}


function getMetricQuality(key: string, value: number): { label: string; color: string } | undefined {
  if (key === 'R²') {
    if (value > 0.85) return { label: 'Strong fit', color: 'text-[#10B981]' };
    if (value > 0.6) return { label: 'Moderate', color: 'text-[#F59E0B]' };
    if (value > 0.3) return { label: 'Limited', color: 'text-[#F97316]' };
    return { label: 'Weak', color: 'text-[#EF4444]' };
  }
  if (key === 'Accuracy' || key === 'F1' || key === 'Precision' || key === 'Recall') {
    if (value > 0.9) return { label: 'Excellent', color: 'text-[#10B981]' };
    if (value > 0.7) return { label: 'Good', color: 'text-[#F59E0B]' };
    if (value > 0.5) return { label: 'Fair', color: 'text-[#F97316]' };
    return { label: 'Poor', color: 'text-[#EF4444]' };
  }
  if (key === 'Silhouette') {
    if (value > 0.5) return { label: 'Well-separated', color: 'text-[#10B981]' };
    if (value > 0.25) return { label: 'Moderate', color: 'text-[#F59E0B]' };
    return { label: 'Weak', color: 'text-[#F97316]' };
  }
  return undefined;
}
