// src/pages/PrivacyPolicy.tsx
// Privacy Policy page — uses verified project info only, flags unknowns

import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Shield } from 'lucide-react'
import BackgroundGlow from '../components/common/BackgroundGlow'
import Footer from '../components/common/Footer'
import { useDocumentMeta } from '../hooks/useDocumentMeta'

export default function PrivacyPolicy() {
  const navigate = useNavigate()
  useDocumentMeta('Privacy Policy', 'Privacy Policy for Industry 4.0 — how we handle data, analytics, and user information.')

  const contactEmail = import.meta.env.VITE_CONTACT_EMAIL || '[Contact email not configured]'
  const lastUpdated = 'August 2026'

  return (
    <div className="relative min-h-screen" style={{ background: '#081120' }}>
      <BackgroundGlow />

      <div className="relative z-10 mx-auto max-w-3xl px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:text-white mb-6"
            style={{ background: 'rgba(255,255,255,0.05)', color: '#94A3B8' }}
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-xl"
              style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)' }}
            >
              <Shield size={20} style={{ color: '#06B6D4' }} />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: '#F9FAFB' }}>Privacy Policy</h1>
          </div>
          <p className="text-sm" style={{ color: '#64748B' }}>Last updated: {lastUpdated}</p>
        </div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border p-8 space-y-8"
          style={{ background: 'rgba(11,20,35,0.85)', borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <Section title="1. Overview">
            Industry 4.0 is an AI-powered industrial monitoring platform. This policy explains how data
            is collected, used, and protected when you use the application.
          </Section>

          <Section title="2. Information We Collect">
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>
                <strong>Uploaded files</strong> — Images and CSV datasets you upload for AI analysis
                are processed on our servers and may be temporarily stored for the duration of your session.
              </li>
              <li>
                <strong>Usage data</strong> — We may collect anonymous usage metrics such as pages visited
                and features used to improve the platform.
              </li>
              <li>
                <strong>Authentication tokens</strong> — Session tokens are stored locally in your browser
                (localStorage) for authentication purposes.
              </li>
            </ul>
          </Section>

          <Section title="3. How We Use Your Information">
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>To provide AI-powered analysis (defect detection, PPE monitoring, energy analytics, predictive maintenance).</li>
              <li>To generate insights and recommendations using machine learning models.</li>
              <li>To improve platform performance and reliability.</li>
            </ul>
          </Section>

          <Section title="4. Data Storage & Security">
            Uploaded files are processed in memory and may be temporarily cached on the server. We use
            industry-standard security practices to protect data in transit (HTTPS) and at rest.
            Authentication tokens are stored locally in your browser.
          </Section>

          <Section title="5. Third-Party Services">
            The platform may integrate with third-party AI services (such as LLM providers) to generate
            explanations and insights. Data sent to these services is limited to the analysis context
            required to generate a response.
          </Section>

          <Section title="6. Cookies & Local Storage">
            This application uses browser localStorage for essential functionality (authentication tokens).
            No non-essential tracking cookies are used.
          </Section>

          <Section title="7. Your Rights">
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>You may clear your browser's localStorage to remove stored authentication tokens.</li>
              <li>Uploaded files are not permanently stored unless explicitly saved.</li>
              <li>You may request deletion of any data associated with your account.</li>
            </ul>
          </Section>

          <Section title="8. Data Retention">
            Temporary analysis data is automatically removed after your session ends. No uploaded images
            or datasets are retained beyond the active session unless required for model training workflows
            you explicitly initiate.
          </Section>

          <Section title="9. Contact">
            For privacy-related inquiries, please contact us at:{' '}
            <span style={{ color: '#06B6D4' }}>{contactEmail}</span>
          </Section>
        </motion.div>
      </div>

      <Footer />
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-semibold mb-2" style={{ color: '#F9FAFB' }}>{title}</h2>
      <div className="text-sm leading-relaxed" style={{ color: '#94A3B8' }}>
        {children}
      </div>
    </section>
  )
}
