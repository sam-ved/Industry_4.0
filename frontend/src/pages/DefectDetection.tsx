import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AlertTriangle, Cpu, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react'
import Card from '../components/common/Card'
import KpiCard from '../components/common/KpiCard'
import { defectAPI, llmAPI } from '../services/api'
import { Loader2, Play } from 'lucide-react'
import { useEffect } from 'react'

import UploadDropzone from '../components/common/UploadDropzone'
import AIInsightsPanel from '../components/common/AIInsightsPanel'
import AIChatDrawer from '../components/common/AIChatDrawer'
import { Bot } from 'lucide-react'

interface Detection {
  bbox: [number, number, number, number];
  defect_type: string;
  confidence: number;
  severity: string;
}

interface DefectResult {
  all_detections: Detection[];
  image_width: number;
  image_height: number;
  defect_detected: boolean;
}

interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
  result: DefectResult | null;
  llm_insights: string | null;
  isLoading: boolean;
  error: string | null;
}

const kpiMetrics = [
  {
    title: 'Total Defects',
    value: '128',
    delta: '+14%',
    accent: 'blue',
    icon: <AlertTriangle className="h-5 w-5" />,
  },
  {
    title: 'PPE Compliance',
    value: '96.4%',
    delta: '+2.8%',
    accent: 'green',
    icon: <ShieldCheck className="h-5 w-5" />,
  },
  {
    title: 'Energy Consumption',
    value: '4.2 MW',
    delta: '-3.1%',
    accent: 'cyan',
    icon: <TrendingUp className="h-5 w-5" />,
  },
  {
    title: 'Machine Health Score',
    value: '89',
    delta: '+5 pts',
    accent: 'amber',
    icon: <Cpu className="h-5 w-5" />,
  },
]

const trendData = [
  { name: '00:00', defects: 14 },
  { name: '02:00', defects: 16 },
  { name: '04:00', defects: 13 },
  { name: '06:00', defects: 21 },
  { name: '08:00', defects: 18 },
  { name: '10:00', defects: 24 },
  { name: '12:00', defects: 20 },
]

const machineStatus = [
  {
    title: 'Press Line A',
    detail: 'Running stable',
    status: 'Online',
    score: 94,
  },
  {
    title: 'Laser Cutter',
    detail: 'Requires inspection',
    status: 'Warning',
    score: 78,
  },
  {
    title: 'Cooling Loop',
    detail: 'Temperature nominal',
    status: 'Online',
    score: 91,
  },
]

const recentActivity = [
  { time: '2m ago', message: 'Scratch detected on batch #14', type: 'alert' },
  { time: '12m ago', message: 'PPE compliance event logged', type: 'info' },
  { time: '28m ago', message: 'Energy spike recorded in zone 3', type: 'warning' },
]

const severityStyles = {
  High: 'bg-red-500/10 text-red-300',
  Medium: 'bg-amber-500/10 text-amber-300',
  Low: 'bg-emerald-500/10 text-emerald-300',
}

const containerVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.08 } },
}

const itemVariant = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
}

