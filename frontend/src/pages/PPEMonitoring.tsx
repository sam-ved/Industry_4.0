// src/pages/PPEMonitoring.tsx
// PPE Detection Module
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Shield,
  ArrowLeft,
  Loader,
  BarChart3,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
  Image as ImageIcon
} from 'lucide-react'
import { ppeAPI } from '../services/api'
import { useBackendStatus } from '../hooks/useBackendStatus'
import ModelInputHandler from '../components/ModelInputHandler'
import BackgroundGlow from '../components/common/BackgroundGlow'
import AIInsightsPanel from '../components/common/AIInsightsPanel'
import AIChatDrawer from '../components/common/AIChatDrawer'
import { Bot } from 'lucide-react'
import { useDocumentMeta } from '../hooks/useDocumentMeta'

interface PPEResult {
  compliance_status: string
  risk_level: string
  ppe_status_dict: Record<string, string>
  reasoning: string
  detected_items: string[]
  missing_items: string[]
  review_items: string[]
  processing_time_ms: number
  source?: string
  llm_insights?: any
  all_detections?: Array<{
    label: string
    confidence: number
    bbox: [number, number, number, number]
    reasoning?: string
  }>
  image_width?: number
  image_height?: number
}

const DEMO_IMAGES = [
  {
    name: 'Compliant Worker',
    description: 'Helmet + Vest Present',
    path: '/demo/compliant.jpg'
  },
  {
    name: 'Helmet Missing',
    description: 'Helmet absent',
    path: '/demo/helmet_missing.jpg'
  },
  {
    name: 'Vest Missing',
    description: 'Safety vest absent',
    path: '/demo/vest_missing.jpg'
  },
  {
    name: 'Multiple PPE Missing',
    description: 'Multiple items absent',
    path: '/demo/multiple_missing.jpg'
  }
]

