import { motion } from 'framer-motion';
import { Gauge } from 'lucide-react';

interface Props {
  confidence: {
    overall_confidence: number;
    confidence_level: string;
    component_scores: Record<string, number>;
    adjustments_applied: string[];
  } | null;
}

const levelColors: Record<string, { text: string; ring: string; bg: string }> = {
  'Very High': { text: '#10B981', ring: '#10B981', bg: 'rgba(16,185,129,0.08)' },
  'High':      { text: '#06B6D4', ring: '#06B6D4', bg: 'rgba(6,182,212,0.08)' },
  'Medium':    { text: '#F59E0B', ring: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
  'Low':       { text: '#EF4444', ring: '#EF4444', bg: 'rgba(239,68,68,0.08)' },
};

export default function ConfidenceMeter({ confidence }: Props) {
  if (!confidence) return null;

  const pct = Math.round(confidence.overall_confidence * 100);
  const level = confidence.confidence_level;
  const colors = levelColors[level] || levelColors['Medium'];

  // SVG circular gauge
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - confidence.overall_confidence);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center rounded-xl border p-5"
      style={{ background: 'rgba(11,20,35,0.85)', borderColor: 'rgba(255,255,255,0.06)' }}
    >
      <div className="flex items-center gap-2 mb-4 self-start">
        <Gauge size={16} style={{ color: colors.text }} />
        <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: colors.text }}>
          Confidence
        </h3>
      </div>

      {/* Circular gauge */}
      <div className="relative mb-3">
        <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
          {/* Background ring */}
          <circle cx="70" cy="70" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
          {/* Progress ring */}
          <motion.circle
            cx="70" cy="70" r={radius}
            fill="none"
            stroke={colors.ring}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold" style={{ color: colors.text }}>{pct}%</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: colors.text }}>{level}</span>
        </div>
      </div>

      {/* Component scores */}
      {Object.keys(confidence.component_scores).length > 0 && (
        <div className="w-full mt-2 space-y-1.5">
          {Object.entries(confidence.component_scores).map(([key, score]) => (
            <div key={key} className="flex items-center gap-2">
              <span className="w-24 truncate text-[10px] text-[#64748B] capitalize">{key}</span>
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: colors.ring }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.round(score * 100)}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
              <span className="w-8 text-right text-[10px] font-mono text-[#94A3B8]">{Math.round(score * 100)}%</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
