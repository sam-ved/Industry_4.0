import { BrainCircuit, Activity, LineChart, Network } from 'lucide-react';

const algorithms = {
  classification: [
    { name: 'Random Forest', desc: 'Ensemble method, good for tabular data.' },
    { name: 'XGBoost', desc: 'High performance gradient boosting.' },
    { name: 'Logistic Regression', desc: 'Fast, interpretable baseline.' },
    { name: 'SVM', desc: 'Effective in high dimensional spaces.' },
    { name: 'KNN', desc: 'Instance-based learning.' }
  ],
  regression: [
    { name: 'Random Forest Regressor', desc: 'Ensemble method for continuous targets.' },
    { name: 'XGBoost Regressor', desc: 'Gradient boosting for regression.' },
    { name: 'Linear Regression', desc: 'Simple linear baseline.' },
    { name: 'Gradient Boosting Regressor', desc: 'Sequential tree building.' }
  ],
  clustering: [
    { name: 'K-Means', desc: 'Centroid-based clustering.' },
    { name: 'DBSCAN', desc: 'Density-based spatial clustering.' }
  ],
  anomaly: [
    { name: 'Isolation Forest', desc: 'Tree-based anomaly detection.' },
    { name: 'One-Class SVM', desc: 'Boundary-based novelty detection.' }
  ]
};

export default function AlgorithmSelector({ config, setConfig, onNext, onBack }: any) {
  const categories = [
    { id: 'classification', title: 'Classification', icon: BrainCircuit, color: '#3B82F6' },
    { id: 'regression', title: 'Regression', icon: LineChart, color: '#10B981' },
    { id: 'clustering', title: 'Clustering', icon: Network, color: '#F97316' },
    { id: 'anomaly', title: 'Anomaly Detection', icon: Activity, color: '#EF4444' }
  ];

  const handleSelect = (task: string, algo: string) => {
    setConfig({ ...config, taskType: task, algorithm: algo });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#F9FAFB]">Algorithm Selection</h2>
          <p className="text-sm text-[#94A3B8]">Choose the machine learning algorithm to train.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onBack} className="px-6 py-2 rounded-lg font-medium border border-[rgba(255,255,255,0.1)] text-[#94A3B8] hover:bg-[rgba(255,255,255,0.05)]">
            Back
          </button>
          <button
            onClick={onNext}
            disabled={!config.algorithm}
            className="px-6 py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            style={{ background: '#06B6D4', color: '#000' }}
          >
            Start Training <BrainCircuit size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <div key={cat.id} className="p-5 rounded-xl border" style={{ background: 'rgba(11,20,35,0.6)', borderColor: 'rgba(255,255,255,0.1)' }}>
              <div className="flex items-center gap-2 mb-4">
                <Icon size={18} style={{ color: cat.color }} />
                <h3 className="font-semibold text-[#F9FAFB]">{cat.title}</h3>
              </div>
              <div className="flex flex-col gap-3">
                {algorithms[cat.id as keyof typeof algorithms].map((algo) => {
                  const isSelected = config.taskType === cat.id && config.algorithm === algo.name;
                  return (
                    <div
                      key={algo.name}
                      onClick={() => handleSelect(cat.id, algo.name)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[rgba(255,255,255,0.5)]'
                          : 'border-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.2)]'
                      }`}
                      style={{ 
                        background: isSelected ? `${cat.color}20` : 'rgba(255,255,255,0.02)',
                        borderColor: isSelected ? cat.color : undefined
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-[#F9FAFB]">{algo.name}</span>
                        {isSelected && <div className="w-2 h-2 rounded-full" style={{ background: cat.color }} />}
                      </div>
                      <p className="text-xs text-[#94A3B8] mt-1">{algo.desc}</p>
                    </div>
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
