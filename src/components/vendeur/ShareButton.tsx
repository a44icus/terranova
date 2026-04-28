'use client'

import { useState } from 'react'

interface Props {
  name: string
}

export default function ShareButton({ name }: Props) {
  const [copied, setCopied] = useState(false)

  async function share() {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: name, url })
        return
      } catch {}
    }
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button onClick={share}
      className="flex items-center gap-2 text-sm text-white/70 hover:text-white border border-white/15 hover:border-white/30 px-4 py-2 rounded-lg transition-all">
      {copied ? '✓ Lien copié' : '🔗 Partager'}
    </button>
  )
}
