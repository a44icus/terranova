'use client'

import { useState, useEffect } from 'react'

interface Props {
  texte: string
}

const STORAGE_KEY = 'tn_cookies_accepted'

export default function CookieBanner({ texte }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true)
  }, [])

  function accept() {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  function decline() {
    localStorage.setItem(STORAGE_KEY, '0')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[900] bg-navy/95 backdrop-blur-sm text-white px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3 shadow-2xl">
      <p className="text-xs text-white/70 flex-1 leading-relaxed">{texte}</p>
      <div className="flex gap-2 flex-shrink-0">
        <button
          onClick={decline}
          className="text-xs px-3 py-1.5 rounded-lg border border-white/20 text-white/50 hover:text-white hover:border-white/40 transition-colors"
        >
          Refuser
        </button>
        <button
          onClick={accept}
          className="text-xs px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-dark text-white font-medium transition-colors"
        >
          Accepter
        </button>
      </div>
    </div>
  )
}
