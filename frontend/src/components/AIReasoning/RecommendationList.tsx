import { motion } from 'framer-motion';
import { ListChecks } from 'lucide-react';

interface Rec {
  action: string;
  priority: string;
  rationale: string;
  source_models: string[];
  category: string;
}

interface Props {
  recommendations: Rec[];
}

const priorityConfig: Record<string, { text: string; bg: string; border: string; dot: string }> = {
  Immediate: { text: '#EF4444', bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.15)', dot: '#EF4444' },
  High:      { text: '#F97316', bg: 'rgba(249,115,22,0.06)', border: 'rgba(249,115,22,0.15)', dot: '#F97316' },
  Medium:    { text: '#F59E0B', bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.15)', dot: '#F59E0B' },
  Low:       { text: '#10B981', bg: 'rgba(16,185,129,0.06)', border: 'rgba(16,185,129,0.15)', dot: '#10B981' },
};

export default function RecommendationList({ recommendations }: Props) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <ListChecks size={16} className="text-[#3B82F6]" />
        <h3 className="text-sm font-bold uppercase tracking-widest text-[#3B82F6]">
          Recommendations ({recommendations.length})
        </h3>
      </div>

      <div className="space-y-2.5">
        {recommendations.map((rec, i) => {
          const config = priorityConfig[rec.priority] || priorityConfig['Medium'];

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-start gap-3 rounded-xl border px-4 py-3"
              style={{ background: config.bg, borderColor: config.border }}
            >
              <div className="mt-1.5">
                <span className="block h-2 w-2 rounded-full" style={{ background: config.dot }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: config.text }}
                  >
                    {rec.priority}
                  </span>
                  <span className="text-[10px] text-[#475569] capitalize">• {rec.category}</span>
                </div>
                <p className="text-sm text-[#E2E8F0] leading-snug">{rec.action}</p>
                {rec.rationale && (
                  <p className="mt-1 text-[10px] text-[#64748B] leading-relaxed">{rec.rationale}</p>
                )}
                {rec.source_models.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {rec.source_models.map((m) => (
                      <span key={m} className="text-[9px] rounded px-1.5 py-0.5" style={{ background: 'rgba(255,255,255,0.04)', color: '#64748B' }}>
                        {m}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
