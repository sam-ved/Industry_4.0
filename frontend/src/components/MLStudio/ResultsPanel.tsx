import { useState, useEffect } from 'react';
import { RotateCcw, Cpu, Bot, CheckCircle2, Circle, AlertTriangle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import AIChatDrawer from '../common/AIChatDrawer';
import AutoMLResultsDashboard from './AutoMLResultsDashboard';

interface ResultsPanelProps {
  results: any;
  config: any;
  onReset: () => void;
  isLoading: boolean;
}

const STAGES = [
  'Validating dataset...',
  'Preparing features...',
  'Preprocessing data...',
  'Training model...',
  'Evaluating performance...',
  'Generating insights...',
];

export default function ResultsPanel({ results, config, onReset, isLoading }: ResultsPanelProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  // Advance stages based on elapsed time (not fake progress, but staged messages)
  useEffect(() => {
    if (!isLoading) {
      setCurrentStage(0);
      setElapsed(0);
      return;
    }

    const stageTimer = setInterval(() => {
      setCurrentStage(prev => Math.min(prev + 1, STAGES.length - 1));
    }, 1500);

    const elapsedTimer = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(stageTimer);
      clearInterval(elapsedTimer);
    };
  }, [isLoading]);

  // ── Loading State ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-full max-w-md p-8 rounded-2xl border flex flex-col items-center text-center"
          style={{ background: 'rgba(11,20,35,0.85)', borderColor: 'rgba(6,182,212,0.2)' }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
            className="mb-6 p-4 rounded-full border border-[rgba(6,182,212,0.25)] bg-[rgba(6,182,212,0.05)]"
          >
            <Cpu size={28} className="text-[#06B6D4]" />
          </motion.div>

          <h3 className="text-base font-bold text-[#F9FAFB] mb-1">Running Analysis</h3>
          <p className="text-xs text-[#64748B] mb-6">
            {config.algorithm && config.algorithm !== 'auto'
              ? `Training ${config.algorithm.replace(/_/g, ' ')}...`
              : 'Evaluating multiple candidate models...'
            }
          </p>

          {/* Stage indicators */}
          <div className="w-full flex flex-col gap-2 mb-5 text-left">
            {STAGES.map((stage, i) => (
              <div key={i} className="flex items-center gap-2.5">
                {i < currentStage ? (
                  <CheckCircle2 size={14} className="text-[#10B981] flex-shrink-0" />
                ) : i === currentStage ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="flex-shrink-0"
                  >
                    <Circle size={14} className="text-[#06B6D4]" />
                  </motion.div>
                ) : (
                  <Circle size={14} className="text-[#334155] flex-shrink-0" />
                )}
                <span className={`text-xs ${
                  i < currentStage ? 'text-[#10B981]'
                    : i === currentStage ? 'text-[#06B6D4] font-medium'
                      : 'text-[#475569]'
                }`}>
                  {stage}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 text-[10px] text-[#475569]">
            <Clock size={10} />
            <span>Elapsed: {elapsed}s</span>
          </div>
        </div>
      </div>
    );
  }

  if (!results) return null;

  // ── Error / Failed State ───────────────────────────────────────────────────
  if (results.success === false || results.status === 'failed' || results.status === 'timeout') {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-full max-w-lg p-6 rounded-xl border flex flex-col gap-4"
          style={{
            background: results.status === 'timeout' ? 'rgba(249,115,22,0.06)' : 'rgba(239,68,68,0.06)',
            borderColor: results.status === 'timeout' ? 'rgba(249,115,22,0.2)' : 'rgba(239,68,68,0.2)'
          }}>
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} className={results.status === 'timeout' ? 'text-[#F97316]' : 'text-[#EF4444]'} />
            <h3 className="text-base font-bold text-[#F9FAFB]">
              {results.status === 'timeout' ? 'Analysis Timed Out' : 'Analysis Failed'}
            </h3>
          </div>

          <p className="text-sm text-[#CBD5E1]">{results.message || 'An unexpected error occurred.'}</p>

          {results.suggestion && (
            <div className="p-3 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]">
              <p className="text-xs text-[#94A3B8]">
                <span className="font-semibold text-[#CBD5E1]">Suggestion: </span>
                {results.suggestion}
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={onReset}
            className="flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all hover:bg-[rgba(6,182,212,0.08)] mt-2"
            style={{ border: '1px solid rgba(6,182,212,0.3)', color: '#06B6D4' }}
          >
            <RotateCcw size={14} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const taskType = results.task_type || config.taskType;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#F9FAFB]">Analysis Results</h2>
          <p className="text-sm text-[#64748B] mt-0.5">
            {taskType}
            {config.targetColumn && (
              <>
                <span className="mx-2 text-[rgba(255,255,255,0.15)]">/</span>
                Target: <span className="text-[#94A3B8]">{config.targetColumn}</span>
              </>
            )}
            {results.execution_time && (
              <>
                <span className="mx-2 text-[rgba(255,255,255,0.15)]">/</span>
                <span className="text-[#10B981]">{results.execution_time}s</span>
              </>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setIsChatOpen(true)}
            className="flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all hover:bg-[rgba(168,85,247,0.15)] bg-[rgba(168,85,247,0.1)] border border-[rgba(168,85,247,0.3)] text-[#C084FC]">
            <Bot size={16} />
            Ask AI
          </button>
          <button type="button" onClick={onReset}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-5 py-2 text-sm font-medium transition-all hover:bg-[rgba(6,182,212,0.08)] sm:w-auto"
            style={{ border: '1px solid rgba(6,182,212,0.3)', color: '#06B6D4' }}>
            <RotateCcw size={14} />
            Run New Analysis
          </button>
        </div>
      </div>

      <AutoMLResultsDashboard results={results} />

      <AIChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        contextData={results}
        module="ML Studio"
      />
    </div>
  );
}
