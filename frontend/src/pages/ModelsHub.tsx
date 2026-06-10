// frontend/src/pages/ModelsHub.jsx
// Main Models Hub page — 3-column layout with model selector, upload zone, and analytics

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Rocket, Target, UploadCloud, Zap, AlertCircle } from 'lucide-react'
import { useModelsHub } from '../hooks/useModelsHub'
import ModelSelector from '../components/ModelsHub/ModelSelector'
import ModelUploadZone from '../components/ModelsHub/ModelUploadZone'
import ResultsPanel from '../components/ModelsHub/ResultsPanel'
import AnalyticsDashboard from '../components/ModelsHub/AnalyticsDashboard'
import BackgroundGlow from '../components/common/BackgroundGlow'

export default function ModelsHub() {
  const navigate = useNavigate()
  const {
    models,
    selectedModel,
    file,
    results,
    isLoading,
    error,
    history,
    stats,
    fetchModels,
    fetchHistory,
    fetchStats,
    selectModel,
    uploadFile,
    runAnalysis,
    clearResults,
    clearFile,
    exportResults,
  } = useModelsHub()

  // Load models, history, and stats on mount
  useEffect(() => {
    fetchModels()
    fetchHistory()
    fetchStats()
  }, [fetchModels, fetchHistory, fetchStats])

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden relative">
      <BackgroundGlow />
      
      {/* Left Sidebar — Model Selector */}
      <div className="w-80 border-r border-slate-800/60 bg-slate-900/40 backdrop-blur-md flex flex-col z-10 relative shadow-[4px_0_24px_rgba(0,0,0,0.2)]">
        <ModelSelector
          models={models}
          selectedModel={selectedModel}
          onSelectModel={selectModel}
        />
      </div>

      {/* Main Content — Upload & Results */}
      <div className="flex-1 flex flex-col overflow-hidden z-10 relative">
        {/* Header */}
        <header className="bg-slate-900/50 backdrop-blur-lg border-b border-slate-800/60 px-8 py-5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center border border-cyan-500/20">
              <Rocket className="text-cyan-400" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Models Hub</h1>
              <p className="text-slate-400 text-sm mt-0.5">
                Select a model, upload your data, and get AI-powered analysis
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition-all border border-slate-700 hover:border-slate-600 text-sm font-medium hover:shadow-lg hover:shadow-cyan-500/10 group"
          >
            <ArrowLeft size={16} className="text-slate-400 group-hover:text-slate-200 transition-colors" />
            Back to Dashboard
          </button>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-6xl mx-auto px-8 py-8 space-y-8">
            {/* Upload Section */}
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <UploadCloud className="text-cyan-400" size={20} />
                Upload & Analyze
              </h2>
              <ModelUploadZone
                selectedModel={selectedModel}
                file={file}
                isLoading={isLoading}
                onFileSelect={uploadFile}
                onFileRemove={clearFile}
                onAnalyze={runAnalysis}
              />
            </motion.section>

            {/* Error Display */}
            {error && !isLoading && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 backdrop-blur-sm"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-red-400 mt-0.5 shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-red-200">Error Analyzing Data</h3>
                    <p className="text-sm text-red-300/80 mt-1">{error}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Results Section */}
            {(results || isLoading) && (
              <motion.section 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Zap className="text-amber-400" size={20} />
                  Analysis Results
                </h2>
                <ResultsPanel
                  results={results}
                  isLoading={isLoading}
                  error={error}
                  onExport={exportResults}
                  onClear={clearResults}
                />
              </motion.section>
            )}

            {/* Info Cards */}
            {!results && !isLoading && (
              <motion.section 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8"
              >
                <InfoCard
                  icon={<Target size={24} className="text-blue-400" />}
                  title="Choose a Model"
                  description="Select from 9 AI models optimized for different industrial tasks."
                  color="blue"
                />
                <InfoCard
                  icon={<UploadCloud size={24} className="text-emerald-400" />}
                  title="Upload Your Data"
                  description="Support for images (PNG, JPG, WEBP) and CSV telemetry data."
                  color="emerald"
                />
                <InfoCard
                  icon={<Zap size={24} className="text-amber-400" />}
                  title="Get Results Instantly"
                  description="Real-time analysis with detailed insights and AI recommendations."
                  color="amber"
                />
              </motion.section>
            )}
          </div>
        </div>
      </div>

      {/* Right Sidebar — Analytics */}
      <div className="w-80 border-l border-slate-800/60 bg-slate-900/40 backdrop-blur-md flex flex-col z-10 relative shadow-[-4px_0_24px_rgba(0,0,0,0.2)]">
        <AnalyticsDashboard history={history} models={models} stats={stats} />
      </div>
    </div>
  )
}

function InfoCard({ icon, title, description, color }: any) {
  const colorMap = {
    blue: 'hover:border-blue-500/50 hover:shadow-blue-500/10',
    emerald: 'hover:border-emerald-500/50 hover:shadow-emerald-500/10',
    amber: 'hover:border-amber-500/50 hover:shadow-amber-500/10',
  }
  
  return (
    <div className={`p-6 rounded-2xl bg-slate-800/40 border border-slate-700/60 backdrop-blur-sm transition-all duration-300 group ${colorMap[color]}`}>
      <div className="w-12 h-12 rounded-xl bg-slate-900/80 border border-slate-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="font-semibold text-white mb-2 text-lg">{title}</h3>
      <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
    </div>
  )
}
