// src/hooks/useDocumentMeta.ts
// Sets per-page <title> and <meta name="description"> on mount, cleans up on unmount.

import { useEffect } from 'react'

const BASE_TITLE = 'Industry 4.0'

export function useDocumentMeta(title: string, description?: string) {
  useEffect(() => {
    const prev = document.title
    document.title = title ? `${title} | ${BASE_TITLE}` : `${BASE_TITLE} — AI-Powered Industrial Monitoring`

    let metaDesc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null
    const hadExisting = !!metaDesc
    const prevDescription = metaDesc?.content ?? ''

    if (description) {
      if (!metaDesc) {
        metaDesc = document.createElement('meta')
        metaDesc.name = 'description'
        document.head.appendChild(metaDesc)
      }
      metaDesc.content = description
    }

    return () => {
      document.title = prev
      if (metaDesc && description) {
        if (hadExisting) {
          metaDesc.content = prevDescription
        } else {
          metaDesc.remove()
        }
      }
    }
  }, [title, description])
}
