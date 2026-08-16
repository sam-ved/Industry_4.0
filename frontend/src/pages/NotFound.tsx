// src/pages/NotFound.tsx
// Custom 404 page matching existing dark industrial design language

import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, AlertTriangle, ArrowLeft } from 'lucide-react'
import BackgroundGlow from '../components/common/BackgroundGlow'
import { useDocumentMeta } from '../hooks/useDocumentMeta'

export default function NotFound() {
  const navigate = useNavigate()
  useDocumentMeta('Page Not Found', 'The requested page could not be found. Navigate back to the Industry 4.0 dashboard.')

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: '#081120' }}>
      <BackgroundGlow />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="flex flex-col items-center max-w-md"
        >
          {/* Icon */}
          <div
            className="flex items-center justify-center w-20 h-20 rounded-2xl mb-6"
            style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
            }}
          >
            <AlertTriangle size={36} style={{ color: '#EF4444' }} />
          </div>

          {/* 404 Code */}
          <h1
            className="text-7xl font-bold tracking-tight mb-2"
            style={{
              background: 'linear-gradient(135deg, #EF4444, #F97316)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            404
          </h1>

          {/* Message */}
          <h2 className="text-xl font-semibold mb-3" style={{ color: '#F9FAFB' }}>
            Page Not Found
          </h2>
          <p className="text-sm leading-relaxed mb-8" style={{ color: '#94A3B8' }}>
            The page you're looking for doesn't exist or has been moved.
            Head back to the dashboard to continue monitoring your operations.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/')}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all w-full sm:w-auto cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #06B6D4, #3B82F6)',
                color: '#020617',
              }}
            >
              <Home size={16} />
              Back to Dashboard
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(-1)}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all border w-full sm:w-auto cursor-pointer"
              style={{
                background: 'rgba(11,20,35,0.85)',
                borderColor: 'rgba(255,255,255,0.1)',
                color: '#CBD5E1',
              }}
            >
              <ArrowLeft size={16} />
              Go Back
            </motion.button>
          </div>

          {/* Footer hint */}
          <p className="mt-10 text-xs" style={{ color: '#475569' }}>
            Industry 4.0 Control Center
          </p>
        </motion.div>
      </div>
    </div>
  )
}
