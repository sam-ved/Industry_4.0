import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, BrainCircuit, Sparkles, AlertTriangle,
  ChevronDown, ChevronUp, Upload,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import BackgroundGlow from '../components/common/BackgroundGlow';
import ExecutiveSummary from '../components/AIReasoning/ExecutiveSummary';
import ConfidenceMeter from '../components/AIReasoning/ConfidenceMeter';
import RootCausePanel from '../components/AIReasoning/RootCausePanel';
import ConsensusMatrix from '../components/AIReasoning/ConsensusMatrix';
import EvidenceCard from '../components/AIReasoning/EvidenceCard';
import RecommendationList from '../components/AIReasoning/RecommendationList';
import RiskBanner from '../components/AIReasoning/RiskBanner';
import { reasoningAPI } from '../services/api';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

// ── Types ────────────────────────────────────────────────────────────────────

interface ReasoningReport {
  executive_summary: string;
  dataset_overview: any;
  findings: any[];
  findings_summary: string[];
  consensus: any;
  root_causes: any[];
  confidence: any;
  rule_verdicts: any[];
  risk_level: string;
  recommendations: any[];
  llm_narrative: any;
  limitations: string[];
  generated_at: string;
  reasoning_version: string;
  llm_used: boolean;
}

// ── Demo data generator ──────────────────────────────────────────────────────

