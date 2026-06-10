import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'

export default function AIModelCard({
  icon: Icon,
  title,
  description,
  accent = 'cyan',
  status = 'Active',
  onClick,
}) {
  const accentColors = {
    cyan: {
      bg: 'rgba(6, 182, 212, 0.1)',
      border: 'rgba(6, 182, 212, 0.3)',
      glow: 'rgba(6, 182, 212, 0.2)',
      text: '#06B6D4',
      hover: 'rgba(6, 182, 212, 0.15)',
    },
    blue: {
      bg: 'rgba(59, 130, 246, 0.1)',
      border: 'rgba(59, 130, 246, 0.3)',
      glow: 'rgba(59, 130, 246, 0.2)',
      text: '#3B82F6',
      hover: 'rgba(59, 130, 246, 0.15)',
    },
    emerald: {
      bg: 'rgba(16, 185, 129, 0.1)',
      border: 'rgba(16, 185, 129, 0.3)',
      glow: 'rgba(16, 185, 129, 0.2)',
      text: '#10B981',
      hover: 'rgba(16, 185, 129, 0.15)',
    },
    orange: {
      bg: 'rgba(245, 158, 11, 0.1)',
      border: 'rgba(245, 158, 11, 0.3)',
      glow: 'rgba(245, 158, 11, 0.2)',
      text: '#F59E0B',
      hover: 'rgba(245, 158, 11, 0.15)',
    },
  }

  const colors = accentColors[accent]

  const cardVariants: any = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  }

  const hoverVariants: any = {
    rest: { y: 0, boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)' },
    hover: {
      y: -8,
      boxShadow: `0 40px 80px ${colors.glow}, 0 0 60px ${colors.glow}`,
      transition: { duration: 0.3, ease: 'easeOut' },
    },
  }

  const borderVariants = {
    rest: { borderColor: colors.border },
    hover: { borderColor: colors.text },
  }

  const glowVariants = {
    rest: { opacity: 0, scale: 0.95 },
    hover: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
  }

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="relative cursor-pointer group h-full"
    >
      {/* Glow Effect */}
      <motion.div
        variants={glowVariants}
        className="absolute inset-0 rounded-[24px] blur-2xl -z-10"
        style={{ background: colors.glow }}
      />

      {/* Main Card */}
      <motion.div
        variants={hoverVariants}
        initial="rest"
        whileHover="hover"
        className="relative h-full rounded-[24px] border-2 backdrop-blur-xl transition-all duration-300"
        style={{
          background: 'rgba(17, 24, 39, 0.7)',
          borderColor: colors.border,
        }}
      >
        {/* Inner Glow Border */}
        <motion.div
          variants={borderVariants}
          className="absolute inset-0 rounded-[24px] pointer-events-none border-2 transition-colors duration-300"
          style={{
            borderColor: colors.border,
            boxShadow: `inset 0 0 20px ${colors.bg}`,
          }}
        />

        <div className="relative p-8 h-full flex flex-col justify-between">
          {/* Top Section */}
          <div className="space-y-4">
            {/* Icon Container */}
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="inline-flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300"
              style={{
                background: colors.bg,
                border: `2px solid ${colors.text}`,
              }}
            >
              <Icon className="h-8 w-8" style={{ color: colors.text }} />
            </motion.div>

            {/* Title */}
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-[#F9FAFB] group-hover:text-[#FFFFFF] transition-colors duration-300">
                {title}
              </h3>
              <p className="text-sm leading-relaxed text-[#CBD5E1] group-hover:text-[#E2E8F0] transition-colors duration-300">
                {description}
              </p>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="flex items-center justify-between pt-6">
            {/* Status Badge */}
            <motion.div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border"
              style={{
                background: colors.bg,
                borderColor: colors.text,
                color: colors.text,
              }}
            >
              <span className="inline-block h-2 w-2 rounded-full animate-pulse" style={{ background: colors.text }} />
              {status}
            </motion.div>

            {/* Arrow Icon */}
            <motion.div
              whileHover={{ x: 4 }}
              className="inline-flex items-center justify-center h-8 w-8 rounded-lg transition-all duration-300 group-hover:bg-white/5"
              style={{
                color: colors.text,
              }}
            >
              <ChevronRight className="h-5 w-5" />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
