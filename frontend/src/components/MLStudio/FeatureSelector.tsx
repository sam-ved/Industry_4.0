import { useState, useEffect } from 'react';
import { Target, CheckSquare, Wand2, Sparkles, Loader2 } from 'lucide-react';

export default function FeatureSelector({ data, config, setConfig, onNext, onBack }: any) {
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<any>(null);

  useEffect(() => {
    // If target column is selected but features aren't, maybe fetch suggestions
    if (config.targetColumn && config.features.length === 0 && !suggestions) {
      fetchSuggestions(config.targetColumn);
    }
  }, [config.targetColumn]);

  const fetchSuggestions = async (targetCol: string) => {
    if (!targetCol) return;
    setLoadingSuggestions(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/ml-studio/feature-suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_id: data.file_id, target_column: targetCol })
      });
      const res = await response.json();
      if (response.ok && res.data && !res.data.error) {
        setSuggestions(res.data);
        // Automatically select top features
        const topFeats = res.data.top_features.map((f: any) => f.feature);
        setConfig({ ...config, features: topFeats });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const toggleFeature = (col: string) => {
    if (config.features.includes(col)) {
      setConfig({ ...config, features: config.features.filter((f: string) => f !== col) });
    } else {
      setConfig({ ...config, features: [...config.features, col] });
    }
  };

  const handleTargetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setConfig({ ...config, targetColumn: val, features: [] });
    setSuggestions(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#F9FAFB]">Feature Engineering</h2>
          <p className="text-sm text-[#94A3B8]">Select your target variable and the features to use for training.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onBack} className="px-6 py-2 rounded-lg font-medium border border-[rgba(255,255,255,0.1)] text-[#94A3B8] hover:bg-[rgba(255,255,255,0.05)]">
            Back
          </button>
          <button
            onClick={onNext}
            disabled={!config.targetColumn || config.features.length === 0}
            className="px-6 py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: '#06B6D4', color: '#000' }}
          >
            Choose Algorithm
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Target Selection */}
        <div className="p-5 rounded-xl border flex flex-col gap-4" style={{ background: 'rgba(11,20,35,0.6)', borderColor: 'rgba(255,255,255,0.1)' }}>
          <div className="flex items-center gap-2">
            <Target size={18} className="text-[#06B6D4]" />
            <h3 className="font-semibold text-[#F9FAFB]">Target Variable</h3>
          </div>
          <p className="text-sm text-[#94A3B8]">The column you want the model to predict.</p>
          <select
            value={config.targetColumn}
            onChange={handleTargetChange}
            className="w-full p-2.5 rounded-lg border outline-none text-sm"
            style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: '#F9FAFB' }}
          >
            <option value="">-- Select Target --</option>
            {data.columns_list.map((col: string) => (
              <option key={col} value={col}>{col} ({data.dtypes[col]})</option>
            ))}
          </select>

          {suggestions && (
             <div className="mt-4 p-4 rounded-lg flex gap-3" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
               <Sparkles size={18} className="text-[#10B981] flex-shrink-0 mt-0.5" />
               <div>
                 <p className="text-sm text-[#10B981] font-medium mb-1">AI Suggestion</p>
                 <p className="text-xs text-[#10B981] opacity-80">
                   Detected this as a {suggestions.target_type} task. Automatically selected top {suggestions.top_features?.length} numeric features based on correlation.
                 </p>
               </div>
             </div>
          )}
        </div>

        {/* Feature Selection */}
        <div className="lg:col-span-2 p-5 rounded-xl border flex flex-col gap-4" style={{ background: 'rgba(11,20,35,0.6)', borderColor: 'rgba(255,255,255,0.1)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckSquare size={18} className="text-[#3B82F6]" />
              <h3 className="font-semibold text-[#F9FAFB]">Feature Selection</h3>
            </div>
            {config.targetColumn && (
              <button
                onClick={() => fetchSuggestions(config.targetColumn)}
                disabled={loadingSuggestions}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border"
                style={{ background: 'rgba(59,130,246,0.1)', borderColor: 'rgba(59,130,246,0.2)', color: '#3B82F6' }}
              >
                {loadingSuggestions ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                Auto-Select Features
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
            {data.columns_list.map((col: string) => {
              if (col === config.targetColumn) return null;
              const isSelected = config.features.includes(col);
              return (
                <div
                  key={col}
                  onClick={() => toggleFeature(col)}
                  className={`flex flex-col p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-[#3B82F6] bg-[rgba(59,130,246,0.1)]' 
                      : 'border-[rgba(255,255,255,0.1)] hover:border-[#94A3B8] bg-[rgba(255,255,255,0.02)]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-[#F9FAFB] truncate pr-2">{col}</span>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-[#3B82F6] border-[#3B82F6]' : 'border-[#64748B]'}`}>
                      {isSelected && <CheckSquare size={12} className="text-white" />}
                    </div>
                  </div>
                  <span className="text-[10px] text-[#94A3B8]">{data.dtypes[col]}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
