import { motion } from 'framer-motion';
import { FileText, Sparkles } from 'lucide-react';

interface Props {
  summary: string;
  llmNarrative: any;
}

export default function ExecutiveSummary({ summary, llmNarrative }: Props) {
  const keyFindings: string[] = llmNarrative?.key_findings || [];
  const businessImpact: string = llmNarrative?.business_impact || '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-xl border overflow-hidden"
      style={{
        background: 'rgba(11,20,35,0.85)',
        borderColor: 'rgba(139,92,246,0.15)',
      }}
    >
      {/* Gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(90deg, #8B5CF6, #6D28D9, transparent)' }} />

      <div className="p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-3">
          <FileText size={16} className="text-[#A78BFA]" />
          <h3 className="text-sm font-bold uppercase tracking-widest text-[#A78BFA]">Executive Summary</h3>
          {llmNarrative && (
            <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: 'rgba(139,92,246,0.1)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.2)' }}>
              <Sparkles size={10} /> AI-Enhanced
            </span>
          )}
        </div>

        <p className="text-sm leading-relaxed text-[#CBD5E1]">{summary}</p>

        {keyFindings.length > 0 && (
          <div className="mt-4 pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-2">Key Findings</h4>
            <ul className="space-y-2">
              {keyFindings.map((finding: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-xs text-[#94A3B8]">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#A78BFA]" />
                  {finding}
                </li>
              ))}
            </ul>
          </div>
        )}

        {businessImpact && (
          <div className="mt-4 pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-2">Business Impact</h4>
            <p className="text-xs leading-relaxed text-[#94A3B8]">{businessImpact}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
