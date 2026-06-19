// src/pages/PPEMonitoring.tsx
// PPE Detection Module
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Shield,
  ArrowLeft,
  Download,
  Loader,
  BarChart3,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import { llmAPI, ppeAPI } from '../services/api'
import { useBackendStatus } from '../hooks/useBackendStatus'
import ModelInputHandler from '../components/ModelInputHandler'
import BackgroundGlow from '../components/common/BackgroundGlow'
import AIInsightsPanel from '../components/common/AIInsightsPanel'
import AIChatDrawer from '../components/common/AIChatDrawer'
import { Bot } from 'lucide-react'
import { useEffect } from 'react'

interface PPEResult {
  compliance_pct: number
  equipment_detected: Array<{
    name: string
    count: number
    confidence: number
  }>
  missing_equipment: string[]
  processing_time_ms: number
  llm_insights?: string
  all_detections?: Array<{
    label: string
    confidence: number
    bbox: [number, number, number, number]
  }>
  image_width?: number
  image_height?: number
}

export default function PPEMonitoring() {
  const navigate = useNavigate()
  const backendStatus = useBackendStatus()

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<PPEResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [insights, setInsights] = useState(null)
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [insightsError, setInsightsError] = useState('')
  const [isChatOpen, setIsChatOpen] = useState(false)

  useEffect(() => {
    if (results) {
      const fetchInsights = async () => {
        setInsightsLoading(true)
        setInsightsError('')
        try {
          const res = await llmAPI.explain('ppe', results as unknown as Record<string, unknown>)
          setInsights(res.explanation)
        } catch (err) {
          setInsightsError('Failed to load AI Insights.')
        } finally {
          setInsightsLoading(false)
        }
      }
      fetchInsights()
    } else {
      setInsights(null)
    }
  }, [results])

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    setResults(null)
    setError(null)

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setPreview(null)
    }
  }

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError('Please select a file first')
      return
    }

    if (!backendStatus.isOnline) {
      setError('Backend is offline. Please try again later.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await ppeAPI.analyze(selectedFile)
      setResults(data.data || data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to analyze'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClear = () => {
    setSelectedFile(null)
    setPreview(null)
    setResults(null)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <BackgroundGlow />

      {/* Header */}
      <div className="relative z-10 border-b border-slate-800 bg-slate-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              title="Go back to dashboard"
              className="p-2 hover:bg-slate-800 rounded-lg transition"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold">PPE Compliance Monitoring</h1>
              <p className="text-sm text-slate-400">Personal Protective Equipment Detection</p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-800 border border-slate-700">
            <div
              className={`w-2 h-2 rounded-full ${
                backendStatus.isOnline ? 'bg-emerald-500' : 'bg-red-500'
              } animate-pulse`}
            />
            <span className="text-sm">
              {backendStatus.isOnline ? 'Backend Online' : 'Backend Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Upload & Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur">
              <h2 className="text-lg font-semibold mb-4">Upload Image or Video</h2>

              <ModelInputHandler
                modelType="ppe"
                onFileSelect={handleFileSelect}
                disabled={!backendStatus.isOnline || isLoading}
              />

              {/* Preview */}
              {preview && (
                <div className="mt-6 rounded-lg overflow-hidden border border-slate-700 bg-black/20">
                  <div className="relative w-full group flex justify-center">
                    <img
                      src={preview}
                      alt="Preview"
                      className="max-h-96 object-contain"
                    />
                    
                    {/* Bounding Boxes */}
                    {results?.all_detections?.map((d, i) => {
                       if (!d.bbox) return null;
                       const [x1, y1, x2, y2] = d.bbox;
                       const imgW = results.image_width || 800;
                       const imgH = results.image_height || 600;
                       
                       const left = (x1 / imgW) * 100;
                       const top = (y1 / imgH) * 100;
                       const width = ((x2 - x1) / imgW) * 100;
                       const height = ((y2 - y1) / imgH) * 100;

                       const isNo = d.label.startsWith("no_");
                       const color = isNo ? '#ef4444' : '#10b981';

                       return (
                         <div 
                           key={i}
                           className="absolute border-2 pointer-events-none"
                           style={{
                             left: `${left}%`,
                             top: `${top}%`,
                             width: `${width}%`,
                             height: `${height}%`,
                             borderColor: color,
                             backgroundColor: `${color}20` // 12% opacity
                           }}
                         >
                           <div className="absolute -top-6 left-[-2px] px-2 py-0.5 text-xs font-bold text-white shadow-md whitespace-nowrap" style={{ backgroundColor: color }}>
                             {d.label.replace('no_', 'Missing ').replace('_', ' ').toUpperCase()} {Math.round(d.confidence * 100)}%
                           </div>
                         </div>
                       )
                    })}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-6 flex gap-4">
                <button
                  onClick={handleAnalyze}
                  disabled={!selectedFile || isLoading || !backendStatus.isOnline}
                  title="Check PPE compliance in the selected file"
                  className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader className="animate-spin" size={18} />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Shield size={18} />
                      Check Compliance
                    </>
                  )}
                </button>

                <button
                  onClick={handleClear}
                  title="Clear the selected file and results"
                  className="py-3 px-4 bg-slate-800 hover:bg-slate-700 rounded-lg font-medium transition"
                >
                  Clear
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-3">
                  <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
                  <p className="text-sm text-red-200">{error}</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Right: Results */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            {results ? (
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur space-y-6">
                <h2 className="text-lg font-semibold">Compliance Results</h2>

                {/* Main Compliance Score */}
                <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/50 rounded-lg p-6 text-center">
                  <p className="text-sm text-slate-400 mb-2">Compliance Rate</p>
                  <div className="flex items-end justify-center gap-2">
                    <span className="text-5xl font-bold text-emerald-400">
                      {results.compliance_pct?.toFixed(1) || 0}
                    </span>
                    <span className="text-2xl text-emerald-400 mb-1">%</span>
                  </div>
                  <div className="mt-4 w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      // eslint-disable-next-line @stylistic/no-restricted-syntax
                      className="bg-emerald-500 h-full transition-all duration-500"
                      style={{ width: `${results.compliance_pct || 0}%` }}
                    />
                  </div>
                </div>

                {/* Equipment Detected */}
                {results.equipment_detected && results.equipment_detected.length > 0 && (
                  <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                    <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-500" />
                      Equipment Detected
                    </p>
                    <div className="space-y-2">
                      {results.equipment_detected.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-sm bg-slate-900/50 p-3 rounded"
                        >
                          <span>{item.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400">×{item.count}</span>
                            <span className="text-emerald-400 font-medium">
                              {(item.confidence * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing Equipment */}
                {results.missing_equipment && results.missing_equipment.length > 0 && (
                  <div className="bg-amber-500/10 border border-amber-500/50 rounded-lg p-4">
                    <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <AlertTriangle size={16} className="text-amber-500" />
                      Missing Equipment
                    </p>
                    <ul className="space-y-1">
                      {results.missing_equipment.map((item, idx) => (
                        <li key={idx} className="text-sm text-amber-100">
                          • {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* AI Insights Panel */}
                <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-800">
                  <div>
                    <h3 className="text-lg font-semibold text-white">AI explanation</h3>
                    <p className="text-sm text-gray-400">
                      The model provides insight into compliance violations and safety risks.
                    </p>
                  </div>
                  <div className="flex gap-3 items-center">
                    <div className="inline-flex rounded-2xl bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
                      Insight
                    </div>
                    <button 
                      onClick={() => setIsChatOpen(true)}
                      disabled={!results}
                      className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-400 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold rounded-lg shadow transition-colors"
                    >
                      <Bot size={16} /> Ask AI
                    </button>
                  </div>
                </div>

                <AIInsightsPanel 
                  isLoading={insightsLoading} 
                  insights={insights} 
                  error={insightsError} 
                />

                <AIChatDrawer 
                  isOpen={isChatOpen}
                  onClose={() => setIsChatOpen(false)}
                  module="ppe"
                  contextData={results}
                />

                <button
                  className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 rounded-lg font-medium transition flex items-center justify-center gap-2"
                >
                  <Download size={16} />
                  Export Report
                </button>
              </div>
            ) : (
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur flex items-center justify-center h-96 text-center">
                <div>
                  <BarChart3 size={48} className="mx-auto mb-4 text-slate-600" />
                  <p className="text-slate-400">Upload an image or video and click Check Compliance</p>
                  <p className="text-xs text-slate-500 mt-2">to see results here</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
