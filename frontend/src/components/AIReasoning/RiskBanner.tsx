import { AlertTriangle, ShieldCheck, Zap } from 'lucide-react';

interface RiskBannerProps {
  riskLevel: 'High' | 'Medium' | 'Low' | string;
  llmUsed?: boolean;
}

export default function RiskBanner({ riskLevel, llmUsed }: RiskBannerProps) {
  let color = 'text-green-400';
  let bg = 'bg-green-500/10';
  let border = 'border-green-500/20';
  let Icon = ShieldCheck;

  if (riskLevel === 'High') {
    color = 'text-red-400';
    bg = 'bg-red-500/10';
    border = 'border-red-500/20';
    Icon = AlertTriangle;
  } else if (riskLevel === 'Medium') {
    color = 'text-yellow-400';
    bg = 'bg-yellow-500/10';
    border = 'border-yellow-500/20';
    Icon = Zap;
  }

  return (
    <div className={`flex items-center justify-between p-4 rounded-xl border ${bg} ${border}`}>
      <div className="flex items-center gap-3">
        <Icon size={24} className={color} />
        <div>
          <h3 className={`font-bold ${color}`}>Overall Risk Level: {riskLevel}</h3>
          <p className="text-sm text-slate-300">Based on multi-model consensus and anomaly detection.</p>
        </div>
      </div>
      {llmUsed && (
        <div className="px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-semibold">
          LLM Enhanced
        </div>
      )}
    </div>
  );
}
