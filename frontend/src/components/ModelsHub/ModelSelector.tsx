// frontend/src/components/ModelsHub/ModelSelector.jsx
// Sidebar component for selecting models with filtering

import { useState } from 'react'
import { Filter, Image as ImageIcon, FileSpreadsheet, LayoutGrid } from 'lucide-react'
import { MODEL_COLORS } from '../../constants/models'

export default function ModelSelector({ models, selectedModel, onSelectModel }) {
  const [filter, setFilter] = useState('all')

  // Filter models based on selected category
  const filteredModels = models.filter((model) => {
    if (filter === 'image') return model.supported_inputs.includes('image')
    if (filter === 'csv') return model.supported_inputs.includes('csv')
    return true
  })

  // Categorize models
  const existingModels = filteredModels.filter(m => m.category === 'existing')
  const mlModels = filteredModels.filter(m => m.category === 'ml')

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-5 border-b border-slate-800/60 bg-slate-900/50">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Filter size={18} className="text-cyan-400" />
          Available Models
        </h2>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
          {[
            { id: 'all', icon: <LayoutGrid size={14} />, label: 'All' },
            { id: 'image', icon: <ImageIcon size={14} />, label: 'Images' },
            { id: 'csv', icon: <FileSpreadsheet size={14} />, label: 'CSV' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap border ${
                filter === tab.id
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30 shadow-sm shadow-cyan-500/10'
                  : 'bg-slate-800/50 text-slate-400 border-transparent hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Model List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {existingModels.length > 0 && (
          <div className="p-4">
            <p className="text-xs font-bold text-slate-500 tracking-wider uppercase mb-3 px-1">Existing Models</p>
            <div className="space-y-2">
              {existingModels.map((model) => (
                <ModelCard
                  key={model.id}
                  model={model}
                  isSelected={selectedModel?.id === model.id}
                  onSelect={onSelectModel}
                />
              ))}
            </div>
          </div>
        )}

        {mlModels.length > 0 && (
          <div className="p-4 border-t border-slate-800/60">
            <p className="text-xs font-bold text-slate-500 tracking-wider uppercase mb-3 px-1">ML Algorithms</p>
            <div className="space-y-2">
              {mlModels.map((model) => (
                <ModelCard
                  key={model.id}
                  model={model}
                  isSelected={selectedModel?.id === model.id}
                  onSelect={onSelectModel}
                />
              ))}
            </div>
          </div>
        )}

        {filteredModels.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            <Filter size={32} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">No models found for this filter</p>
          </div>
        )}
      </div>

      {/* Stats Footer */}
      <div className="p-4 border-t border-slate-800/60 bg-slate-900/50 text-xs text-slate-500 font-medium">
        <div className="flex justify-between items-center px-1">
          <span>{filteredModels.length} models available</span>
          <span className="bg-slate-800 px-2 py-0.5 rounded-full text-slate-400">
            Total: {existingModels.length + mlModels.length}
          </span>
        </div>
      </div>
    </div>
  )
}

function ModelCard({ model, isSelected, onSelect }) {
  const bgColor = MODEL_COLORS[model.color] || '#06B6D4'

  return (
    <button
      onClick={() => onSelect(model.id)}
      className={`w-full text-left p-3.5 rounded-xl transition-all duration-300 relative overflow-hidden group ${
        isSelected
          ? 'bg-slate-800/80 shadow-lg shadow-black/20'
          : 'bg-slate-800/30 hover:bg-slate-800/60'
      }`}
    >
      {/* Selection Left Border */}
      <div 
        className={`absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}
        style={{ backgroundColor: bgColor }}
      />

      <div className="flex items-start justify-between pl-2 relative z-10">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="text-xl flex-shrink-0" style={{ filter: isSelected ? `drop-shadow(0 0 8px ${bgColor}40)` : 'none' }}>
              {model.icon}
            </span>
            <h3 className={`font-semibold text-sm truncate transition-colors ${isSelected ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
              {model.name}
            </h3>
          </div>
          <p className="text-xs text-slate-400/80 line-clamp-2 mb-3 pr-2 leading-relaxed">
            {model.description}
          </p>

          {/* Input Type Badges */}
          <div className="flex gap-1.5 flex-wrap">
            {model.supported_inputs.map((input) => (
              <span
                key={input}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium tracking-wide uppercase border ${
                  isSelected 
                    ? 'bg-slate-700/80 text-slate-200 border-slate-600/50' 
                    : 'bg-slate-800/80 text-slate-400 border-slate-700/50'
                }`}
              >
                {input === 'image' ? <ImageIcon size={10} /> : <FileSpreadsheet size={10} />}
                {input}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Active state gradient background */}
      {isSelected && (
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ background: `linear-gradient(90deg, ${bgColor}, transparent)` }}
        />
      )}
    </button>
  )
}
