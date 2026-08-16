import { motion } from 'framer-motion';
import { GitMerge } from 'lucide-react';

interface FeatureAgreement {
  feature: string;
  supporting_models: string[];
  agreement_count: number;
}

interface ConflictingFinding {
  description: string;
  models_involved: string[];
}

interface ConsensusData {
  agreement_score: number;
  agreed_features: FeatureAgreement[];
  conflicting_findings: ConflictingFinding[];
  total_models: number;
  summary: string;
}

interface Props {
  consensus: ConsensusData;
}

export default function ConsensusMatrix({ consensus }: Props) {
  const agrPct = Math.round(consensus.agreement_score * 100);

  // Collect all unique models
  const allModels = new Set<string>();
  consensus.agreed_features.forEach((fa) => fa.supporting_models.forEach((m) => allModels.add(m)));
  const modelList = Array.from(allModels);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border overflow-hidden"
      style={{ background: 'rgba(11,20,35,0.85)', borderColor: 'rgba(255,255,255,0.06)' }}
    >
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <GitMerge size={16} className="text-[#06B6D4]" />
            <h3 className="text-sm font-bold uppercase tracking-widest text-[#06B6D4]">
              Model Consensus
            </h3>
          </div>
          <div
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
            style={{
              background: agrPct >= 70 ? 'rgba(16,185,129,0.08)' : agrPct >= 40 ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)',
              border: `1px solid ${agrPct >= 70 ? 'rgba(16,185,129,0.2)' : agrPct >= 40 ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)'}`,
            }}
          >
            <span
              className="text-xs font-bold"
              style={{ color: agrPct >= 70 ? '#10B981' : agrPct >= 40 ? '#F59E0B' : '#EF4444' }}
            >
              {agrPct}% Agreement
            </span>
          </div>
        </div>

        <p className="text-xs text-[#94A3B8] mb-4">{consensus.summary}</p>

        {/* Feature × Model Matrix */}
        {consensus.agreed_features.length > 0 && modelList.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-[#475569] pb-2 pr-3">Feature</th>
                  {modelList.map((model) => (
                    <th key={model} className="text-center text-[10px] font-semibold uppercase tracking-wider text-[#475569] pb-2 px-2 max-w-[100px] truncate" title={model}>
                      {model.length > 12 ? model.slice(0, 12) + '…' : model}
                    </th>
                  ))}
                  <th className="text-center text-[10px] font-semibold uppercase tracking-wider text-[#475569] pb-2 px-2">#</th>
                </tr>
              </thead>
              <tbody>
                {consensus.agreed_features.slice(0, 10).map((fa, i) => (
                  <tr key={i} className="border-t" style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
                    <td className="py-2 pr-3 text-[#CBD5E1] font-medium capitalize">{fa.feature}</td>
                    {modelList.map((model) => {
                      const agrees = fa.supporting_models.includes(model);
                      return (
                        <td key={model} className="py-2 px-2 text-center">
                          {agrees ? (
                            <span className="inline-block h-3.5 w-3.5 rounded" style={{ background: 'rgba(6,182,212,0.3)', border: '1px solid rgba(6,182,212,0.5)' }} />
                          ) : (
                            <span className="inline-block h-3.5 w-3.5 rounded" style={{ background: 'rgba(255,255,255,0.03)' }} />
                          )}
                        </td>
                      );
                    })}
                    <td className="py-2 px-2 text-center font-bold text-[#06B6D4]">{fa.agreement_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Conflicts */}
        {consensus.conflicting_findings.length > 0 && (
          <div className="mt-4 pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-[#EF4444] mb-2">Conflicts</h4>
            {consensus.conflicting_findings.map((cf, i) => (
              <div key={i} className="flex items-start gap-2 mb-2 text-xs text-[#F87171] rounded-lg p-2" style={{ background: 'rgba(239,68,68,0.05)' }}>
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#EF4444]" />
                {cf.description}
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
