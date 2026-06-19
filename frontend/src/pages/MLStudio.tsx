import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Beaker,
  Upload,
  Columns,
  BrainCircuit,
  BarChart2,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { motion } from 'framer-motion';

import BackgroundGlow from '../components/common/BackgroundGlow';
import DatasetUploader from '../components/MLStudio/DatasetUploader';
import DatasetPreview from '../components/MLStudio/DatasetPreview';
import FeatureSelector from '../components/MLStudio/FeatureSelector';
import AlgorithmSelector from '../components/MLStudio/AlgorithmSelector';
import ResultsPanel from '../components/MLStudio/ResultsPanel';
import { mlStudioAPI } from '../services/api';

const STEPS = [
  { label: 'Dataset', icon: Upload },
  { label: 'Features', icon: Columns },
  { label: 'Algorithm', icon: BrainCircuit },
  { label: 'Results', icon: BarChart2 },
] as const;

export default function MLStudio() {
  const navigate = useNavigate();

  const [uploadSession, setUploadSession] = useState(0);
  const [datasetData, setDatasetData] = useState<any>(null);
  const [config, setConfig] = useState({
    targetColumn: '',
    features: [] as string[],
    algorithm: '',
    taskType: '',
  });
  const [results, setResults] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);

  const isSupervisedTask = config.taskType === 'classification' || config.taskType === 'regression';
  const selectedFeatureCount = config.features.length;
  const configurationReady = Boolean(
    datasetData &&
    selectedFeatureCount > 0 &&
    (!isSupervisedTask || config.targetColumn)
  );
  const canRunAnalysis = Boolean(
    datasetData &&
    config.algorithm &&
    configurationReady &&
    !isRunning
  );

  const runBlockedReason = useMemo(() => {
    if (!datasetData) return 'Upload a dataset to continue.';
    if (selectedFeatureCount === 0) return 'Select at least one feature.';
    if (!config.algorithm) return 'Choose an algorithm.';
    if (isSupervisedTask && !config.targetColumn) {
      return 'Select a target variable for classification or regression.';
    }
    return null;
  }, [config.algorithm, config.targetColumn, datasetData, isSupervisedTask, selectedFeatureCount]);

  const stepStatuses = useMemo(() => {
    const hasDataset = Boolean(datasetData);
    const hasAlgorithm = Boolean(config.algorithm) && configurationReady;

    return [
      { complete: hasDataset, active: !hasDataset },
      { complete: configurationReady, active: hasDataset && !configurationReady },
      { complete: hasAlgorithm, active: configurationReady && !config.algorithm },
      { complete: Boolean(results), active: isRunning || (hasAlgorithm && !results) },
    ];
  }, [config.algorithm, configurationReady, datasetData, isRunning, results]);

  const handleUploadSuccess = useCallback((data: any) => {
    setDatasetData(data);
    setResults(null);
    setRunError(null);
    setConfig({ targetColumn: '', features: [], algorithm: '', taskType: '' });
  }, []);

  const handleRunAnalysis = useCallback(async () => {
    if (!canRunAnalysis || !datasetData) return;

    setIsRunning(true);
    setRunError(null);
    setResults(null);

    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);

    try {
      const res = await mlStudioAPI.run({
        file_id: datasetData.file_id,
        target_column: config.targetColumn || undefined,
        features: config.features,
        algorithm: config.algorithm,
        task_type: config.taskType,
      });
      setResults(res.data);
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 100);
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Analysis failed';
      setRunError(msg);
      setResults(null);
    } finally {
      setIsRunning(false);
    }
  }, [canRunAnalysis, datasetData, config]);

  const handleReset = useCallback(() => {
    setUploadSession((value) => value + 1);
    setDatasetData(null);
    setConfig({ targetColumn: '', features: [], algorithm: '', taskType: '' });
    setResults(null);
    setRunError(null);
    setIsRunning(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden" style={{ background: '#081120' }}>
      <BackgroundGlow />

      <div className="relative z-10 mx-auto max-w-screen-xl px-4 py-6 sm:px-8 lg:px-10">
        <div className="mb-6 flex flex-col gap-5 border-b pb-6 sm:flex-row sm:items-center sm:justify-between"
          style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
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
                <Beaker size={18} className="text-[#8B5CF6]" />
                <h1 className="text-xl font-bold tracking-tight text-[#F9FAFB] sm:text-2xl">AutoML Studio</h1>
              </div>
              <p className="mt-1 text-xs text-[#64748B] sm:text-sm">
                Upload, configure, and evaluate tabular models in one workspace.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:justify-end">
            {datasetData && (
              <button
                onClick={handleReset}
                className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold text-[#94A3B8] transition-colors hover:text-[#F9FAFB]"
                style={{ background: 'rgba(11,20,35,0.55)', borderColor: 'rgba(255,255,255,0.08)' }}
              >
                <RotateCcw size={14} />
                Reset
              </button>
            )}
          </div>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const status = stepStatuses[index];
            const tone = status.complete
              ? { background: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.22)', color: '#10B981' }
              : status.active
                ? { background: 'rgba(6,182,212,0.08)', borderColor: 'rgba(6,182,212,0.26)', color: '#06B6D4' }
                : { background: 'rgba(11,20,35,0.55)', borderColor: 'rgba(255,255,255,0.07)', color: '#64748B' };

            return (
              <div
                key={step.label}
                className="flex min-w-0 items-center gap-3 rounded-lg border px-3 py-3"
                style={{ background: tone.background, borderColor: tone.borderColor }}
              >
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.04)', color: tone.color }}
                >
                  {status.complete ? <CheckCircle2 size={16} /> : <Icon size={16} />}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#F9FAFB]">{step.label}</p>
                  <p className="text-[10px] uppercase tracking-wide" style={{ color: tone.color }}>
                    {status.complete ? 'Done' : status.active ? 'Active' : 'Pending'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="w-full flex flex-col gap-10 pb-20">
          <div className="mx-auto w-full max-w-2xl">
            <DatasetUploader key={uploadSession} onUploadSuccess={handleUploadSuccess} />
          </div>

          {datasetData && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-10">
              <DatasetPreview data={datasetData} />

              <div className="border-t border-[rgba(255,255,255,0.05)] pt-10">
                <FeatureSelector
                  data={datasetData}
                  config={config}
                  setConfig={setConfig}
                />
              </div>

              <div className="border-t border-[rgba(255,255,255,0.05)] pt-10">
                <AlgorithmSelector
                  config={config}
                  setConfig={setConfig}
                  isRunning={isRunning}
                />
              </div>

              <div className="mt-2 flex flex-col items-center gap-3">
                <button
                  onClick={handleRunAnalysis}
                  disabled={!canRunAnalysis}
                  className="flex min-h-12 w-full max-w-xs items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-45 sm:text-base"
                  style={{ background: canRunAnalysis ? '#06B6D4' : 'rgba(6,182,212,0.22)', color: '#020617' }}
                >
                  {isRunning ? (
                    <>
                      <div className="h-5 w-5 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                      Running Analysis
                    </>
                  ) : (
                    <>
                      <BrainCircuit size={18} />
                      Run Analysis
                    </>
                  )}
                </button>
                {runBlockedReason && !isRunning && (
                  <p className="text-center text-xs text-[#64748B]">{runBlockedReason}</p>
                )}
              </div>
            </motion.div>
          )}

          {runError && !isRunning && (
            <div className="mx-auto flex w-full max-w-2xl items-start gap-3 rounded-lg p-4"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[#EF4444]" />
              <span className="text-sm text-[#EF4444]">{runError}</span>
            </div>
          )}

          {(results || isRunning) && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="border-t border-[rgba(255,255,255,0.05)] pt-10">
              <ResultsPanel
                results={results}
                config={config}
                onReset={handleReset}
                isLoading={isRunning}
              />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
