// src/pages/Terms.tsx
// Terms & Conditions page — uses verified project info only, flags unknowns

import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, FileText } from 'lucide-react'
import BackgroundGlow from '../components/common/BackgroundGlow'
import Footer from '../components/common/Footer'
import { useDocumentMeta } from '../hooks/useDocumentMeta'

export default function Terms() {
  const navigate = useNavigate()
  useDocumentMeta('Terms & Conditions', 'Terms and Conditions for Industry 4.0 — usage rules, responsibilities, and service terms.')

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
              style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}
            >
              <FileText size={20} style={{ color: '#3B82F6' }} />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: '#F9FAFB' }}>Terms & Conditions</h1>
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
          <Section title="1. Acceptance of Terms">
            By accessing and using the Industry 4.0 platform, you agree to be bound by these Terms
            and Conditions. If you do not agree, please discontinue use of the platform.
          </Section>

          <Section title="2. Description of Service">
            Industry 4.0 is an AI-powered industrial monitoring platform providing defect detection,
            PPE compliance monitoring, energy analytics, predictive maintenance, simulation, and
            AutoML capabilities. The platform uses machine learning models to analyze uploaded data
            and generate insights.
          </Section>

          <Section title="3. Acceptable Use">
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Use the platform only for lawful industrial monitoring and analysis purposes.</li>
              <li>Do not upload malicious files, malware, or data intended to exploit the system.</li>
              <li>Do not attempt to reverse-engineer, decompile, or extract proprietary ML models.</li>
              <li>Do not use automated tools to scrape or overload the platform.</li>
            </ul>
          </Section>

          <Section title="4. User Responsibilities">
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>You are responsible for the data you upload and ensuring you have the right to use it.</li>
              <li>You are responsible for maintaining the confidentiality of your authentication credentials.</li>
              <li>AI-generated insights are advisory in nature and should not replace professional engineering judgment.</li>
            </ul>
          </Section>

          <Section title="5. Intellectual Property">
            The platform, including its design, codebase, ML models, and documentation, is protected by
            intellectual property laws. You retain ownership of data you upload, but grant the platform
            a temporary license to process it for analysis purposes.
          </Section>

          <Section title="6. Service Availability">
            We strive to maintain high availability but do not guarantee uninterrupted access.
            The platform may be temporarily unavailable for maintenance, updates, or due to
            circumstances beyond our control.
          </Section>

          <Section title="7. Limitation of Liability">
            The platform and its AI-generated insights are provided "as is" without warranty.
            We are not liable for decisions made based on AI-generated recommendations, analysis
            inaccuracies, data loss, or business interruptions arising from the use of the platform.
          </Section>

          <Section title="8. Termination">
            We reserve the right to suspend or terminate access to the platform for users who violate
            these terms. You may discontinue use at any time by ceasing to access the platform and
            clearing stored authentication data.
          </Section>

          <Section title="9. Changes to Terms">
            We may update these Terms from time to time. Continued use of the platform after changes
            are posted constitutes acceptance of the updated Terms.
          </Section>

          <Section title="10. Contact">
            For questions about these terms, please contact us at:{' '}
            <span style={{ color: '#3B82F6' }}>{contactEmail}</span>
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
