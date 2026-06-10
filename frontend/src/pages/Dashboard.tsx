import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Zap, Shield, TrendingUp, Gauge,
  AlertTriangle, CheckCircle, Activity,
  ArrowUpRight, ArrowDownRight, ChevronRight,
  Bell, Cpu, Radio, RefreshCw, WifiOff,
} from 'lucide-react'
import BackgroundGlow from '../components/common/BackgroundGlow'
import { useDashboard } from '../hooks/useDashboard'

// ─── Animation Variants ──────────────────────────────────────────────────────

const containerVariants: any = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
}

const itemVariants: any = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}



// ─── KPI Card ────────────────────────────────────────────────────────────────

function KPICard({ label, value, unit, trend, trendValue, color, icon: Icon, pulse, loading }: any) {
  const colors = {
    red:    { text: '#EF4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)' },
    green:  { text: '#10B981', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.2)' },
    blue:   { text: '#3B82F6', bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.2)' },
    cyan:   { text: '#06B6D4', bg: 'rgba(6,182,212,0.08)',   border: 'rgba(6,182,212,0.2)' },
    orange: { text: '#F97316', bg: 'rgba(249,115,22,0.08)',  border: 'rgba(249,115,22,0.2)' },
  }
  const c = colors[color] || colors.cyan
  const isUp = trend === 'up'
  const trendColor = (color === 'red' && isUp) || (color === 'orange' && isUp) ? '#EF4444' : '#10B981'

  return (
    <motion.div
      variants={itemVariants}
      whileHover="hover"
      initial="rest"
      animate="rest"
      className="relative flex flex-col gap-3 p-5 rounded-xl border backdrop-blur-xl overflow-hidden"
      style={{ background: 'rgba(11,20,35,0.85)', borderColor: c.border }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#94A3B8' }}>{label}</span>
        <div className="flex items-center justify-center w-8 h-8 rounded-lg" style={{ background: c.bg }}>
          <Icon size={15} style={{ color: c.text }} />
        </div>
      </div>

      {loading ? (
        <div className="h-9 w-24 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.07)' }} />
      ) : (
        <div className="flex items-end gap-1">
          <span className="text-3xl font-bold tracking-tight" style={{ color: '#F9FAFB' }}>{value ?? '—'}</span>
          {unit && <span className="text-sm mb-1" style={{ color: '#64748B' }}>{unit}</span>}
        </div>
      )}

      <div className="flex items-center gap-1.5">
        {isUp
          ? <ArrowUpRight size={13} style={{ color: trendColor }} />
          : <ArrowDownRight size={13} style={{ color: '#10B981' }} />
        }
        <span className="text-xs font-medium" style={{ color: trendColor }}>{trendValue}</span>
        <span className="text-xs" style={{ color: '#64748B' }}>vs yesterday</span>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-xl"
        style={{ background: `linear-gradient(90deg, ${c.text}60, transparent)` }} />

      {pulse && (
        <div className="absolute top-4 right-4">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: c.text }} />
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: c.text }} />
          </span>
        </div>
      )}
    </motion.div>
  )
}

// ─── AI Insights Panel ───────────────────────────────────────────────────────

