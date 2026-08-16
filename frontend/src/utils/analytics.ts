// src/utils/analytics.ts
// Lightweight analytics stub — only activates when VITE_GA_MEASUREMENT_ID is set.
// Does not load any external scripts without configuration.

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || ''

let initialized = false

/**
 * Initialize analytics. Call once in the app root.
 * Only loads Google Analytics if VITE_GA_MEASUREMENT_ID is configured.
 */
export function initAnalytics(): void {
  if (!GA_ID || initialized) return
  initialized = true

  // Load gtag script dynamically
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
  document.head.appendChild(script)

  // Initialize gtag
  ;(window as any).dataLayer = (window as any).dataLayer || []
  function gtag(...args: unknown[]) {
    ;(window as any).dataLayer.push(args)
  }
  gtag('js', new Date())
  gtag('config', GA_ID, {
    send_page_view: false, // We handle page views manually for SPA
  })
}

/**
 * Track a page view. Call on route changes.
 */
export function trackPageView(path: string, title?: string): void {
  if (!GA_ID || !initialized) return

  try {
    const gtag = (window as any).gtag
    if (typeof gtag === 'function') {
      gtag('event', 'page_view', {
        page_path: path,
        page_title: title || document.title,
      })
    }
  } catch {
    // Analytics should never break the app
  }
}

/**
 * Track a custom event.
 */
export function trackEvent(eventName: string, params?: Record<string, unknown>): void {
  if (!GA_ID || !initialized) return

  try {
    const gtag = (window as any).gtag
    if (typeof gtag === 'function') {
      gtag('event', eventName, params)
    }
  } catch {
    // Analytics should never break the app
  }
}
