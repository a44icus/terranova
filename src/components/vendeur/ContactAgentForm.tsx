'use client'

import { useState } from 'react'

interface Props {
  agentId: string
  agentName: string
}

export default function ContactAgentForm({ agentId, agentName }: Props) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ nom: '', email: '', telephone: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/email/contact-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, ...form }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Erreur envoi')
      }
      setSent(true)
    } catch (err: any) {
      setError(err.message)
    }
    setLoading(false)
  }

  const inputCls = "w-full border border-[#0F172A]/12 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#4F46E5] transition-colors bg-white"

  if (sent) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
        <div className="text-3xl mb-2">✓</div>
        <p className="text-sm font-medium text-green-800">Message envoyé à {agentName} !</p>
        <p className="text-xs text-green-600 mt-1">Il vous répondra par email dans les meilleurs délais.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-[#0F172A]/08 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-[#0F172A]/02 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">✉</span>
          <div className="text-left">
            <p className="text-sm font-medium text-[#0F172A]">Contacter {agentName}</p>
            <p className="text-xs text-[#0F172A]/40">Envoyez un message directement à cet agent</p>
          </div>
        </div>
        <span className="text-[#0F172A]/30 text-sm">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <form onSubmit={submit} className="px-6 pb-6 pt-2 border-t border-[#0F172A]/06 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#0F172A]/50 mb-1">Votre nom *</label>
              <input required type="text" placeholder="Jean Dupont" value={form.nom}
                onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#0F172A]/50 mb-1">Email *</label>
              <input required type="email" placeholder="jean@exemple.fr" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#0F172A]/50 mb-1">Téléphone</label>
            <input type="tel" placeholder="06 00 00 00 00" value={form.telephone}
              onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#0F172A]/50 mb-1">Message *</label>
            <textarea required rows={4} placeholder="Bonjour, je souhaite vous contacter au sujet de…"
              value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              className={inputCls + ' resize-none'} />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-[#0F172A] text-white rounded-xl py-3 text-sm font-medium hover:bg-[#4F46E5] transition-colors disabled:opacity-50">
            {loading ? 'Envoi…' : 'Envoyer le message'}
          </button>
        </form>
      )}
    </div>
  )
}