export default function PPEMonitoring() {
  const navigate = useNavigate()
  const backendStatus = useBackendStatus()

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<PPEResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [techDetailsOpen, setTechDetailsOpen] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  useDocumentMeta('PPE Compliance Monitoring', 'Real-time PPE compliance monitoring with AI-powered detection for helmets, vests, and safety equipment.')

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    setResults(null)
    setError(null)
    setTechDetailsOpen(false)

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

  const loadDemoImage = async (url: string, filename: string) => {
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to load demo image')
      const blob = await response.blob()
      const file = new File([blob], filename, { type: 'image/jpeg' })
      handleFileSelect(file)
    } catch (err) {
      setError('Failed to load demo image.')
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
      const response = await ppeAPI.analyze(selectedFile)
      const resultData = response.data || response
      if (response.llm_insights) {
        resultData.llm_insights = response.llm_insights
      }
      setResults(resultData)
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
    setTechDetailsOpen(false)
    setAdvancedOpen(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLIANT':
      case 'DETECTED':
        return 'text-emerald-400'
      case 'NON-COMPLIANT':
      case 'NOT DETECTED':
        return 'text-red-400'
      case 'NEEDS REVIEW':
      default:
        return 'text-amber-400'
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'text-emerald-400'
      case 'MEDIUM': return 'text-amber-400'
      case 'HIGH': return 'text-red-400'
      default: return 'text-slate-400'
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      <BackgroundGlow />

      {/* Header */}
      <div className="relative z-10 border-b border-slate-800 bg-slate-900/50 backdrop-blur w-full">
        <div className="w-full max-w-[1440px] mx-auto px-6 py-6 flex flex-wrap items-center justify-between gap-4 box-border">
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={() => navigate('/')}
              title="Go back to dashboard"
              className="p-2 hover:bg-slate-800 rounded-lg transition shrink-0"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold truncate">PPE Compliance Monitoring</h1>
              <p className="text-xs sm:text-sm text-slate-400 truncate">Personal Protective Equipment Detection</p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 shrink-0">
            <div
              className={`w-2 h-2 rounded-full ${
                backendStatus.isOnline ? 'bg-emerald-500' : 'bg-red-500'
              } animate-pulse`}
            />
            <span className="text-sm whitespace-nowrap">
              {backendStatus.isOnline ? 'Backend Online' : 'Backend Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-[1440px] mx-auto px-6 py-8 box-border">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] gap-6">
          {/* Left: Upload & Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 min-w-0"
          >
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur">
              <h2 className="text-lg font-semibold mb-4">Upload Image or Video</h2>

              <ModelInputHandler
                modelType="ppe"
                onFileSelect={handleFileSelect}
                disabled={!backendStatus.isOnline || isLoading}
              />

              {/* Demo Mode Section - Compact */}
              <div className="mt-6 pt-6 border-t border-slate-800">
                <div className="flex items-center gap-2 mb-3">
                  <ImageIcon size={16} className="text-indigo-400" />
                  <h3 className="text-sm font-medium text-slate-300">Or use a demo image</h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {DEMO_IMAGES.map((demo, idx) => (
                    <button
                      key={idx}
                      onClick={() => loadDemoImage(demo.path, `${demo.name.replace(' ', '_')}.jpg`)}
                      disabled={isLoading}
                      className="p-2 text-left bg-slate-800/30 hover:bg-slate-700/50 border border-slate-700/50 rounded-lg transition-colors flex flex-col disabled:opacity-50"
                    >
                      <span className="font-medium text-xs text-slate-200">{demo.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              {preview && (
                <div className="mt-6 rounded-lg overflow-hidden border border-slate-700 bg-black/20 w-full box-border">
                  <div className="relative w-full group flex justify-center">
                    <img
                      src={preview}
                      alt="PPE compliance inspection preview"
                      className="w-full h-auto max-h-[600px] object-contain"
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
            className="space-y-6 min-w-0"
          >
            {results ? (
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur space-y-6">
                
                {/* Main Compliance Status */}
                <div>
                  <h2 className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider">PPE Compliance</h2>
                  <div className="flex items-center justify-between bg-slate-800/40 p-4 rounded-lg border border-slate-700">
                    <span className={`text-2xl font-bold ${getStatusColor(results.compliance_status)}`}>
                      {results.compliance_status}
                    </span>
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-slate-400 uppercase">Risk Level</span>
                      <span className={`text-lg font-bold ${getRiskColor(results.risk_level)}`}>
                        {results.risk_level}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Reasoning */}
                {results.reasoning && (
                  <div className={`p-4 rounded-lg border ${results.compliance_status === 'COMPLIANT' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-100' : results.compliance_status === 'NON-COMPLIANT' ? 'bg-red-500/10 border-red-500/30 text-red-100' : 'bg-amber-500/10 border-amber-500/30 text-amber-100'}`}>
                    <div className="flex items-start gap-3">
                      <Info className="mt-0.5 shrink-0" size={18} />
                      <p className="text-sm">{results.reasoning}</p>
                    </div>
                  </div>
                )}

                {/* PPE Checklist */}
                {results.ppe_status_dict && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Required PPE Checked</h3>
                    <div className="space-y-2">
                      {Object.entries(results.ppe_status_dict).map(([item, status]) => (
                        <div key={item} className="flex justify-between items-center bg-slate-800/40 p-3 rounded-lg border border-slate-700/50">
                          <span className="font-medium">{item}</span>
                          <span className={`text-sm font-bold flex items-center gap-1 ${getStatusColor(status as string)}`}>
                            {status === 'DETECTED' && <CheckCircle2 size={16} />}
                            {status === 'NOT DETECTED' && <AlertCircle size={16} />}
                            {status === 'NEEDS REVIEW' && <AlertTriangle size={16} />}
                            {status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Compact Control Row */}
                <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-slate-800">
                  {/* Note: AI Chat Drawer is now a floating panel triggered by the AI Insights button */}
                  <button 
                    onClick={() => setIsChatOpen(true)}
                    className="flex items-center justify-center gap-2 flex-1 min-w-[120px] px-3 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 font-medium rounded-lg transition-colors text-xs"
                  >
                    <Bot size={14} /> AI Insights
                  </button>
                  
                  <button 
                    onClick={() => setAdvancedOpen(!advancedOpen)}
                    className={`flex items-center justify-center gap-2 flex-1 min-w-[140px] px-3 py-2 font-medium rounded-lg transition-colors text-xs border ${
                      advancedOpen 
                        ? 'bg-slate-700 border-slate-600 text-white' 
                        : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-700 hover:border-slate-600 text-slate-300'
                    }`}
                  >
                    <BarChart3 size={14} /> Advanced Analysis
                  </button>
                  
                  <button 
                    onClick={() => setTechDetailsOpen(!techDetailsOpen)}
                    className={`flex items-center justify-center gap-2 flex-1 min-w-[140px] px-3 py-2 font-medium rounded-lg transition-colors text-xs border ${
                      techDetailsOpen 
                        ? 'bg-slate-700 border-slate-600 text-white' 
                        : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-700 hover:border-slate-600 text-slate-300'
                    }`}
                  >
                    <Info size={14} /> Technical Details
                  </button>
                </div>

                {/* Collapsible Sections */}
                {advancedOpen && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-4 border border-slate-700 rounded-lg bg-slate-800/30 mt-4 overflow-hidden"
                  >
                    <h3 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">Advanced Analysis</h3>
                    <AIInsightsPanel 
                      isLoading={isLoading} 
                      insights={results.llm_insights} 
                      error={error || ''} 
                    />
                  </motion.div>
                )}

                {techDetailsOpen && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-4 border border-slate-700 rounded-lg bg-slate-800/30 mt-4 overflow-hidden"
                  >
                    <h3 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">Technical Details</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm text-slate-300">
                      <div>
                        <span className="text-slate-500 block text-xs uppercase mb-1">Processing Time</span>
                        <span>{results.processing_time_ms} ms</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-xs uppercase mb-1">Source</span>
                        <span>{results.source}</span>
                      </div>
                    </div>
                    
                    {results.all_detections && results.all_detections.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-700/50">
                        <span className="text-slate-500 block text-xs uppercase mb-2">Raw Detections</span>
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                          {results.all_detections.map((d, i) => (
                            <div key={i} className="flex justify-between items-center bg-slate-900/50 p-2 rounded text-xs border border-slate-800">
                              <span className="capitalize">{d.label.replace('_', ' ')}</span>
                              <span className="font-mono text-slate-400">conf: {d.confidence.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                <AIChatDrawer 
                  isOpen={isChatOpen}
                  onClose={() => setIsChatOpen(false)}
                  module="ppe"
                  contextData={results}
                />
              </div>
            ) : (
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur flex items-center justify-center h-96 text-center w-full box-border">
                <div>
                  <BarChart3 size={48} className="mx-auto mb-4 text-slate-600" />
                  <p className="text-slate-400">Upload an image or select a demo to Check Compliance</p>
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