export default function DefectDetection() {
  const [images, setImages] = useState<ImageItem[]>([])
  const [activeIndex, setActiveIndex] = useState(0)

  const activeImage = images[activeIndex]

  const [insights, setInsights] = useState(null)
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [insightsError, setInsightsError] = useState('')
  const [isChatOpen, setIsChatOpen] = useState(false)

  useEffect(() => {
    if (activeImage?.result) {
      const fetchInsights = async () => {
        setInsightsLoading(true)
        setInsightsError('')
        try {
          const res = await llmAPI.explain('steel', activeImage.result as unknown as Record<string, unknown>)
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
  }, [activeImage?.result])

  const handleFilesChange = (filesArray: File[]) => {
    const newImages: ImageItem[] = filesArray.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      previewUrl: URL.createObjectURL(file),
      result: null,
      llm_insights: null,
      isLoading: false,
      error: null
    }))
    setImages(prev => {
      const updated = [...prev, ...newImages]
      if (prev.length === 0 && newImages.length > 0) {
        setActiveIndex(0)
      }
      return updated
    })
  }

  const handleAnalyze = async (index: number) => {
    const targetImage = images[index]
    if (!targetImage || targetImage.isLoading) return

    setImages(prev => {
      const copy = [...prev]
      copy[index] = { ...copy[index], isLoading: true, error: null }
      return copy
    })

    try {
      const res = await defectAPI.analyze(targetImage.file)
      setImages(prev => {
        const copy = [...prev]
        copy[index] = { ...copy[index], isLoading: false, result: res.data, llm_insights: res.llm_insights }
        return copy
      })
    } catch (err: any) {
      setImages(prev => {
        const copy = [...prev]
        copy[index] = { ...copy[index], isLoading: false, error: err.message || "Failed to analyze" }
        return copy
      })
    }
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-gray-100">
      <div className="mx-auto max-w-screen-2xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8 grid gap-6 md:grid-cols-[1.8fr_auto]">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-300/70">
              Defect Detection
            </p>
            <h1 className="text-3xl font-semibold text-white md:text-4xl">
              AI inspection control
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-gray-400">
              Upload a steel surface image to preview detected defects, confidence metrics,
              severity grading, and AI-driven insight details in a premium operations console.
            </p>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-[rgba(255,255,255,0.03)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
            <div className="flex items-center gap-3 text-sm text-gray-300">
              <Sparkles className="h-5 w-5 text-cyan-300" />
              <div>
                <p className="font-medium text-white">Prediction engine ready</p>
                <p className="text-gray-500">Model loaded for the new inspection flow.</p>
              </div>
            </div>
          </div>
        </div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="grid gap-6 xl:grid-cols-4"
        >
          {kpiMetrics.map((item) => (
            <motion.div key={item.title} variants={itemVariant}>
              <KpiCard {...item} />
            </motion.div>
          ))}
        </motion.div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.45fr_0.95fr]">
          <Card className="p-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-white">Inspection upload</h2>
                  <p className="text-sm text-gray-400">
                    Add new images and inspect defect predictions instantly.
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className="rounded-full bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.32em] text-gray-400">
                    drag & drop
                  </span>
                </div>
              </div>

              <UploadDropzone onFilesChange={handleFilesChange} />
              
              {/* Image Gallery and Preview */}
              {images.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs uppercase tracking-[0.08em] font-semibold text-[#94A3B8] mb-3">Preview Gallery</p>
                  
                  {/* Gallery Thumbnails */}
                  <div className="flex gap-3 overflow-x-auto pb-4 mb-2 custom-scrollbar">
                    {images.map((img, idx) => (
                      <div 
                        key={img.id} 
                        onClick={() => setActiveIndex(idx)}
                        className={`relative w-20 h-20 flex-shrink-0 rounded-lg cursor-pointer border-2 transition-all overflow-hidden ${activeIndex === idx ? 'border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.4)]' : 'border-transparent opacity-60 hover:opacity-100'}`}
                      >
                        <img src={img.previewUrl} className="w-full h-full object-cover" />
                        {img.result && <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,113,0.8)]" />}
                      </div>
                    ))}
                  </div>

                  {/* Active Preview */}
                  {activeImage && (
                    <div className="relative rounded-[20px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] p-5">
                      <div className="relative w-full overflow-hidden rounded-[16px] bg-black/20 group">
                        <img 
                          src={activeImage.previewUrl} 
                          className="w-full max-h-[500px] object-contain" 
                        />
                        
                        {/* Bounding Boxes rendering */}
                        {activeImage.result?.all_detections?.map((d: Detection, i: number) => {
                           if (!d.bbox) return null;
                           const [x1, y1, x2, y2] = d.bbox;
                           const imgW = activeImage.result.image_width || 800;
                           const imgH = activeImage.result.image_height || 600;
                           
                           const left = (x1 / imgW) * 100;
                           const top = (y1 / imgH) * 100;
                           const width = ((x2 - x1) / imgW) * 100;
                           const height = ((y2 - y1) / imgH) * 100;

                           const color = d.severity === 'high' ? '#ef4444' : d.severity === 'medium' ? '#f59e0b' : '#10b981';

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
                                 backgroundColor: `${color}20` // 20 hex is 12% opacity
                               }}
                             >
                               <div className="absolute -top-6 left-[-2px] px-2 py-0.5 text-xs font-bold text-white shadow-md whitespace-nowrap" style={{ backgroundColor: color }}>
                                 {d.defect_type} {Math.round(d.confidence * 100)}%
                               </div>
                             </div>
                           )
                        })}

                        {/* Analyze Overlay Button */}
                        {!activeImage.result && !activeImage.isLoading && (
                           <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => handleAnalyze(activeIndex)}
                                className="flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold rounded-xl shadow-lg transition-transform hover:scale-105"
                              >
                                <Play size={20} className="fill-slate-900" /> Analyze Image
                              </button>
                           </div>
                        )}
                        {activeImage.isLoading && (
                           <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                              <div className="flex flex-col items-center">
                                <Loader2 className="h-12 w-12 text-cyan-400 animate-spin mb-4" />
                                <p className="text-cyan-400 font-medium tracking-wide">Running AI Inspection...</p>
                              </div>
                           </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          <div className="grid gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">AI explanation</h3>
                  <p className="text-sm text-gray-400">
                    The model provides insight into why defects were detected and how severe they are.
                  </p>
                </div>
                <div className="flex gap-3 items-center">
                  <div className="inline-flex rounded-2xl bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
                    Insight
                  </div>
                  <button 
                    onClick={() => setIsChatOpen(true)}
                    disabled={!activeImage?.result}
                    className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-400 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold rounded-lg shadow transition-colors"
                  >
                    <Bot size={16} /> Ask AI
                  </button>
                </div>
              </div>

              {!activeImage ? (
                <div className="mt-6 rounded-[28px] border border-white/10 bg-[rgba(255,255,255,0.03)] p-5 min-h-[120px] flex items-center">
                  <p className="text-sm leading-7 text-gray-500 italic">Upload an image to see AI insights.</p>
                </div>
              ) : activeImage.isLoading ? (
                <div className="mt-6 rounded-[28px] border border-white/10 bg-[rgba(255,255,255,0.03)] p-5 min-h-[120px] flex items-center">
                  <p className="text-sm leading-7 text-cyan-500 animate-pulse">Analyzing structure...</p>
                </div>
              ) : !activeImage.result ? (
                <div className="mt-6 rounded-[28px] border border-white/10 bg-[rgba(255,255,255,0.03)] p-5 min-h-[120px] flex items-center">
                  <p className="text-sm leading-7 text-gray-500 italic">Click Analyze to generate insights.</p>
                </div>
              ) : (
                <AIInsightsPanel 
                  isLoading={insightsLoading} 
                  insights={insights} 
                  error={insightsError} 
                />
              )}
            </Card>

            <AIChatDrawer 
              isOpen={isChatOpen}
              onClose={() => setIsChatOpen(false)}
              module="steel"
              contextData={activeImage?.result}
            />

            <Card className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">Detection results</h3>
                  <p className="text-sm text-gray-400">
                    Review each predicted defect, confidence score, and severity level.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {!activeImage ? (
                  <p className="text-sm text-gray-500 italic p-4 text-center">No image selected.</p>
                ) : activeImage.isLoading ? (
                  <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 text-slate-500 animate-spin" /></div>
                ) : activeImage.result ? (
                  activeImage.result.all_detections?.length > 0 ? (
                    activeImage.result.all_detections.map((item: Detection, idx: number) => {
                      const severityClass = (severityStyles as any)[item.severity.toLowerCase()] || severityStyles.Medium;
                      const DisplaySeverity = item.severity.charAt(0).toUpperCase() + item.severity.slice(1);
                      return (
                        <motion.div
                          key={idx}
                          whileHover={{ y: -3 }}
                          transition={{ duration: 0.2 }}
                          className="rounded-[28px] border border-white/10 bg-[rgba(255,255,255,0.03)] p-5"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                              <p className="text-lg font-semibold text-white capitalize">{item.defect_type}</p>
                              <p className="mt-1 text-sm text-gray-400">
                                Confidence {Math.round(item.confidence * 100)}%
                              </p>
                            </div>
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${severityClass}`}
                            >
                              {DisplaySeverity}
                            </span>
                          </div>
                          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/5">
                            <div
                              className="h-full rounded-full bg-cyan-400"
                              style={{ width: `${item.confidence * 100}%` }}
                            />
                          </div>
                        </motion.div>
                      )
                    })
                  ) : (
                    <div className="rounded-[28px] border border-white/10 bg-emerald-500/10 p-5 text-center text-emerald-300">
                      No defects detected! The surface is clear.
                    </div>
                  )
                ) : activeImage.error ? (
                  <div className="rounded-[28px] border border-red-500/30 bg-red-500/10 p-5 text-center text-red-300">
                    <AlertTriangle className="mx-auto h-8 w-8 mb-2 opacity-80" />
                    <p>{activeImage.error}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic p-4 text-center">Ready for analysis.</p>
                )}
              </div>
            </Card>
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
          <Card className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Defect trend</h3>
                <p className="text-sm text-gray-400">
                  Trend of detected defects across the latest inspection window.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-2xl bg-white/5 px-3 py-2 text-sm text-gray-300">
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-300" />
                Live analytics
              </div>
            </div>

            <div className="mt-6 h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 12, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="defectsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.52} />
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(148,163,184,0.15)" vertical={false} />
                  <XAxis dataKey="name" stroke="#7c93af" tickLine={false} axisLine={false} />
                  <YAxis stroke="#7c93af" tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(15,23,42,0.96)',
                      border: '1px solid rgba(148,163,184,0.14)',
                      borderRadius: 18,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="defects"
                    stroke="#22d3ee"
                    fill="url(#defectsGradient)"
                    strokeWidth={3}
                    fillOpacity={0.35}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">Machine status</h3>
                  <p className="text-sm text-gray-400">
                    Current operational state and health score for critical equipment.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {machineStatus.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-[28px] border border-white/10 bg-[rgba(255,255,255,0.03)] p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-sm uppercase tracking-[0.28em] text-gray-500">{item.title}</p>
                        <p className="mt-3 text-base font-semibold text-white">{item.detail}</p>
                      </div>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                          item.status === 'Online'
                            ? 'bg-emerald-500/10 text-emerald-300'
                            : item.status === 'Warning'
                            ? 'bg-amber-500/10 text-amber-300'
                            : 'bg-red-500/10 text-red-300'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div className="mt-4 rounded-full bg-white/5">
                      <div
                        className="h-2.5 rounded-full bg-cyan-400"
                        style={{ width: `${item.score}%` }}
                      />
                    </div>

                    <div className="mt-3 flex items-center justify-between text-sm text-gray-400">
                      <span>Health score</span>
                      <span>{item.score}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">Recent activity</h3>
                  <p className="text-sm text-gray-400">
                    Actions and events from the inspection feed.
                  </p>
                </div>
              </div>

              <ul className="mt-6 space-y-3">
                {recentActivity.map((item) => (
                  <li
                    key={`${item.time}-${item.message}`}
                    className="rounded-[28px] border border-white/10 bg-[rgba(255,255,255,0.03)] p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-gray-400">{item.time}</span>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          item.type === 'alert'
                            ? 'bg-red-500/10 text-red-300'
                            : item.type === 'warning'
                            ? 'bg-amber-500/10 text-amber-300'
                            : 'bg-cyan-500/10 text-cyan-300'
                        }`}
                      >
                        {item.type}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-gray-100">{item.message}</p>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
