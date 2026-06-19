import { BrainCircuit, Activity, LineChart, Network, CheckCircle2 } from 'lucide-react';

const algorithms = {
  classification: [
    { name: 'Logistic Regression', desc: 'Fast, interpretable linear baseline.' },
    { name: 'Random Forest Classifier', desc: 'Ensemble method, great for tabular data.' },
    { name: 'KNN', desc: 'Instance-based learning, simple and effective.' },
    { name: 'SVM', desc: 'Effective in high-dimensional spaces.' },
  ],
  regression: [
    { name: 'Linear Regression', desc: 'Simple linear baseline for continuous targets.' },
    { name: 'Random Forest Regressor', desc: 'Ensemble method for continuous predictions.' },
  ],
  clustering: [
    { name: 'KMeans', desc: 'Centroid-based clustering into K groups.' },
  ],
  anomaly: [
    { name: 'Isolation Forest', desc: 'Tree-based anomaly detection.' },
  ],
};

const categories = [
  { id: 'classification', title: 'Classification', icon: BrainCircuit, color: '#3B82F6' },
  { id: 'regression', title: 'Regression', icon: LineChart, color: '#10B981' },
  { id: 'clustering', title: 'Clustering', icon: Network, color: '#F97316' },
  { id: 'anomaly', title: 'Anomaly Detection', icon: Activity, color: '#EF4444' },
] as const;

interface AlgorithmSelectorProps {
  config: any;
  setConfig: (config: any) => void;
  isRunning: boolean;
}

export default function AlgorithmSelector({ config, setConfig, isRunning }: AlgorithmSelectorProps) {
  const handleSelect = (task: string, algo: string) => {
    setConfig({ ...config, taskType: task, algorithm: algo });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#F9FAFB]">Algorithm Selection</h2>
          <p className="text-sm text-[#64748B] mt-0.5">
            Choose the ML algorithm to run.
          </p>
        </div>
      </div>

      {/* Algorithm Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const algos = algorithms[cat.id];
          return (
            <div key={cat.id} className="p-5 rounded-xl border"
              style={{ background: 'rgba(11,20,35,0.6)', borderColor: 'rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: `${cat.color}15` }}>
                  <Icon size={14} style={{ color: cat.color }} />
                </div>
                <h3 className="font-semibold text-sm text-[#F9FAFB]">{cat.title}</h3>
                <span className="text-[10px] text-[#475569] ml-auto">{algos.length} algorithm{algos.length > 1 ? 's' : ''}</span>
              </div>
              <div className="flex flex-col gap-2.5">
                {algos.map((algo) => {
                  const isSelected = config.taskType === cat.id && config.algorithm === algo.name;
                  return (
                    <button
                      type="button"
                      key={algo.name}
                      onClick={() => !isRunning && handleSelect(cat.id, algo.name)}
                      disabled={isRunning}
                      className={`min-h-[76px] rounded-lg border p-3 text-left transition-all duration-150 ${
                        isRunning ? 'opacity-60 cursor-not-allowed' : ''
                      } ${
                        isSelected
                          ? ''
                          : 'border-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.15)] hover:bg-[rgba(255,255,255,0.03)]'
                      }`}
                      style={{
                        background: isSelected ? `${cat.color}12` : 'rgba(255,255,255,0.02)',
                        borderColor: isSelected ? `${cat.color}60` : undefined,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#F9FAFB]">{algo.name}</span>
                        {isSelected && (
                          <CheckCircle2 size={14} style={{ color: cat.color }} />
                        )}
                      </div>
                      <p className="text-[11px] text-[#64748B] mt-1">{algo.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
