import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';

interface RootCause {
  cause: string;
  confidence: number;
  evidence: string[];
  contributing_features: string[];
  supporting_models: string[];
  alternative_causes: string[];
}

interface Props {
  rootCauses: RootCause[];
}

export default function RootCausePanel({ rootCauses }: Props) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Search size={16} className="text-[#F59E0B]" />
        <h3 className="text-sm font-bold uppercase tracking-widest text-[#F59E0B]">
          Root Cause Analysis ({rootCauses.length})
        </h3>
      </div>

      <div className="space-y-3">
        {rootCauses.map((rc, index) => {
          const isExpanded = expandedIndex === index;
          const confPct = Math.round(rc.confidence * 100);

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="rounded-xl border overflow-hidden"
              style={{
                background: 'rgba(11,20,35,0.85)',
                borderColor: index === 0 ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.06)',
              }}
            >
              <button
                onClick={() => setExpandedIndex(isExpanded ? null : index)}
                className="flex w-full items-start gap-3 px-5 py-4 text-left"
              >
                <div
                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold"
                  style={{
                    background: index === 0 ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.04)',
                    color: index === 0 ? '#F59E0B' : '#64748B',
                  }}
                >
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#F9FAFB] leading-snug">{rc.cause}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-semibold rounded-full px-2 py-0.5" style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B' }}>
                      {confPct}% confidence
                    </span>
                    {rc.supporting_models.map((m) => (
                      <span key={m} className="text-[10px] text-[#64748B] rounded-full px-2 py-0.5" style={{ background: 'rgba(255,255,255,0.04)' }}>
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
                {isExpanded
                  ? <ChevronUp size={16} className="text-[#64748B] shrink-0 mt-1" />
                  : <ChevronDown size={16} className="text-[#64748B] shrink-0 mt-1" />}
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-4 space-y-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                      {/* Evidence */}
                      {rc.evidence.length > 0 && (
                        <div className="pt-3">
                          <h5 className="text-[10px] font-semibold uppercase tracking-wider text-[#475569] mb-1.5">Evidence</h5>
                          <ul className="space-y-1">
                            {rc.evidence.map((ev, j) => (
                              <li key={j} className="flex items-start gap-2 text-xs text-[#94A3B8]">
                                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#F59E0B]" />
                                {ev}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Contributing features */}
                      {rc.contributing_features.length > 0 && (
                        <div>
                          <h5 className="text-[10px] font-semibold uppercase tracking-wider text-[#475569] mb-1.5">Contributing Features</h5>
                          <div className="flex flex-wrap gap-1.5">
                            {rc.contributing_features.map((feat) => (
                              <span key={feat} className="text-[10px] font-medium rounded px-2 py-0.5" style={{ background: 'rgba(245,158,11,0.08)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.15)' }}>
                                {feat}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Alternatives */}
                      {rc.alternative_causes.length > 0 && (
                        <div>
                          <h5 className="text-[10px] font-semibold uppercase tracking-wider text-[#475569] mb-1.5">Alternatives</h5>
                          <ul className="space-y-1">
                            {rc.alternative_causes.map((alt, j) => (
                              <li key={j} className="text-[10px] text-[#64748B]">• {alt}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
