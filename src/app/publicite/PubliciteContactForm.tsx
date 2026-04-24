'use client'

import { useState } from 'react'

interface Props {
  formats: string[]
}

export default function PubliciteContactForm({ formats }: Props) {
  const [form, setForm] = useState({
    nom: '', email: '', telephone: '', societe: '',
    format: '', zone: '', message: '', website: '',
  })
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  function update(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.website) return // honeypot
    setStatus('sending')
    try {
      const res = await fetch('/api/email/publicite-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      setStatus(data.ok || data.skipped ? 'sent' : 'error')
    } catch {
      setStatus('error')
    }
  }

  const inputCls = "w-full border border-[#0F172A]/15 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#4F46E5] transition-colors bg-white"
  const labelCls = "block text-xs font-medium text-[#0F172A]/55 mb-1.5"

  if (status === 'sent') {
    return (
      <div className="bg-white rounded-2xl border border-[#0F172A]/08 p-10 text-center">
        <div className="text-4xl mb-4">✓</div>
        <p className="font-semibold text-[#0F172A] mb-2">Demande envoyée !</p>
        <p className="text-sm text-[#0F172A]/50">Notre équipe vous répondra sous 24h.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#0F172A]/08 p-6 space-y-4">
      {status === 'error' && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          Une erreur est survenue. Réessayez ou contactez-nous directement.
        </div>
      )}

      {/* Honeypot */}
      <input type="text" name="website" value={form.website} onChange={e => update('website', e.target.value)} className="hidden" tabIndex={-1} autoComplete="off" />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Nom *</label>
          <input type="text" required value={form.nom} onChange={e => update('nom', e.target.value)} maxLength={120} placeholder="Jean Dupont" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Email *</label>
          <input type="email" required value={form.email} onChange={e => update('email', e.target.value)} maxLength={254} placeholder="vous@agence.fr" className={inputCls} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Téléphone</label>
          <input type="tel" value={form.telephone} onChange={e => update('telephone', e.target.value)} maxLength={30} placeholder="06 00 00 00 00" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Société</label>
          <input type="text" value={form.societe} onChange={e => update('societe', e.target.value)} maxLength={120} placeholder="Mon Agence" className={inputCls} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Format souhaité</label>
          <select value={form.format} onChange={e => update('format', e.target.value)} className={inputCls}>
            <option value="">Choisir…</option>
            {formats.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Zone géographique</label>
          <input type="text" value={form.zone} onChange={e => update('zone', e.target.value)} maxLength={120} placeholder="Paris 16e, Lyon…" className={inputCls} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Message *</label>
        <textarea
          required
          value={form.message}
          onChange={e => update('message', e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder="Décrivez votre projet publicitaire…"
          className={inputCls + ' resize-none'}
        />
      </div>

      <button
        type="submit"
        disabled={status === 'sending' || !form.nom || !form.email || !form.message}
        className="w-full bg-[#4F46E5] text-white rounded-xl py-3 text-sm font-semibold hover:bg-[#4338CA] transition-colors disabled:opacity-40"
      >
        {status === 'sending' ? 'Envoi…' : 'Envoyer ma demande →'}
      </button>
    </form>
  )
}