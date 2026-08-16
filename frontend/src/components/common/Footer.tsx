// src/components/common/Footer.tsx
// Compact site footer with legal links matching dark industrial design

import { Link } from 'react-router-dom'
import { Shield } from 'lucide-react'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer
      className="relative z-10 mt-10 border-t px-6 py-6"
      style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(8,17,32,0.7)' }}
    >
      <div className="mx-auto max-w-screen-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Shield size={14} style={{ color: '#06B6D4' }} />
          <span className="text-xs" style={{ color: '#64748B' }}>
            © {year} Industry 4.0. All rights reserved.
          </span>
        </div>

        <nav className="flex items-center gap-4" aria-label="Legal">
          <Link
            to="/privacy"
            className="text-xs transition-colors hover:text-[#CBD5E1]"
            style={{ color: '#64748B' }}
          >
            Privacy Policy
          </Link>
          <span className="text-xs" style={{ color: '#334155' }}>·</span>
          <Link
            to="/terms"
            className="text-xs transition-colors hover:text-[#CBD5E1]"
            style={{ color: '#64748B' }}
          >
            Terms & Conditions
          </Link>
        </nav>
      </div>
    </footer>
  )
}
