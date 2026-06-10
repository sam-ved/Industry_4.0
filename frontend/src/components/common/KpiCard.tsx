import { motion } from 'framer-motion'
import Card from './Card'

const accentStyles = {
  cyan: { 
    icon: 'text-[#06B6D4]', 
    label: 'bg-[#06B6D4]/20 text-[#06B6D4] border border-[#06B6D4]/40',
    progress: 'bg-[#06B6D4]'
  },
  blue: { 
    icon: 'text-[#3B82F6]', 
    label: 'bg-[#3B82F6]/20 text-[#3B82F6] border border-[#3B82F6]/40',
    progress: 'bg-[#3B82F6]'
  },
  green: { 
    icon: 'text-[#10B981]', 
    label: 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40',
    progress: 'bg-[#10B981]'
  },
  amber: { 
    icon: 'text-[#F59E0B]', 
    label: 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40',
    progress: 'bg-[#F59E0B]'
  },
}

export default function KpiCard({ title, value, delta, icon, accent = 'cyan', className = '' }) {
  const styles = accentStyles[accent] ?? accentStyles.cyan

  return (
    <Card className={className}>
      <motion.div
        whileHover={{ y: -6 }}
        transition={{ type: 'spring', stiffness: 220, damping: 18 }}
        className="p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-xs uppercase tracking-[0.08em] font-semibold text-[#94A3B8]">{title}</p>
            <p className="mt-3 text-4xl font-bold text-[#F9FAFB] tracking-tight">{value}</p>
          </div>
          <motion.div 
            whileHover={{ scale: 1.12 }}
            className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] ${styles.icon}`}
          >
            {icon}
          </motion.div>
        </div>
        {delta ? (
          <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
            <span className={`inline-flex rounded-lg px-3 py-1.5 font-semibold text-sm ${styles.label}`}>
              {delta}
            </span>
            <span className="text-[#CBD5E1]">since last cycle</span>
          </div>
        ) : null}
      </motion.div>
    </Card>
  )
}
