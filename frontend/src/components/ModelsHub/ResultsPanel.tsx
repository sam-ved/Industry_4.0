// frontend/src/components/ModelsHub/ResultsPanel.jsx
// Component to display analysis results

import { useState } from 'react'


export default function ResultsPanel({ results, isLoading, error, onExport, onClear }) {
  const [activeTab, setActiveTab] = useState('summary')

  if (error) {
    return (
      <div className="p-6 rounded-lg border border-red-500/30 bg-red-500/10">
        <div className="flex items-start gap-3">
          <span className="text-2xl">❌</span>
          <div className="flex-1">
            <h3 className="font-semibold text-red-200 mb-1">Analysis Error</h3>
            <p className="text-sm text-red-100">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="p-8 rounded-lg bg-slate-800 border border-slate-700 text-center">
        <div className="mb-4">
          <div className="w-12 h-12 border-4 border-slate-600 border-t-cyan-500 rounded-full animate-spin mx-auto" />
        </div>
        <p className="text-slate-300 font-medium">Running analysis...</p>
        <p className="text-sm text-slate-400 mt-1">This may take a few moments</p>
      </div>
    )
  }

  if (!results) {
    return (
      <div className="p-8 rounded-lg bg-slate-800/30 border border-dashed border-slate-700 text-center">
        <p className="text-slate-400">Upload a file and click "Run Analysis" to see results</p>
      </div>
    )
  }

  const resultData = results.results || {}

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between p-4 rounded-lg bg-slate-800 border border-slate-700">
        <div>
          <h3 className="font-semibold text-white mb-1">{results.model_name}</h3>
          <p className="text-sm text-slate-400">
            Execution time: {results.execution_time_ms}ms
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onExport}
            className="px-3 py-1 rounded text-sm font-medium bg-slate-700 text-slate-200 hover:bg-slate-600 transition-colors"
          >
            📥 Export
          </button>
          <button
            onClick={onClear}
            className="px-3 py-1 rounded text-sm font-medium bg-slate-700 text-slate-200 hover:bg-slate-600 transition-colors"
          >
            ✕ Clear
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700">
        {['summary', 'details'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
              activeTab === tab
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            {tab === 'summary' ? '📊 Summary' : '📋 Details'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="rounded-lg bg-slate-800/50 border border-slate-700 p-4">
        {activeTab === 'summary' && (
          <ResultsSummary data={resultData} model={results} />
        )}
        {activeTab === 'details' && (
          <ResultsDetails data={resultData} />
        )}
      </div>

      {/* Raw JSON (for debugging) */}
      {results.insights && (
        <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700">
          <h4 className="font-semibold text-white mb-2">🤖 AI Insights</h4>
          <p className="text-sm text-slate-300">{results.insights}</p>
        </div>
      )}
    </div>
  )
}

function ResultsSummary({ data, model }) {
  // Detect result type and render accordingly
  const isDetection = model.output_format?.type === 'detection'
  const isClassification = model.output_format?.type === 'classification'
  const isRegression = model.output_format?.type === 'regression'
  const isAnalytics = model.output_format?.type === 'analytics'
  const isInsights = model.output_format?.type === 'insights'

  return (
    <div className="space-y-4">
      {isDetection && (
        <div>
          <p className="text-sm text-slate-400 mb-2">Detection Results</p>
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              label="Status"
              value={data.defect_detected ? '🚨 Defect Found' : '✅ Clear'}
              color={data.defect_detected ? 'red' : 'emerald'}
            />
            <MetricCard
              label="Confidence"
              value={`${(data.confidence * 100).toFixed(1)}%`}
            />
            {data.severity && (
              <MetricCard
                label="Severity"
                value={data.severity.toUpperCase()}
                color={
                  data.severity === 'high' ? 'red' : data.severity === 'medium' ? 'orange' : 'yellow'
                }
              />
            )}
            {data.defect_type && (
              <MetricCard label="Type" value={data.defect_type} />
            )}
          </div>
        </div>
      )}

      {isClassification && (
        <div>
          <p className="text-sm text-slate-400 mb-2">Classification Results</p>
          <div className="grid grid-cols-2 gap-3">
            <MetricCard label="Predicted Class" value={data.predicted_label || data.predicted_class} />
            <MetricCard
              label="Confidence"
              value={`${((data.probability || data.confidence) * 100).toFixed(1)}%`}
            />
          </div>

          {data.top_3_predictions && (
            <div className="mt-3">
              <p className="text-xs text-slate-400 mb-2">Top Predictions</p>
              <div className="space-y-1">
                {data.top_3_predictions.map((pred, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-700 rounded h-6 flex items-center px-2">
                      <div
                        className="h-4 bg-cyan-500 rounded"
                        style={{ width: `${pred.confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-300 w-16 text-right">
                      {(pred.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {isRegression && (
        <div>
          <p className="text-sm text-slate-400 mb-2">Prediction Results</p>
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              label="Predicted Value"
              value={data.predicted_value?.toFixed(2) || 'N/A'}
            />
            {data.r_squared && (
              <MetricCard label="R² Score" value={data.r_squared?.toFixed(3)} />
            )}
            {data.mse && (
              <MetricCard label="MSE" value={data.mse?.toFixed(2)} />
            )}
          </div>

          {data.prediction_interval && (
            <div className="mt-3 p-2 rounded bg-slate-700/50 text-sm text-slate-300">
              📊 Confidence Interval: [{data.prediction_interval[0]?.toFixed(2)}, {data.prediction_interval[1]?.toFixed(2)}]
            </div>
          )}
        </div>
      )}

      {isAnalytics && (
        <div>
          <p className="text-sm text-slate-400 mb-2">Analytics Summary</p>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(data).map(([key, value]) => (
              <MetricCard
                key={key}
                label={key.replace(/_/g, ' ').toUpperCase()}
                value={
                  typeof value === 'number' ? value.toFixed(2) : JSON.stringify(value).slice(0, 20)
                }
              />
            ))}
          </div>
        </div>
      )}

      {isInsights && (
        <div>
          <p className="text-sm text-slate-400 mb-2">LLM Insights</p>
          {data.summary && (
            <div className="mb-3 p-2 rounded bg-slate-700/50 text-sm text-slate-300">
              {data.summary}
            </div>
          )}
          {data.recommendations && Array.isArray(data.recommendations) && (
            <div>
              <p className="text-xs font-semibold text-slate-300 mb-2">Recommendations:</p>
              <ul className="text-xs text-slate-400 space-y-1">
                {data.recommendations.map((rec, idx) => (
                  <li key={idx}>• {rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {!isDetection && !isClassification && !isRegression && !isAnalytics && !isInsights && (
        <div className="text-sm text-slate-300">
          <pre className="bg-slate-900/50 p-2 rounded overflow-auto max-h-40 text-xs">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

function ResultsDetails({ data }) {
  return (
    <div className="space-y-3">
      {Object.entries(data).map(([key, value]) => (
        <div key={key} className="border-b border-slate-700 pb-3">
          <p className="text-xs font-semibold text-slate-400 uppercase mb-1">{key}</p>
          <p className="text-sm text-slate-300">
            {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
          </p>
        </div>
      ))}
    </div>
  )
}

function MetricCard({ label, value, color = 'default' }) {
  const colorClasses = {
    red: 'bg-red-500/10 border-red-500/20',
    emerald: 'bg-emerald-500/10 border-emerald-500/20',
    orange: 'bg-orange-500/10 border-orange-500/20',
    yellow: 'bg-yellow-500/10 border-yellow-500/20',
    default: 'bg-slate-700/50 border-slate-600',
  }

  return (
    <div className={`p-3 rounded border ${colorClasses[color] || colorClasses.default}`}>
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className="font-semibold text-white text-lg truncate">{value}</p>
    </div>
  )
}
