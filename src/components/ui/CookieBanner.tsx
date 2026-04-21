'use client'
import { useState, useEffect } from 'react'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('cookie_consent')) setVisible(true)
  }, [])

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#0F172A] text-white px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 z-50 text-sm">
      <p className="text-white/80">
        Ce site utilise des cookies pour améliorer votre expérience.
      </p>
      <button
        onClick={() => { localStorage.setItem('cookie_consent', '1'); setVisible(false) }}
        className="bg-white text-[#0F172A] px-4 py-2 rounded-lg font-medium shrink-0 hover:bg-white/90 transition-colors"
      >
        Accepter
      </button>
    </div>
  )
}