function InsightsPanel({ insights, loading }: any) {
  const levelStyle = {
    critical: { color: '#EF4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)',   icon: AlertTriangle },
    warning:  { color: '#F97316', bg: 'rgba(249,115,22,0.08)',  border: 'rgba(249,115,22,0.2)',  icon: TrendingUp },
    info:     { color: '#3B82F6', bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.2)',  icon: Gauge },
    ok:       { color: '#10B981', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.2)',  icon: CheckCircle },
  }

  const fallbackAlerts = [
    { level: 'critical', title: 'Abnormal Vibration',  body: 'Machine 3 showing abnormal vibration patterns. Bearing wear likely.' },
    { level: 'warning',  title: 'Energy Spike',        body: 'Energy usage increased by 12% in last 3 hours. Line B affected.' },
    { level: 'info',     title: 'Maintenance Due',     body: 'Compressor unit RUL at 87h. Schedule maintenance within 4 days.' },
    { level: 'ok',       title: 'PPE Compliance',      body: 'All zones meeting 98%+ compliance. Zone A flagged 1 violation.' },
  ]

  const alerts      = insights?.key_alerts              ?? fallbackAlerts
  const actions     = insights?.top_recommended_actions ?? ['Inspect Machine 3 bearings', 'Review Line B energy profile', 'Schedule compressor maintenance']
  const healthScore = insights?.system_health_score     ?? 94
  const headline    = insights?.headline                ?? null

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-4 p-5 rounded-xl border backdrop-blur-xl h-full"
      style={{
        background: 'rgba(11,20,35,0.92)',
        borderColor: 'rgba(6,182,212,0.2)',
        boxShadow: '0 0 40px rgba(6,182,212,0.04) inset',
      }}
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between pb-3 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg"
            style={{ background: 'rgba(6,182,212,0.12)' }}>
            <Cpu size={14} style={{ color: '#06B6D4' }} />
          </div>
          <span className="text-sm font-bold tracking-wide" style={{ color: '#F9FAFB' }}>AI Insights</span>
          {loading && (
            <span className="text-[10px] px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(6,182,212,0.1)', color: '#06B6D4' }}>
              Analyzing...
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-emerald-400" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <span className="text-xs" style={{ color: '#10B981' }}>Live</span>
        </div>
      </motion.div>

      {/* LLM Headline */}
      {headline && (
        <motion.div variants={itemVariants}
          className="px-3 py-2 rounded-lg text-xs leading-relaxed italic"
          style={{ background: 'rgba(6,182,212,0.06)', borderLeft: '2px solid #06B6D4', color: '#94A3B8' }}>
          {headline}
        </motion.div>
      )}

      {/* System Health Bar */}
      <motion.div variants={itemVariants} className="rounded-lg p-3"
        style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#94A3B8' }}>
            System Health
          </span>
          <span className="text-sm font-bold" style={{ color: '#10B981' }}>{healthScore}%</span>
        </div>
        <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${healthScore}%` }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.4 }}
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #10B981, #06B6D4)' }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs" style={{ color: '#64748B' }}>4 systems online</span>
          <span className="text-xs" style={{ color: '#64748B' }}>0 offline</span>
        </div>
      </motion.div>

      {/* Alerts */}
      <div className="flex flex-col gap-2.5 flex-1 overflow-y-auto">
        {loading && !insights ? (
          [1, 2, 3].map(i => (
            <div key={i} className="h-16 rounded-lg animate-pulse"
              style={{ background: 'rgba(255,255,255,0.04)' }} />
          ))
        ) : (
          alerts.map((a, i) => {
            const s = levelStyle[a.level] || levelStyle.info
            const AlertIcon = s.icon
            return (
              <motion.div key={i} variants={itemVariants}
                className="flex gap-3 p-3 rounded-lg border"
                style={{ background: s.bg, borderColor: s.border }}>
                <div className="flex-shrink-0 mt-0.5">
                  <AlertIcon size={14} style={{ color: s.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold block" style={{ color: '#F1F5F9' }}>{a.title}</span>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#94A3B8' }}>{a.body}</p>
                </div>
              </motion.div>
            )
          })
        )}
      </div>

      {/* Recommended Actions */}
      <motion.div variants={itemVariants} className="pt-3 border-t"
        style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#64748B' }}>
          Recommended Actions
        </p>
        {actions.map((action, i) => (
          <div key={i} className="flex items-center gap-2 py-1.5">
            <ChevronRight size={12} style={{ color: '#06B6D4' }} />
            <span className="text-xs" style={{ color: '#CBD5E1' }}>{action}</span>
          </div>
        ))}
      </motion.div>
    </motion.div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate()
  const { kpis, insights, loading, error, refresh } = useDashboard()

  const accentMap = {
    cyan:    { text: '#06B6D4', border: 'rgba(6,182,212,0.25)',  bg: 'rgba(6,182,212,0.08)',  glow: 'rgba(6,182,212,0.15)' },
    emerald: { text: '#10B981', border: 'rgba(16,185,129,0.25)', bg: 'rgba(16,185,129,0.08)', glow: 'rgba(16,185,129,0.15)' },
    orange:  { text: '#F97316', border: 'rgba(249,115,22,0.25)', bg: 'rgba(249,115,22,0.08)', glow: 'rgba(249,115,22,0.15)' },
    blue:    { text: '#3B82F6', border: 'rgba(59,130,246,0.25)', bg: 'rgba(59,130,246,0.08)', glow: 'rgba(59,130,246,0.15)' },
  }

  // KPI cards — values from live API
  const kpiCards = [
    {
      label: 'Total Defects Today',
      value: kpis?.total_defects_today ?? '—',
      unit: 'detected',
      trend: 'up',
      trendValue: '+4 units',
      color: 'red',
      icon: AlertTriangle,
      pulse: (kpis?.total_defects_today ?? 0) > 20,
    },
    {
      label: 'PPE Compliance',
      value: kpis?.ppe_compliance_pct ?? '—',
      unit: '%',
      trend: 'up',
      trendValue: '+1.2%',
      color: 'green',
      icon: Shield,
    },
    {
      label: 'Energy Consumption',
      value: kpis?.energy_kwh_today ? Number(kpis.energy_kwh_today).toLocaleString() : '—',
      unit: 'kWh',
      trend: (kpis?.energy_change_pct ?? 0) > 0 ? 'up' : 'down',
      trendValue: `${(kpis?.energy_change_pct ?? 0) > 0 ? '+' : ''}${kpis?.energy_change_pct ?? 0}%`,
      color: 'orange',
      icon: Zap,
      pulse: (kpis?.energy_change_pct ?? 0) > 10,
    },
    {
      label: 'Machine Health Score',
      value: kpis?.machine_health_score ?? '—',
      unit: '/ 100',
      trend: 'down',
      trendValue: '-2pts',
      color: 'cyan',
      icon: Activity,
    },
  ]

  const aiModels = [
    {
      icon: Zap,
      title: 'Steel Defect Detection',
      description: 'YOLOv8-powered quality control detecting surface defects and anomalies in real-time.',
      accent: 'cyan',
      status: 'Active',
      path: '/steel-defect',
      metric: kpis ? `${kpis.total_defects_today} defects` : '...',
      metricLabel: 'today',
    },
    {
      icon: Shield,
      title: 'PPE Safety Monitoring',
      description: 'Real-time worker safety ensuring compliance with protective equipment standards.',
      accent: 'emerald',
      status: 'Active',
      path: '/ppe-monitoring',
      metric: kpis ? `${kpis.ppe_compliance_pct}%` : '...',
      metricLabel: 'compliance',
    },
    {
      icon: TrendingUp,
      title: 'Energy & CO₂ Analytics',
      description: 'Optimize energy consumption and track carbon emissions across production facilities.',
      accent: 'orange',
      status: 'Active',
      path: '/energy-analytics',
      metric: kpis ? `${Number(kpis.energy_kwh_today).toLocaleString()} kWh` : '...',
      metricLabel: 'consumed',
    },
    {
      icon: Gauge,
      title: 'Predictive Maintenance',
      description: 'Predict equipment failures and optimize maintenance schedules using ML models.',
      accent: 'blue',
      status: 'Active',
      path: '/predictive-maintenance',
      metric: kpis ? `${kpis.fleet_avg_rul}h RUL` : '...',
      metricLabel: 'avg. remaining',
    },
  ]

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: '#081120' }}>
      <BackgroundGlow />

      <div className="relative z-10 mx-auto max-w-screen-2xl px-6 py-8 sm:px-8 lg:px-10">

        {/* ── Top Bar ── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex items-center justify-between mb-8"
        >
          <motion.div variants={itemVariants}>
            <div className="flex items-center gap-2 mb-1">
              <Radio size={12} style={{ color: '#06B6D4' }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#06B6D4' }}>
                AI-Powered Industrial Monitoring
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#F9FAFB' }}>
              Industry 4.0{' '}
              <span style={{
                background: 'linear-gradient(90deg, #06B6D4, #3B82F6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                Control Center
              </span>
            </h1>
          </motion.div>

          <motion.div variants={itemVariants} className="flex items-center gap-3">
            {/* Error badge */}
            {error && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border"
                style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }}>
                <WifiOff size={12} style={{ color: '#EF4444' }} />
                <span className="text-xs" style={{ color: '#EF4444' }}>Backend offline</span>
              </div>
            )}

            {/* Refresh */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={refresh}
              className="flex items-center justify-center w-9 h-9 rounded-lg border cursor-pointer"
              style={{ background: 'rgba(11,20,35,0.85)', borderColor: 'rgba(255,255,255,0.08)' }}
            >
              <RefreshCw size={14}
                style={{ color: loading ? '#06B6D4' : '#94A3B8' }}
                className={loading ? 'animate-spin' : ''} />
            </motion.button>

            {/* Status badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border"
              style={{
                background: error ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
                borderColor: error ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)',
              }}>
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${error ? 'bg-red-400' : 'bg-emerald-400'}`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${error ? 'bg-red-400' : 'bg-emerald-400'}`} />
              </span>
              <span className="text-xs font-semibold" style={{ color: error ? '#EF4444' : '#10B981' }}>
                {error ? 'Degraded' : 'All Systems Operational'}
              </span>
            </div>

            {/* Bell with live critical count */}
            <div className="relative flex items-center justify-center w-9 h-9 rounded-lg border cursor-pointer"
              style={{ background: 'rgba(11,20,35,0.85)', borderColor: 'rgba(255,255,255,0.08)' }}>
              <Bell size={15} style={{ color: '#94A3B8' }} />
              {(kpis?.critical_machines ?? 0) > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold"
                  style={{ background: '#EF4444', color: '#fff' }}>
                  {kpis.critical_machines}
                </span>
              )}
            </div>
          </motion.div>
        </motion.div>

        {/* ── KPI Row ── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        >
          {kpiCards.map((kpi, i) => (
            <KPICard key={i} {...kpi} loading={loading} />
          ))}
        </motion.div>

        {/* ── Model Grid + Insights ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* 2×2 Model Cards */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {aiModels.map((model, i) => {
              const c = accentMap[model.accent] || accentMap.cyan
              const Icon = model.icon
              return (
                <motion.div
                  key={i}
                  variants={itemVariants}
                  whileHover="hover"
                  initial="rest"
                  animate="rest"
                  onClick={() => navigate(model.path)}
                  className="group relative flex flex-col gap-4 p-5 rounded-xl border cursor-pointer backdrop-blur-xl overflow-hidden"
                  style={{ background: 'rgba(11,20,35,0.85)', borderColor: c.border }}
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl"
                    style={{ background: `radial-gradient(ellipse at top left, ${c.glow}, transparent 60%)` }} />

                  <div className="flex items-start justify-between relative z-10">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl"
                      style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                      <Icon size={18} style={{ color: c.text }} />
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full"
                      style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                      <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: '#10B981' }} />
                      <span className="text-[10px] font-semibold" style={{ color: '#10B981' }}>{model.status}</span>
                    </div>
                  </div>

                  <div className="relative z-10 flex-1">
                    <h3 className="text-base font-bold mb-1.5" style={{ color: '#F9FAFB' }}>{model.title}</h3>
                    <p className="text-xs leading-relaxed" style={{ color: '#94A3B8' }}>{model.description}</p>
                  </div>

                  <div className="relative z-10 flex items-center justify-between pt-3 border-t"
                    style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <div>
                      {loading ? (
                        <div className="h-5 w-20 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.07)' }} />
                      ) : (
                        <>
                          <span className="text-base font-bold" style={{ color: c.text }}>{model.metric}</span>
                          <span className="text-xs ml-1.5" style={{ color: '#64748B' }}>{model.metricLabel}</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1 group-hover:gap-2 transition-all duration-200">
                      <span className="text-xs font-semibold" style={{ color: c.text }}>Open</span>
                      <ChevronRight size={13} style={{ color: c.text }} />
                    </div>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 h-px"
                    style={{ background: `linear-gradient(90deg, ${c.text}50, transparent)` }} />
                </motion.div>
              )
            })}
          </motion.div>

          {/* AI Insights Panel */}
          <motion.div variants={itemVariants} initial="hidden" animate="visible" className="xl:col-span-1">
            <InsightsPanel insights={insights} loading={loading} />
          </motion.div>
        </div>

        {/* ── Footer Status Bar ── */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.6 }}
          className="mt-6 flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl border"
          style={{ background: 'rgba(11,20,35,0.6)', borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-6">
            {[
              { label: 'Uptime',        value: '99.8%',                                                                   color: '#10B981' },
              { label: 'Avg Latency',   value: '42ms',                                                                    color: '#06B6D4' },
              { label: 'Models Active', value: '4/4',                                                                     color: '#3B82F6' },
              { label: 'Critical',      value: kpis?.critical_machines ?? '—', color: (kpis?.critical_machines ?? 0) > 0 ? '#EF4444' : '#10B981' },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs" style={{ color: '#64748B' }}>{s.label}</span>
                <span className="text-xs font-bold" style={{ color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>
          <span className="text-xs" style={{ color: '#475569' }}>
            Last sync: <span style={{ color: '#64748B' }}>just now</span>
          </span>
        </motion.div>

      </div>
    </div>
  )
}