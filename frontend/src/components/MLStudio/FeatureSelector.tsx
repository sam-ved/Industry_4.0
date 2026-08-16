import { useState, useEffect, useCallback, useRef, type Dispatch, type SetStateAction } from 'react';
import { Target, CheckSquare, Wand2, Sparkles, Loader2, Hash, Search, ChevronDown, Check, Type, Square } from 'lucide-react';
import { mlStudioAPI } from '../../services/api';

interface FeatureSelectorProps {
  data: any;
  config: any;
  setConfig: Dispatch<SetStateAction<any>>;
}

export default function FeatureSelector({ data, config, setConfig }: FeatureSelectorProps) {
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Combobox state
  const [isTargetOpen, setIsTargetOpen] = useState(false);
  const [targetSearch, setTargetSearch] = useState('');
  const comboboxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (comboboxRef.current && !comboboxRef.current.contains(event.target as Node)) {
        setIsTargetOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = useCallback(async (targetCol: string) => {
    if (!targetCol) return;
    setLoadingSuggestions(true);
    try {
      const res = await mlStudioAPI.suggestFeatures(data.file_id, targetCol);
      if (res.data && !res.data.error) {
        setSuggestions(res.data);
        
        // Remove target column from auto-selected features
        let topFeats = res.data.top_features.map((f: any) => f.feature);
        if (targetCol) {
          topFeats = topFeats.filter((f: string) => f !== targetCol);
        }
        
        setConfig((current: any) => {
          const targetType = res.data.target_type || current.taskType;
          return {
            ...current,
            features: topFeats,
            taskType: targetType,
            // If algorithm is not set, set it to 'auto' so that validation passes
            algorithm: current.algorithm || 'auto'
          };
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSuggestions(false);
    }
  }, [data.file_id, setConfig]);

  useEffect(() => {
    if (config.targetColumn && config.features.length === 0 && !suggestions && !loadingSuggestions) {
      void fetchSuggestions(config.targetColumn);
    }
  }, [
    config.features.length,
    config.targetColumn,
    fetchSuggestions,
    loadingSuggestions,
    suggestions,
  ]);

  const toggleFeature = (col: string) => {
    setConfig((current: any) => {
      const features = current.features.includes(col)
        ? current.features.filter((feature: string) => feature !== col)
        : [...current.features, col];

      return { ...current, features };
    });
  };

  const selectAll = () => {
    const allCols = data.columns_list?.filter((c: string) => c !== config.targetColumn) || [];
    setConfig((current: any) => ({ ...current, features: allCols }));
  };

  const deselectAll = () => {
    setConfig((current: any) => ({ ...current, features: [] }));
  };

  const selectAllNumeric = () => {
    const numericCols = (data.numerical_columns || []).filter((c: string) => c !== config.targetColumn);
    setConfig((current: any) => ({ ...current, features: numericCols }));
  };

  const selectAllCategorical = () => {
    const numericCols = data.numerical_columns || [];
    const catCols = (data.columns_list || []).filter((c: string) => c !== config.targetColumn && !numericCols.includes(c));
    setConfig((current: any) => ({ ...current, features: catCols }));
  };

  const handleTargetChange = (val: string) => {
    setConfig((current: any) => ({ ...current, targetColumn: val, features: [] }));
    setSuggestions(null);
    setIsTargetOpen(false);
    setTargetSearch('');
  };

  const availableColumns = data.columns_list?.filter((col: string) => col !== config.targetColumn) || [];
  const filteredColumns = availableColumns.filter((col: string) => col.toLowerCase().includes(searchTerm.toLowerCase()));
  const targetFilteredCols = data.columns_list?.filter((col: string) => col.toLowerCase().includes(targetSearch.toLowerCase())) || [];
  
  const selectedCount = config.features.length;
  const totalAvailable = availableColumns.length;
  const supervisedMode = config.taskType === 'classification' || config.taskType === 'regression';

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#F9FAFB]">Feature Selection</h2>
          <p className="text-sm text-[#64748B] mt-0.5">
            Choose a target variable and the features to use for analysis.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        {/* Target Column Section */}
        <div className="p-5 rounded-xl border flex flex-col gap-4"
          style={{ background: 'rgba(11,20,35,0.6)', borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-2">
            <Target size={16} className="text-[#06B6D4]" />
            <h3 className="font-semibold text-sm text-[#F9FAFB]">Target Variable</h3>
          </div>
          <p className="text-xs text-[#64748B]">
            {supervisedMode
              ? 'Required for the selected supervised algorithm.'
              : 'Use a target for supervised models, or leave it blank for unsupervised analysis.'}
          </p>

          {/* Searchable Combobox */}
          <div className="relative w-full md:w-1/2" ref={comboboxRef}>
            <button
              type="button"
              onClick={() => setIsTargetOpen(!isTargetOpen)}
              className="flex w-full items-center justify-between rounded-lg border p-2.5 text-sm transition-colors outline-none"
              style={{
                background: '#0f172a',
                borderColor: isTargetOpen ? 'rgba(139,92,246,0.5)' : 'rgba(139,92,246,0.3)',
                color: '#ffffff'
              }}
            >
              <span className="truncate">
                {config.targetColumn ? (
                  <span className="flex items-center gap-2">
                    {config.targetColumn}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${data.numerical_columns?.includes(config.targetColumn) ? 'bg-[rgba(16,185,129,0.1)] text-[#10B981]' : 'bg-[rgba(249,115,22,0.1)] text-[#F97316]'}`}>
                      {data.numerical_columns?.includes(config.targetColumn) ? 'NUM' : 'CAT'}
                    </span>
                  </span>
                ) : (
                  <span className="text-[#64748B]">Select target (optional)</span>
                )}
              </span>
              <ChevronDown size={16} className={`text-[#64748B] transition-transform ${isTargetOpen ? 'rotate-180' : ''}`} />
            </button>

            {isTargetOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-50 overflow-hidden rounded-lg border shadow-xl flex flex-col"
                style={{
                  background: '#0f172a',
                  borderColor: 'rgba(139,92,246,0.3)',
                  maxHeight: '300px'
                }}>
                <div className="sticky top-0 p-2 border-b z-10" style={{ background: '#0f172a', borderColor: 'rgba(255,255,255,0.08)' }}>
                  <div className="relative">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
                    <input
                      type="text"
                      placeholder="Search columns..."
                      value={targetSearch}
                      onChange={(e) => setTargetSearch(e.target.value)}
                      className="w-full rounded-md py-1.5 pl-8 pr-3 text-xs outline-none bg-transparent"
                      style={{ color: '#ffffff', border: '1px solid rgba(255,255,255,0.1)' }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
                <div className="overflow-y-auto custom-scrollbar flex-1 p-1">
                  <button
                    type="button"
                    onClick={() => handleTargetChange('')}
                    className="flex w-full items-center p-2 rounded-md text-xs text-left transition-colors hover:bg-[rgba(139,92,246,0.15)]"
                    style={{ color: '#ffffff' }}
                  >
                    Clear selection
                  </button>
                  {targetFilteredCols.map((col: string) => {
                    const isNum = data.numerical_columns?.includes(col);
                    const isSelected = col === config.targetColumn;
                    return (
                      <button
                        type="button"
                        key={col}
                        onClick={() => handleTargetChange(col)}
                        title={`Type: ${data.dtypes?.[col]}`}
                        className="flex w-full items-center justify-between p-2 rounded-md text-xs transition-colors"
                        style={{
                          background: isSelected ? 'rgba(139,92,246,0.2)' : 'transparent',
                          color: '#ffffff',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(139,92,246,0.15)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = isSelected ? 'rgba(139,92,246,0.2)' : 'transparent')}
                      >
                        <span className="flex items-center gap-2 truncate">
                          {isSelected && <Check size={14} className="text-[#A78BFA] flex-shrink-0" />}
                          <span className={isSelected ? 'font-semibold text-[#A78BFA]' : ''}>{col}</span>
                        </span>
                        <span className={`flex-shrink-0 text-[9px] px-1.5 py-0.5 rounded-full font-medium ${isNum ? 'bg-[rgba(16,185,129,0.1)] text-[#10B981]' : 'bg-[rgba(249,115,22,0.1)] text-[#F97316]'}`}>
                          {isNum ? 'NUM' : 'CAT'}
                        </span>
                      </button>
                    );
                  })}
                  {targetFilteredCols.length === 0 && (
                    <div className="p-3 text-center text-xs text-[#64748B]">No columns found</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* AI Suggestion badge */}
          {suggestions && (
            <div className="p-3.5 rounded-lg flex gap-3 w-full md:w-1/2"
              style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
              <Sparkles size={16} className="text-[#10B981] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-[#10B981] font-semibold mb-0.5">Auto-Detected</p>
                <p className="text-[11px] text-[#10B981] opacity-80 leading-relaxed">
                  Regression task detected. Top candidate features selected using target association and data-quality checks.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Feature Grid Section */}
        <div className="p-5 rounded-xl border flex flex-col gap-4"
          style={{ background: 'rgba(11,20,35,0.6)', borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <CheckSquare size={16} className="text-[#3B82F6]" />
                <h3 className="font-semibold text-sm text-[#F9FAFB]">Features</h3>
              </div>
              <p className="text-xs text-[#64748B]">Selected Features: <span className="font-semibold text-[#F9FAFB]">{selectedCount}</span> / {totalAvailable}</p>
            </div>
            
            {availableColumns.length > 0 && (
                <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
                  <div className="relative min-w-[180px] flex-1 sm:flex-none">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
                    <input
                      type="text"
                      placeholder="Search features..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full rounded-lg border py-1.5 pl-8 pr-3 text-xs outline-none sm:w-48"
                      style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.1)', color: '#F9FAFB' }}
                    />
                  </div>
                  
                  {/* Action Buttons */}
                  <button onClick={selectAll} className="flex items-center gap-1 rounded-lg border px-2 py-1.5 text-[10px] font-medium transition-colors hover:bg-[rgba(255,255,255,0.05)]" style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#CBD5E1' }}>
                    <CheckSquare size={12} /> All
                  </button>
                  <button onClick={deselectAll} className="flex items-center gap-1 rounded-lg border px-2 py-1.5 text-[10px] font-medium transition-colors hover:bg-[rgba(255,255,255,0.05)]" style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#CBD5E1' }}>
                    <Square size={12} /> None
                  </button>
                  <button onClick={selectAllNumeric} className="flex items-center gap-1 rounded-lg border px-2 py-1.5 text-[10px] font-medium transition-colors hover:bg-[rgba(16,185,129,0.08)]" style={{ borderColor: 'rgba(16,185,129,0.2)', color: '#10B981' }}>
                    <Hash size={12} /> Num
                  </button>
                  <button onClick={selectAllCategorical} className="flex items-center gap-1 rounded-lg border px-2 py-1.5 text-[10px] font-medium transition-colors hover:bg-[rgba(249,115,22,0.08)]" style={{ borderColor: 'rgba(249,115,22,0.2)', color: '#F97316' }}>
                    <Type size={12} /> Cat
                  </button>
                  
                  {config.targetColumn && (
                    <button
                      type="button"
                      onClick={() => fetchSuggestions(config.targetColumn)}
                      disabled={loadingSuggestions}
                      className="flex items-center gap-1 whitespace-nowrap rounded-lg border px-2 py-1.5 text-[10px] font-medium transition-colors hover:bg-[rgba(59,130,246,0.08)] disabled:cursor-not-allowed disabled:opacity-50"
                      style={{ borderColor: 'rgba(59,130,246,0.2)', color: '#3B82F6' }}
                    >
                      {loadingSuggestions ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                      Auto
                    </button>
                  )}
                </div>
            )}
          </div>

          {availableColumns.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-sm text-[#475569]">
              No available feature columns
            </div>
          ) : (
            <div className="grid max-h-[340px] grid-cols-1 gap-2.5 overflow-y-auto pr-1 custom-scrollbar sm:grid-cols-2 lg:grid-cols-3">
              {filteredColumns.length === 0 ? (
                <div className="col-span-full py-8 text-center text-xs text-[#64748B]">No features match your search.</div>
              ) : (
                filteredColumns.map((col: string) => {
                  const isSelected = config.features.includes(col);
                  const isNumeric = data.numerical_columns?.includes(col);
                  return (
                    <button
                      type="button"
                      key={col}
                      title={`Type: ${data.dtypes?.[col]}`}
                      onClick={() => toggleFeature(col)}
                      className={`flex min-w-0 flex-col rounded-lg border p-3 text-left transition-all duration-150 ${
                        isSelected
                          ? 'border-[#3B82F6] bg-[rgba(59,130,246,0.08)]'
                          : 'border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] hover:border-[rgba(255,255,255,0.15)]'
                      }`}
                    >
                      <div className="mb-1 flex min-w-0 items-center justify-between">
                        <span className="truncate pr-2 text-xs font-medium text-[#F9FAFB]">{col}</span>
                        <div className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border transition-colors ${
                          isSelected ? 'bg-[#3B82F6] border-[#3B82F6]' : 'border-[#475569]'
                        }`}>
                          {isSelected && (
                            <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                              <path d="M2 5L4.5 7.5L8 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${isNumeric ? 'bg-[rgba(16,185,129,0.1)] text-[#10B981]' : 'bg-[rgba(249,115,22,0.1)] text-[#F97316]'}`}>
                          {isNumeric ? 'NUM' : 'CAT'}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
