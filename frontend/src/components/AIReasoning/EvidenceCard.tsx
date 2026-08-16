import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  finding: {
    model: string;
    task_type: string;
    status: string;
    finding: string;
    confidence: number;
    severity: string;
    important_features: string[];
    metrics: Record<string, any>;
    supporting_evidence: string[];
    explainability: any;
  };
}

const taskIcons: Record<string, string> = {
  classification: '🎯',
  regression: '📈',
  clustering: '🔬',
  anomaly: '🚨',
  pca: '📊',
  correlation: '🔗',
  feature_importance: '⭐',
  statistics: '📋',
};

const severityColors: Record<string, { text: string; bg: string; border: string }> = {
  Critical: { text: '#EF4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' },
  High:     { text: '#F97316', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.2)' },
  Medium:   { text: '#F59E0B', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
  Low:      { text: '#10B981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
  Info:     { text: '#06B6D4', bg: 'rgba(6,182,212,0.08)', border: 'rgba(6,182,212,0.2)' },
};

export default function EvidenceCard({ finding }: Props) {
  const [expanded, setExpanded] = useState(false);

  const icon = taskIcons[finding.task_type] || '🔍';
  const colors = severityColors[finding.severity] || severityColors['Info'];
  const confPct = Math.round(finding.confidence * 100);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-xl border overflow-hidden"
      style={{ background: 'rgba(11,20,35,0.85)', borderColor: colors.border }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-start gap-3 px-4 py-3.5 text-left"
      >
        <span className="text-lg mt-0.5">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-[#F9FAFB] truncate">{finding.model}</span>
            <span
              className="text-[10px] font-semibold rounded-full px-2 py-0.5"
              style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
            >
              {finding.severity}
            </span>
          </div>
          <p className="mt-1 text-xs text-[#94A3B8] leading-relaxed">{finding.finding}</p>
          <div className="mt-1.5 flex items-center gap-3">
            <span className="text-[10px] text-[#64748B]">
              Confidence: <span className="font-semibold text-[#CBD5E1]">{confPct}%</span>
            </span>
            <span className="text-[10px] text-[#64748B] capitalize">{finding.task_type}</span>
          </div>
        </div>
        {expanded
          ? <ChevronUp size={14} className="text-[#64748B] shrink-0 mt-1" />
          : <ChevronDown size={14} className="text-[#64748B] shrink-0 mt-1" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              {/* Important features */}
              {finding.important_features.length > 0 && (
                <div className="pt-3">
                  <h5 className="text-[10px] font-semibold uppercase tracking-wider text-[#475569] mb-1.5">Key Features</h5>
                  <div className="flex flex-wrap gap-1.5">
                    {finding.important_features.map((feat) => (
                      <span key={feat} className="text-[10px] font-medium rounded px-2 py-0.5 capitalize" style={{ background: 'rgba(6,182,212,0.08)', color: '#06B6D4', border: '1px solid rgba(6,182,212,0.15)' }}>
                        {feat}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Supporting evidence */}
              {finding.supporting_evidence.length > 0 && (
                <div>
                  <h5 className="text-[10px] font-semibold uppercase tracking-wider text-[#475569] mb-1.5">Evidence</h5>
                  <ul className="space-y-1">
                    {finding.supporting_evidence.map((ev, j) => (
                      <li key={j} className="flex items-start gap-2 text-[10px] text-[#94A3B8]">
                        <span className="mt-1 h-1 w-1 shrink-0 rounded-full" style={{ background: colors.text }} />
                        {ev}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Explainability */}
              {finding.explainability && finding.explainability.top_features?.length > 0 && (
                <div>
                  <h5 className="text-[10px] font-semibold uppercase tracking-wider text-[#475569] mb-1.5">
                    Explainability ({finding.explainability.method})
                  </h5>
                  <div className="space-y-1">
                    {finding.explainability.top_features.slice(0, 5).map((feat: any, j: number) => (
                      <div key={j} className="flex items-center gap-2">
                        <span className="w-20 truncate text-[10px] text-[#94A3B8] capitalize">{feat.name}</span>
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(100, feat.value * 200)}%`,
                              background: feat.direction === 'Negative' ? '#F87171' : '#06B6D4',
                            }}
                          />
                        </div>
                        <span className="w-12 text-right text-[10px] font-mono text-[#64748B]">{feat.value.toFixed(3)}</span>
                        {feat.direction && (
                          <span className="text-[9px] w-4" style={{ color: feat.direction === 'Negative' ? '#F87171' : '#10B981' }}>
                            {feat.direction === 'Negative' ? '▼' : '▲'}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Metrics */}
              {Object.keys(finding.metrics).length > 0 && (
                <div>
                  <h5 className="text-[10px] font-semibold uppercase tracking-wider text-[#475569] mb-1.5">Metrics</h5>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {Object.entries(finding.metrics).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between text-[10px]">
                        <span className="text-[#64748B] capitalize">{k.replace(/_/g, ' ')}</span>
                        <span className="font-mono text-[#CBD5E1]">{typeof v === 'number' ? v.toFixed(4) : String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
