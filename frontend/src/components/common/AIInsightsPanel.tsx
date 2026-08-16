import { Info, Search, AlertTriangle, CheckCircle, TrendingUp, Sparkles, Loader2 } from 'lucide-react'

interface AIInsightsProps {
  isLoading: boolean
  insights: {
    summary: string
    root_cause: string
    recommendation: string
    risk_level: string
    business_impact: string
  } | null
  error?: string
}

export default function AIInsightsPanel({ isLoading, insights, error }: AIInsightsProps) {
  if (isLoading) {
    return (
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 mt-6 shadow-lg backdrop-blur-sm animate-pulse">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">Generating AI Insights...</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-24 bg-slate-700/50 rounded-lg"></div>
          <div className="h-24 bg-slate-700/50 rounded-lg"></div>
          <div className="h-24 bg-slate-700/50 rounded-lg"></div>
          <div className="h-24 bg-slate-700/50 rounded-lg"></div>
          <div className="md:col-span-2 h-20 bg-slate-700/50 rounded-lg"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-6 mt-6 shadow-lg backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-red-400" />
          <h2 className="text-xl font-bold text-red-100">AI Analysis Failed</h2>
        </div>
        <p className="mt-2 text-red-200/80">{error}</p>
      </div>
    )
  }

  if (!insights) return null

  const getRiskColor = (risk: string) => {
    const r = risk.toLowerCase()
    if (r.includes('critical') || r.includes('high')) return 'text-red-400 bg-red-400/10 border-red-400/20'
    if (r.includes('medium') || r.includes('elevated')) return 'text-amber-400 bg-amber-400/10 border-amber-400/20'
    return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
  }

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-indigo-500/30 rounded-xl p-6 mt-6 shadow-2xl relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <Sparkles className="w-32 h-32" />
      </div>

      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg shadow-lg shadow-indigo-500/20">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-200 to-purple-200 bg-clip-text text-transparent tracking-tight">
            AI Copilot Insights
          </h2>
          <p className="text-sm text-slate-400">Industrial & Reliability Engineer Analysis</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
        
        {/* Executive Summary */}
        <div className="md:col-span-2 bg-slate-800/80 border border-slate-700 p-4 rounded-lg flex gap-4 items-start hover:border-indigo-500/50 transition-colors">
          <div className="p-2 bg-blue-500/10 rounded-md mt-1 shrink-0">
            <Info className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-1">Executive Summary</h3>
            <p className="text-slate-100 leading-relaxed">{insights.summary}</p>
          </div>
        </div>

        {/* Root Cause */}
        <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-lg flex gap-4 items-start hover:border-indigo-500/50 transition-colors">
          <div className="p-2 bg-purple-500/10 rounded-md mt-1 shrink-0">
            <Search className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-1">Root Cause Analysis</h3>
            <p className="text-slate-100">{insights.root_cause}</p>
          </div>
        </div>

        {/* Risk Assessment */}
        <div className={`border p-4 rounded-lg flex gap-4 items-start transition-colors ${getRiskColor(insights.risk_level)}`}>
          <div className="p-2 bg-black/20 rounded-md mt-1 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-1 opacity-80">Risk Assessment</h3>
            <p className="font-medium">{insights.risk_level}</p>
          </div>
        </div>

        {/* Recommended Actions */}
        <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-lg flex gap-4 items-start hover:border-indigo-500/50 transition-colors">
          <div className="p-2 bg-emerald-500/10 rounded-md mt-1 shrink-0">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-1">Recommended Actions</h3>
            <p className="text-slate-100">{insights.recommendation}</p>
          </div>
        </div>

        {/* Business Impact */}
        <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-lg flex gap-4 items-start hover:border-indigo-500/50 transition-colors">
          <div className="p-2 bg-amber-500/10 rounded-md mt-1 shrink-0">
            <TrendingUp className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-1">Business Impact</h3>
            <p className="text-slate-100">{insights.business_impact}</p>
          </div>
        </div>

      </div>
    </div>
  )
}
