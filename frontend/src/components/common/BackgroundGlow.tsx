import { motion } from 'framer-motion'

export default function BackgroundGlow() {
  return (
    <div className="fixed inset-0 -z-50 overflow-hidden">
      {/* Main Background */}
      <div className="absolute inset-0 bg-[#081120]" />

      {/* Animated Gradient Orbs */}
      <motion.div
        animate={{
          top: ['0%', '20%', '0%'],
          left: ['0%', '10%', '0%'],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #06B6D4, transparent)' }}
      />

      <motion.div
        animate={{
          top: ['50%', '40%', '50%'],
          right: ['0%', '15%', '0%'],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute w-[700px] h-[700px] rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #3B82F6, transparent)' }}
      />

      <motion.div
        animate={{
          bottom: ['0%', '15%', '0%'],
          left: ['50%', '45%', '50%'],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute w-[500px] h-[500px] rounded-full blur-3xl opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #10B981, transparent)' }}
      />

      {/* Animated Grid */}
      <div className="absolute inset-0 bg-grid opacity-[0.03] pointer-events-none" />

      {/* Radial Gradient Overlay */}
      <div className="absolute inset-0 bg-radial-gradient pointer-events-none opacity-40" />
    </div>
  )
}
