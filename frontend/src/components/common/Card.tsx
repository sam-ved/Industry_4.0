import { motion } from 'framer-motion'

const cardMotion = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
}

export function Card({ children, className = '', ...props }: any) {
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

export default Card;

export function CardHeader({ children, className = '', ...props }: any) {
  return (
    <div className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className = '', ...props }: any) {
  return (
    <h3 className={`font-semibold leading-none tracking-tight ${className}`} {...props}>
      {children}
    </h3>
  )
}

export function CardContent({ children, className = '', ...props }: any) {
  return (
    <div className={`p-6 pt-0 ${className}`} {...props}>
      {children}
    </div>
  )
}
