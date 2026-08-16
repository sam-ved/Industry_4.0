import { BrainCircuit, LineChart, Network, Zap } from 'lucide-react';
import { useState } from 'react';

interface TaskSelectorProps {
  config: any;
  setConfig: (config: any) => void;
  isRunning: boolean;
}

const TASKS = [
  { id: 'classification', title: 'Classification', desc: 'Predict a category or class', icon: BrainCircuit, color: '#3B82F6' },
  { id: 'regression', title: 'Regression', desc: 'Predict a continuous numerical value', icon: LineChart, color: '#10B981' },
  { id: 'clustering', title: 'Clustering', desc: 'Group similar data points together', icon: Network, color: '#F97316' },
];

const ALGORITHMS: Record<string, { id: string; name: string; desc: string }[]> = {
  classification: [
    { id: 'auto', name: 'Auto (Compare All)', desc: 'Automatically compare compatible algorithms and select the best' },
    { id: 'logistic_regression', name: 'Logistic Regression', desc: 'Fast, interpretable linear classifier' },
    { id: 'decision_tree', name: 'Decision Tree', desc: 'Rule-based, easy to visualize decisions' },
    { id: 'random_forest', name: 'Random Forest', desc: 'Ensemble of trees, good for complex patterns' },
    { id: 'gradient_boosting', name: 'Gradient Boosting', desc: 'High accuracy iterative boosting' },
  ],
  regression: [
    { id: 'auto', name: 'Auto (Compare All)', desc: 'Automatically compare compatible algorithms and select the best' },
    { id: 'linear_regression', name: 'Linear Regression', desc: 'Simple, fast, interpretable linear model' },
    { id: 'ridge', name: 'Ridge Regression', desc: 'Linear model with regularization' },
    { id: 'decision_tree', name: 'Decision Tree', desc: 'Non-linear, captures interactions' },
    { id: 'random_forest', name: 'Random Forest', desc: 'Ensemble of trees, robust to outliers' },
    { id: 'gradient_boosting', name: 'Gradient Boosting', desc: 'State-of-the-art accuracy' },
  ],
  clustering: [
    { id: 'kmeans', name: 'K-Means', desc: 'Partition data into K clusters' },
  ],
};

export default function TaskSelector({ config, setConfig, isRunning }: TaskSelectorProps) {
  const [showAlgorithms, setShowAlgorithms] = useState(true);

  const handleTaskChange = (taskId: string) => {
    if (isRunning) return;
    // Set task and auto-select 'auto' algorithm (or first algorithm for clustering)
    const algos = ALGORITHMS[taskId] || [];
    const defaultAlgo = algos.find(a => a.id === 'auto')?.id || algos[0]?.id || '';
    setConfig({ ...config, taskType: taskId, algorithm: defaultAlgo });
    setShowAlgorithms(true);
  };

  const handleAlgorithmChange = (algoId: string) => {
    if (isRunning) return;
    setConfig({ ...config, algorithm: algoId });
  };

  const currentAlgorithms = ALGORITHMS[config.taskType] || [];
  const selectedAlgo = currentAlgorithms.find((a: any) => a.id === config.algorithm);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#F9FAFB]">Task & Algorithm</h2>
          <p className="text-sm text-[#64748B] mt-0.5">
            Select the ML task type and algorithm to use.
          </p>
        </div>
      </div>

      {/* Task Type Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {TASKS.map((task) => {
          const Icon = task.icon;
          const isSelected = config.taskType === task.id;
          return (
            <button
              key={task.id}
              type="button"
              onClick={() => handleTaskChange(task.id)}
              disabled={isRunning}
              className={`p-4 rounded-xl border text-left transition-all duration-150 ${
                isRunning ? 'opacity-60 cursor-not-allowed' : ''
              } ${
                isSelected
                  ? ''
                  : 'border-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.15)] hover:bg-[rgba(255,255,255,0.03)]'
              }`}
              style={{
                background: isSelected ? `${task.color}15` : 'rgba(11,20,35,0.6)',
                borderColor: isSelected ? `${task.color}60` : undefined,
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${task.color}20` }}>
                  <Icon size={16} style={{ color: task.color }} />
                </div>
                <h3 className="font-semibold text-[#F9FAFB] text-sm">{task.title}</h3>
              </div>
              <p className="text-xs text-[#64748B] leading-relaxed">
                {task.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Algorithm Selection */}
      {config.taskType && currentAlgorithms.length > 0 && showAlgorithms && (
        <div className="p-5 rounded-xl border flex flex-col gap-4"
          style={{ background: 'rgba(11,20,35,0.6)', borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-[#A78BFA]" />
            <h3 className="font-semibold text-sm text-[#F9FAFB]">Algorithm</h3>
            {selectedAlgo && (
              <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-medium bg-[rgba(167,139,250,0.1)] text-[#A78BFA]">
                {selectedAlgo.name}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {currentAlgorithms.map((algo) => {
              const isSelected = config.algorithm === algo.id;
              const isAuto = algo.id === 'auto';
              return (
                <button
                  key={algo.id}
                  type="button"
                  onClick={() => handleAlgorithmChange(algo.id)}
                  disabled={isRunning}
                  className={`flex flex-col rounded-lg border p-3 text-left transition-all duration-150 ${
                    isRunning ? 'opacity-60 cursor-not-allowed' : ''
                  } ${
                    isSelected
                      ? 'border-[#A78BFA] bg-[rgba(167,139,250,0.08)]'
                      : 'border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] hover:border-[rgba(255,255,255,0.15)]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-medium ${isSelected ? 'text-[#A78BFA]' : 'text-[#F9FAFB]'}`}>
                      {isAuto ? '⚡ ' : ''}{algo.name}
                    </span>
                    <div className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                      isSelected ? 'bg-[#A78BFA] border-[#A78BFA]' : 'border-[#475569]'
                    }`}>
                      {isSelected && (
                        <svg width="7" height="7" viewBox="0 0 10 10" fill="none">
                          <circle cx="5" cy="5" r="3" fill="white" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <p className="text-[10px] text-[#64748B] leading-relaxed">{algo.desc}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
