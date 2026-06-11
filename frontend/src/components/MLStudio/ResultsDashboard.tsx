import { useState, useEffect } from 'react';
import { Download, Sparkles, BarChart2, Activity, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ResultsDashboard({ results, config, onReset }: any) {
  const [insights, setInsights] = useState<string | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/ml-studio/insights`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ results })
        });
        const res = await response.json();
        if (response.ok) {
          setInsights(res.data.insights);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingInsights(false);
      }
    };
    fetchInsights();
  }, [results]);

  const handleDownload = () => {
    window.open(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/ml-studio/download-model/${results.model_id}`, '_blank');
  };

  const renderMetrics = () => {
    if (!results.metrics) return null;
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {Object.entries(results.metrics).map(([key, value]: any) => (
          <div key={key} className="p-4 rounded-xl border" style={{ background: 'rgba(11,20,35,0.6)', borderColor: 'rgba(255,255,255,0.1)' }}>
            <span className="text-xs text-[#94A3B8] uppercase tracking-wider">{key.replace(/_/g, ' ')}</span>
            <p className="text-2xl font-bold text-[#F9FAFB] mt-1">
              {typeof value === 'number' ? (key.includes('percentage') || key === 'accuracy' ? `${(value * (key === 'accuracy' ? 100 : 1)).toFixed(2)}%` : value.toFixed(4)) : value}
            </p>
          </div>
        ))}
      </div>
    );
  };

  const renderFeatureImportance = () => {
    if (!results.feature_importance) return null;
    const maxVal = Math.max(...results.feature_importance.map((f: any) => f.value));
    
    return (
      <div className="p-5 rounded-xl border flex flex-col gap-4" style={{ background: 'rgba(11,20,35,0.6)', borderColor: 'rgba(255,255,255,0.1)' }}>
        <div className="flex items-center gap-2 mb-2">
          <BarChart2 size={18} className="text-[#3B82F6]" />
          <h3 className="font-semibold text-[#F9FAFB]">Feature Importance</h3>
        </div>
        <div className="flex flex-col gap-3">
          {results.feature_importance.map((feat: any, idx: number) => (
            <div key={idx} className="flex items-center gap-3">
              <span className="text-xs text-[#94A3B8] w-24 truncate" title={feat.name}>{feat.name}</span>
              <div className="flex-1 h-2 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(feat.value / maxVal) * 100}%` }}
                  transition={{ duration: 1, delay: idx * 0.1 }}
                  className="h-full bg-gradient-to-r from-[#3B82F6] to-[#06B6D4]"
                />
              </div>
              <span className="text-xs font-mono text-[#CBD5E1] w-10 text-right">{(feat.value).toFixed(3)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderConfusionMatrix = () => {
    if (!results.confusion_matrix) return null;
    const cm = results.confusion_matrix;
    return (
      <div className="p-5 rounded-xl border flex flex-col gap-4" style={{ background: 'rgba(11,20,35,0.6)', borderColor: 'rgba(255,255,255,0.1)' }}>
        <div className="flex items-center gap-2 mb-2">
          <Activity size={18} className="text-[#10B981]" />
          <h3 className="font-semibold text-[#F9FAFB]">Confusion Matrix</h3>
        </div>
        <div className="overflow-x-auto">
           <table className="w-full text-center border-collapse">
             <tbody>
               {cm.map((row: any[], i: number) => (
                 <tr key={i}>
                   {row.map((val: number, j: number) => {
                     const isDiagonal = i === j;
                     return (
                       <td key={j} className="p-3 border text-sm" 
                           style={{ 
                             borderColor: 'rgba(255,255,255,0.1)',
                             background: isDiagonal ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.05)',
                             color: isDiagonal ? '#10B981' : '#F9FAFB'
                           }}>
                         {val}
                       </td>
                     );
                   })}
                 </tr>
               ))}
             </tbody>
           </table>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#F9FAFB]">Model Evaluation</h2>
          <p className="text-sm text-[#94A3B8]">
            {config.algorithm} • {config.taskType} • Target: {config.targetColumn || 'N/A'}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={onReset} className="px-4 py-2 rounded-lg font-medium border border-[rgba(255,255,255,0.1)] text-[#94A3B8] hover:bg-[rgba(255,255,255,0.05)]">
            Train New Model
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all"
            style={{ background: '#06B6D4', color: '#000' }}
          >
            <Download size={16} /> Download .pickle
          </button>
        </div>
      </div>

      {renderMetrics()}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {results.feature_importance && renderFeatureImportance()}
        {results.confusion_matrix && renderConfusionMatrix()}
        
        {/* AI Insights Card */}
        <div className={`p-5 rounded-xl border flex flex-col gap-4 ${!results.feature_importance && !results.confusion_matrix ? 'lg:col-span-2' : ''}`} 
             style={{ background: 'rgba(139,92,246,0.05)', borderColor: 'rgba(139,92,246,0.2)' }}>
          <div className="flex items-center gap-2 pb-3 border-b" style={{ borderColor: 'rgba(139,92,246,0.2)' }}>
            <Sparkles size={18} className="text-[#8B5CF6]" />
            <h3 className="font-semibold text-[#8B5CF6]">AI Insights & Interpretation</h3>
          </div>
          
          <div className="text-sm text-[#CBD5E1] leading-relaxed whitespace-pre-wrap custom-scrollbar overflow-y-auto max-h-[300px]">
            {loadingInsights ? (
              <div className="flex items-center gap-2 text-[#94A3B8]">
                 <span className="animate-pulse">Generating insights...</span>
              </div>
            ) : (
              insights || "No insights could be generated."
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
