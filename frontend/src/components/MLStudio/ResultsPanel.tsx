import { useState, useEffect } from 'react';
import { Sparkles, RotateCcw, Cpu, CheckCircle2, FileText, AlertTriangle, TrendingUp, Lightbulb, Bot } from 'lucide-react';
import { motion } from 'framer-motion';
import { mlStudioAPI } from '../../services/api';
import ChartsPanel from './ChartsPanel';
import AIChatDrawer from '../common/AIChatDrawer';

interface ResultsPanelProps {
  results: any;
  config: any;
  onReset: () => void;
  isLoading: boolean;
}

export default function ResultsPanel({ results, config, onReset, isLoading }: ResultsPanelProps) {
  const [insights, setInsights] = useState<any | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    if (results && !isLoading) {
      fetchInsights();
    }
  }, [results, isLoading]);

  const fetchInsights = async () => {
    if (!results) return;
    setLoadingInsights(true);
    try {
      const res = await mlStudioAPI.insights(results);
      if (res.data?.insights) {
        setInsights(res.data.insights);
      }
    } catch (e) {
      console.error('Insights error:', e);
    } finally {
      setLoadingInsights(false);
    }
  };

  // ── Loading State ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-full max-w-sm p-8 rounded-2xl border flex flex-col items-center text-center relative overflow-hidden"
          style={{ background: 'rgba(11,20,35,0.85)', borderColor: 'rgba(6,182,212,0.2)' }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
            className="mb-6 p-4 rounded-full border border-[rgba(6,182,212,0.25)] bg-[rgba(6,182,212,0.05)]"
          >
            <Cpu size={28} className="text-[#06B6D4]" />
          </motion.div>

          <h3 className="text-base font-bold text-[#F9FAFB] mb-2">Running Analysis</h3>
          <p className="text-xs text-[#64748B] mb-5">
            {config.algorithm} / {config.taskType}
          </p>

          {/* Animated progress bar */}
          <div className="w-full bg-[rgba(255,255,255,0.08)] h-1.5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: '85%' }}
              transition={{ duration: 8, ease: 'easeInOut' }}
              className="h-full rounded-full bg-gradient-to-r from-[#06B6D4] to-[#3B82F6]"
            />
          </div>
          <p className="text-[10px] text-[#475569] mt-3">Model will be discarded after evaluation</p>
        </div>
      </div>
    );
  }

  if (!results) return null;

  const taskType = results.task_type || config.taskType;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#F9FAFB]">Analysis Results</h2>
          <p className="text-sm text-[#64748B] mt-0.5">
            {config.algorithm}
            <span className="mx-2 text-[rgba(255,255,255,0.15)]">/</span>
            {taskType}
            {config.targetColumn && (
              <>
                <span className="mx-2 text-[rgba(255,255,255,0.15)]">/</span>
                Target: <span className="text-[#94A3B8]">{config.targetColumn}</span>
              </>
            )}
          </p>
        </div>
        <button type="button" onClick={onReset}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-5 py-2 text-sm font-medium transition-all hover:bg-[rgba(6,182,212,0.08)] sm:w-auto"
          style={{ border: '1px solid rgba(6,182,212,0.3)', color: '#06B6D4' }}>
          <RotateCcw size={14} />
          New Analysis
        </button>
      </div>

      {/* Preprocessing Summary Card */}
      {results.preprocessing && (
        <div className="p-4 rounded-xl border flex flex-col gap-2"
          style={{ background: 'rgba(16,185,129,0.04)', borderColor: 'rgba(16,185,129,0.15)' }}>
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 size={16} className="text-[#10B981]" />
            <h3 className="font-semibold text-sm text-[#10B981]">Intelligent Preprocessing Applied</h3>
          </div>
          <div className="flex flex-col gap-1.5 text-xs text-[#94A3B8] ml-6">
            {results.preprocessing.missing_values_handled && (
              <div className="flex items-center gap-1.5"><span className="text-[#10B981]">✓</span> Missing Values Handled</div>
            )}
            {results.preprocessing.encoded_columns > 0 && (
              <div className="flex items-center gap-1.5"><span className="text-[#10B981]">✓</span> {results.preprocessing.encoded_columns} Categorical Column{results.preprocessing.encoded_columns > 1 ? 's' : ''} Encoded</div>
            )}
            {results.preprocessing.scaling_applied ? (
              <div className="flex items-center gap-1.5"><span className="text-[#10B981]">✓</span> {results.preprocessing.scaler} Applied</div>
            ) : (
              <div className="flex items-center gap-1.5"><span className="text-[#10B981]">✓</span> Scaling Not Required For {config.algorithm}</div>
            )}
          </div>
        </div>
      )}

      {/* Metrics Cards */}
      {results.metrics && (
        <div className={`grid gap-3 ${
          Object.keys(results.metrics).length <= 4
            ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4'
            : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
        }`}>
          {Object.entries(results.metrics).map(([key, value]: [string, any]) => (
            <MetricCard key={key} label={key} value={value} />
          ))}
        </div>
      )}

      {/* Charts */}
      <ChartsPanel results={results} />

      {/* AI Analysis Report */}
      <div className="p-5 rounded-xl border flex flex-col gap-5"
        style={{ background: 'rgba(139,92,246,0.04)', borderColor: 'rgba(139,92,246,0.15)' }}>
        <div className="flex items-center justify-between pb-3 border-b"
          style={{ borderColor: 'rgba(139,92,246,0.15)' }}>
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[#8B5CF6]" />
            <h3 className="font-bold text-sm text-[#8B5CF6]">AI Analysis Report</h3>
            {loadingInsights && (
              <span className="text-[10px] px-2 py-0.5 rounded-full ml-2"
                style={{ background: 'rgba(139,92,246,0.1)', color: '#8B5CF6' }}>
                Generating...
              </span>
            )}
          </div>
          <button 
            onClick={() => setIsChatOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold rounded-lg shadow transition-colors text-xs"
          >
            <Bot size={14} /> Ask AI
          </button>
        </div>

        <AIChatDrawer 
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          module="automl"
          contextData={results}
        />
        
        {loadingInsights ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-4 rounded animate-pulse"
                style={{ background: 'rgba(255,255,255,0.05)', width: `${90 - i * 15}%` }} />
            ))}
          </div>
        ) : insights && typeof insights === 'object' ? (
          <div className="flex flex-col gap-6">
            {/* Executive Summary */}
            {insights.executive_summary && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-[#E2E8F0]">
                  <FileText size={14} className="text-[#8B5CF6]" />
                  <h4 className="font-semibold text-xs uppercase tracking-wider">Executive Summary</h4>
                </div>
                <p className="text-sm text-[#CBD5E1] leading-relaxed ml-6">
                  {insights.executive_summary}
                </p>
              </div>
            )}

            {/* Key Findings */}
            {insights.key_findings && insights.key_findings.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-[#E2E8F0]">
                  <TrendingUp size={14} className="text-[#3B82F6]" />
                  <h4 className="font-semibold text-xs uppercase tracking-wider">Key Findings</h4>
                </div>
                <ul className="flex flex-col gap-1.5 ml-6 text-sm text-[#CBD5E1] list-disc pl-4">
                  {insights.key_findings.map((item: string, i: number) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Risk Indicators */}
            {insights.risk_indicators && insights.risk_indicators.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-[#E2E8F0]">
                  <AlertTriangle size={14} className="text-[#EF4444]" />
                  <h4 className="font-semibold text-xs uppercase tracking-wider">Risk Indicators</h4>
                </div>
                <ul className="flex flex-col gap-1.5 ml-6 text-sm text-[#CBD5E1] list-disc pl-4 marker:text-[#EF4444]">
                  {insights.risk_indicators.map((item: string, i: number) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {insights.recommendations && insights.recommendations.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-[#E2E8F0]">
                  <Lightbulb size={14} className="text-[#10B981]" />
                  <h4 className="font-semibold text-xs uppercase tracking-wider">Recommendations</h4>
                </div>
                <ul className="flex flex-col gap-1.5 ml-6 text-sm text-[#CBD5E1] list-disc pl-4 marker:text-[#10B981]">
                  {insights.recommendations.map((item: string, i: number) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Model Interpretation */}
            {insights.model_interpretation && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-[#E2E8F0]">
                  <Cpu size={14} className="text-[#F59E0B]" />
                  <h4 className="font-semibold text-xs uppercase tracking-wider">Model Interpretation</h4>
                </div>
                <p className="text-sm text-[#CBD5E1] leading-relaxed ml-6">
                  {insights.model_interpretation}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-[#CBD5E1]">{typeof insights === 'string' ? insights : 'No insights available.'}</div>
        )}
      </div>
    </div>
  );
}


// ─── Metric Card ─────────────────────────────────────────────────────────────

function MetricCard({ label, value }: { label: string; value: any }) {
  const formatLabel = (key: string) => key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const formatValue = (key: string, val: any) => {
    if (val === 'N/A' || val === null || val === undefined) return 'N/A';
    if (typeof val !== 'number') return String(val);

    // Percentage-like metrics
    if (['accuracy', 'precision', 'recall', 'f1_score', 'anomaly_percentage'].includes(key)) {
      if (key === 'anomaly_percentage') return `${val.toFixed(1)}%`;
      return `${(val * 100).toFixed(1)}%`;
    }
    // Score-like
    if (['r2', 'silhouette_score'].includes(key)) return val.toFixed(4);
    // Count-like
    if (['n_clusters', 'total_samples', 'anomalies_detected', 'normal_samples'].includes(key)) {
      return val.toLocaleString();
    }
    return val.toFixed(4);
  };

  const getAccentColor = () => {
    if (['accuracy', 'r2', 'silhouette_score'].includes(label)) return '#10B981';
    if (['anomalies_detected', 'anomaly_percentage'].includes(label)) return '#EF4444';
    return '#06B6D4';
  };

  return (
    <div className="relative min-w-0 overflow-hidden rounded-xl border p-4"
      style={{ background: 'rgba(11,20,35,0.6)', borderColor: 'rgba(255,255,255,0.08)' }}>
      <span className="text-[10px] text-[#64748B] uppercase tracking-wider font-semibold">
        {formatLabel(label)}
      </span>
      <p className="mt-1 truncate text-xl font-bold text-[#F9FAFB]" title={String(formatValue(label, value))}>
        {formatValue(label, value)}
      </p>
      <div className="absolute bottom-0 left-0 right-0 h-0.5"
        style={{ background: `linear-gradient(90deg, ${getAccentColor()}50, transparent)` }} />
    </div>
  );
}