function buildDemoResults(): Record<string, unknown>[] {
  return [
    {
      algorithm: 'Random Forest Classifier',
      task_type: 'classification',
      metrics: { accuracy: 0.923, precision: 0.91, recall: 0.935, f1_score: 0.922 },
      dataset_stats: { rows: 5000, columns: 12, numerical_columns: ['Temperature', 'Pressure', 'Vibration', 'RPM', 'Power', 'Current', 'Voltage', 'Humidity'], categorical_columns: ['Machine_Type', 'Shift', 'Operator', 'Status'], missing_values: {} },
      feature_importance: [
        { name: 'Temperature', value: 0.312 },
        { name: 'Vibration', value: 0.224 },
        { name: 'Pressure', value: 0.187 },
        { name: 'RPM', value: 0.112 },
        { name: 'Power', value: 0.089 },
      ],
    },
    {
      algorithm: 'Isolation Forest',
      task_type: 'anomaly',
      metrics: { total_samples: 5000, anomalies_detected: 43, normal_samples: 4957, anomaly_percentage: 0.86 },
      dataset_stats: { rows: 5000, columns: 12 },
      feature_importance: [
        { name: 'Temperature', value: 0.401 },
        { name: 'Pressure', value: 0.289 },
        { name: 'Vibration', value: 0.178 },
      ],
    },
    {
      algorithm: 'Linear Regression',
      task_type: 'regression',
      metrics: { r2: 0.847, rmse: 12.34, mae: 8.92, mse: 152.28 },
      dataset_stats: { rows: 5000, columns: 12 },
      feature_importance: [
        { name: 'Temperature', value: 0.356 },
        { name: 'RPM', value: 0.201 },
        { name: 'Humidity', value: 0.143 },
      ],
    },
  ];
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function AIReasoning() {
  const navigate = useNavigate();
  useDocumentMeta('AI Decision Intelligence', 'Multi-model reasoning engine with consensus analysis, root cause detection, and explainable AI.');

  const [report, setReport] = useState<ReasoningReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLimitations, setShowLimitations] = useState(false);
  const [useLlm, setUseLlm] = useState(true);

  // Collected ML results from previous analyses
  const [collectedResults, setCollectedResults] = useState<Record<string, unknown>[]>([]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const results = Array.isArray(parsed) ? parsed : [parsed];
      setCollectedResults(results);
      setError(null);
    } catch {
      setError('Invalid JSON file. Export results from ML Studio first.');
    }
  }, []);

  const handleRunDemo = useCallback(() => {
    setCollectedResults(buildDemoResults());
    setError(null);
  }, []);

  const handleRunReasoning = useCallback(async () => {
    if (collectedResults.length === 0) return;
    setIsLoading(true);
    setError(null);
    setReport(null);

    try {
      const res = await reasoningAPI.analyzeFromResults(collectedResults, useLlm);
      setReport(res.report);
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Reasoning pipeline failed';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [collectedResults, useLlm]);

  return (
    <div className="relative min-h-screen overflow-x-hidden" style={{ background: '#081120' }}>
      <BackgroundGlow />

      <div className="relative z-10 mx-auto max-w-screen-xl px-4 py-6 sm:px-8 lg:px-10">
        {/* ── Header ── */}
        <div
          className="mb-6 flex flex-col gap-5 border-b pb-6 sm:flex-row sm:items-center sm:justify-between"
          style={{ borderColor: 'rgba(255,255,255,0.05)' }}
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              aria-label="Back to dashboard"
              className="shrink-0 rounded-lg border p-2 transition-all hover:bg-[rgba(255,255,255,0.04)]"
              style={{ background: 'rgba(11,20,35,0.6)', borderColor: 'rgba(255,255,255,0.08)' }}
            >
              <ArrowLeft size={18} className="text-[#94A3B8]" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <BrainCircuit size={20} className="text-[#A78BFA]" />
                <h1 className="text-xl font-bold tracking-tight text-[#F9FAFB] sm:text-2xl">
                  AI Decision Intelligence
                </h1>
              </div>
              <p className="mt-1 text-xs text-[#64748B] sm:text-sm">
                Multi-model reasoning, consensus analysis, and explainable AI.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div
                onClick={() => setUseLlm(!useLlm)}
                className="relative w-10 h-5 rounded-full transition-colors"
                style={{ background: useLlm ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.1)' }}
              >
                <div
                  className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform"
                  style={{
                    background: useLlm ? '#A78BFA' : '#64748B',
                    transform: useLlm ? 'translateX(20px)' : 'translateX(0)',
                  }}
                />
              </div>
              <span className="text-xs text-[#94A3B8]">LLM Enhancement</span>
            </label>
          </div>
        </div>

        {/* ── Input Section ── */}
        {!report && !isLoading && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div
              className="mx-auto max-w-2xl rounded-xl border p-8"
              style={{ background: 'rgba(11,20,35,0.85)', borderColor: 'rgba(139,92,246,0.15)' }}
            >
              <div className="text-center mb-6">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
                  <Sparkles size={24} className="text-[#A78BFA]" />
                </div>
                <h2 className="text-lg font-bold text-[#F9FAFB]">Feed Model Results</h2>
                <p className="mt-1 text-sm text-[#64748B]">
                  Upload exported ML Studio results or use demo data to run the reasoning pipeline.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                {/* Upload JSON */}
                <label
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-3 transition-colors hover:border-[rgba(139,92,246,0.4)]"
                  style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}
                >
                  <Upload size={16} className="text-[#94A3B8]" />
                  <span className="text-sm text-[#94A3B8]">Upload results JSON</span>
                  <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                </label>

                {/* Demo button */}
                <button
                  onClick={handleRunDemo}
                  className="rounded-lg border px-4 py-2.5 text-sm font-medium text-[#A78BFA] transition-all hover:bg-[rgba(139,92,246,0.08)]"
                  style={{ borderColor: 'rgba(139,92,246,0.2)' }}
                >
                  Use Demo Data (3 models)
                </button>

                {/* Status */}
                {collectedResults.length > 0 && (
                  <div className="flex items-center justify-center gap-2 rounded-lg px-3 py-2" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span className="text-xs text-[#10B981] font-semibold">
                      {collectedResults.length} model result(s) loaded
                    </span>
                  </div>
                )}

                {/* Run button */}
                <button
                  onClick={handleRunReasoning}
                  disabled={collectedResults.length === 0}
                  className="flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-40"
                  style={{
                    background: collectedResults.length > 0
                      ? 'linear-gradient(135deg, #8B5CF6, #6D28D9)'
                      : 'rgba(139,92,246,0.15)',
                    color: '#F9FAFB',
                  }}
                >
                  <BrainCircuit size={18} />
                  Run Reasoning Pipeline
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Loading ── */}
        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20">
            <div className="relative mb-6">
              <div className="h-16 w-16 rounded-full border-2 border-[rgba(139,92,246,0.2)] border-t-[#A78BFA] animate-spin" />
              <BrainCircuit size={24} className="absolute inset-0 m-auto text-[#A78BFA]" />
            </div>
            <p className="text-sm font-medium text-[#F9FAFB]">Running Reasoning Pipeline…</p>
            <p className="mt-1 text-xs text-[#64748B]">Analyzing evidence across {collectedResults.length} model(s)</p>
          </motion.div>
        )}

        {/* ── Error ── */}
        {error && !isLoading && (
          <div className="mx-auto flex w-full max-w-2xl items-start gap-3 rounded-lg p-4 mb-6" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[#EF4444]" />
            <span className="text-sm text-[#EF4444]">{error}</span>
          </div>
        )}

        {/* ── Report ── */}
        {report && !isLoading && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 pb-20">
            {/* Risk Banner */}
            <RiskBanner riskLevel={report.risk_level} llmUsed={report.llm_used} />

            {/* Top row: Executive Summary + Confidence */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <ExecutiveSummary summary={report.executive_summary} llmNarrative={report.llm_narrative} />
              </div>
              <div>
                <ConfidenceMeter confidence={report.confidence} />
              </div>
            </div>

            {/* Root Cause */}
            {report.root_causes.length > 0 && (
              <RootCausePanel rootCauses={report.root_causes} />
            )}

            {/* Consensus */}
            {report.consensus && report.consensus.total_models > 1 && (
              <ConsensusMatrix consensus={report.consensus} />
            )}

            {/* Evidence Cards */}
            {report.findings.length > 0 && (
              <div>
                <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-[#94A3B8]">
                  Model Evidence ({report.findings.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {report.findings.map((f: any, i: number) => (
                    <EvidenceCard key={i} finding={f} />
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {report.recommendations.length > 0 && (
              <RecommendationList recommendations={report.recommendations} />
            )}

            {/* Limitations */}
            {report.limitations.length > 0 && (
              <div
                className="rounded-xl border"
                style={{ background: 'rgba(11,20,35,0.7)', borderColor: 'rgba(255,255,255,0.06)' }}
              >
                <button
                  onClick={() => setShowLimitations(!showLimitations)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left"
                >
                  <span className="text-sm font-semibold text-[#94A3B8]">
                    Limitations & Caveats ({report.limitations.length})
                  </span>
                  {showLimitations ? <ChevronUp size={16} className="text-[#64748B]" /> : <ChevronDown size={16} className="text-[#64748B]" />}
                </button>
                <AnimatePresence>
                  {showLimitations && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="px-5 pb-4">
                        <ul className="space-y-2">
                          {report.limitations.map((lim: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-[#64748B]">
                              <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-[#475569]" />
                              {lim}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Run Again */}
            <div className="flex justify-center pt-4">
              <button
                onClick={() => { setReport(null); setCollectedResults([]); }}
                className="rounded-lg border px-6 py-2.5 text-sm font-medium text-[#94A3B8] transition-all hover:text-[#F9FAFB] hover:bg-[rgba(255,255,255,0.04)]"
                style={{ borderColor: 'rgba(255,255,255,0.08)' }}
              >
                New Analysis
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
