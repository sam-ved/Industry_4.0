import { motion } from 'framer-motion'

const cardMotion = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
}

export default function Card({ children, className = '', ...props }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={cardMotion}
      transition={{ duration: 0.36, ease: 'easeOut' }}
      className={`bg-[rgba(17,24,39,0.95)] border border-[rgba(255,255,255,0.12)] shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur-xl rounded-[20px] transition-all duration-300 hover:border-[rgba(255,255,255,0.16)] hover:shadow-[0_32px_96px_rgba(0,0,0,0.40)] ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  )
}
