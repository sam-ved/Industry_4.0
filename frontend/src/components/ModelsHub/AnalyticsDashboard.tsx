// frontend/src/components/ModelsHub/AnalyticsDashboard.jsx
// Right sidebar showing analytics and analysis history

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function AnalyticsDashboard({ history, models, stats }) {
  // Use stats from database if available, otherwise calculate from history
  const totalAnalyses = stats?.total_analyses || history.length
  const successRate = stats?.success_rate || (history.length > 0 
    ? ((history.filter(h => h.status === 'ok').length / history.length) * 100).toFixed(1) 
    : 0)
  const avgExecutionTime = stats?.avg_execution_time_ms || (history.length > 0
    ? (history.reduce((sum, h) => sum + h.execution_time_ms, 0) / history.length).toFixed(0)
    : 0)

  // Get most used model
  const mostUsedId = stats?.most_used_model
  const mostUsedModel = models.find(m => m.id === mostUsedId)
  const mostUsedCount = stats?.most_used_count || 0

  // Prepare chart data (last 7 analyses)
  const chartData = history.slice(-7).map((h, idx) => ({
    name: `#${idx + 1}`,
    time: h.execution_time_ms,
  }))

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <h3 className="text-lg font-semibold text-white">📊 Analytics</h3>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Metrics Grid */}
        <div className="space-y-3">
          <AnalyticsCard
            label="Total Analyses"
            value={totalAnalyses}
            icon="📈"
            color="cyan"
          />
          <AnalyticsCard
            label="Success Rate"
            value={`${successRate}%`}
            icon="✅"
            color="emerald"
          />
          <AnalyticsCard
            label="Avg Execution Time"
            value={`${avgExecutionTime}ms`}
            icon="⏱️"
            color="orange"
          />
        </div>

        {/* Most Used Model */}
        {mostUsedModel && (
          <div className="p-3 rounded-lg bg-slate-800 border border-slate-700">
            <p className="text-xs text-slate-400 mb-2">Most Used Model</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{mostUsedModel.icon}</span>
              <div>
                <p className="text-sm font-semibold text-white">{mostUsedModel.name}</p>
                <p className="text-xs text-slate-400">{mostUsedCount} uses</p>
              </div>
            </div>
          </div>
        )}

        {/* Execution Time Chart */}
        {chartData.length > 1 && (
          <div className="p-3 rounded-lg bg-slate-800 border border-slate-700">
            <p className="text-xs text-slate-400 mb-2">Execution Time Trend</p>
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" style={{ fontSize: '0.75rem' }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '0.75rem' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                  formatter={(value) => `${value}ms`}
                />
                <Line
                  type="monotone"
                  dataKey="time"
                  stroke="#06b6d4"
                  dot={{ fill: '#06b6d4', r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Recent Analyses */}
        <div>
          <p className="text-xs text-slate-400 mb-2 uppercase font-semibold">Recent Analyses</p>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {history.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No analyses yet</p>
            ) : (
              history
                .slice(-10)
                .reverse()
                .map((record, idx) => {
                  const model = models.find(m => m.id === record.model_id)
                  return (
                    <div
                      key={idx}
                      className="p-2 rounded bg-slate-800/50 border border-slate-700 text-xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span>{model?.icon}</span>
                          <p className="text-slate-300 truncate font-medium">
                            {model?.name || record.model_id}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            record.status === 'ok'
                              ? 'bg-emerald-500/20 text-emerald-200'
                              : 'bg-red-500/20 text-red-200'
                          }`}
                        >
                          {record.status === 'ok' ? '✓' : '✗'}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>{record.file_name}</span>
                        <span>{record.execution_time_ms}ms</span>
                      </div>
                      <p className="text-slate-500 text-xs mt-1">
                        {new Date(record.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  )
                })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function AnalyticsCard({ label, value, icon, color }) {
  const colorClasses = {
    cyan: 'bg-cyan-500/10 border-cyan-500/20',
    emerald: 'bg-emerald-500/10 border-emerald-500/20',
    orange: 'bg-orange-500/10 border-orange-500/20',
  }

  return (
    <div className={`p-3 rounded-lg border ${colorClasses[color] || 'bg-slate-800 border-slate-700'}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400 mb-1">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
        <span className="text-3xl opacity-50">{icon}</span>
      </div>
    </div>
  )
}
