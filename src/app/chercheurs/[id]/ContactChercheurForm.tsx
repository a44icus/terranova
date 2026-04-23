'use client'

import { useState } from 'react'

interface Props {
  chercheurId: string
  chercheurPrenom: string
}

export default function ContactChercheurForm({ chercheurId, chercheurPrenom }: Props) {
  const [form, setForm] = useState({ nom: '', email: '', telephone: '', message: '', website: '' })
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  function update(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.website) return // honeypot
    if (!form.nom.trim() || !form.email.trim() || !form.message.trim()) return

    setStatus('sending')
    try {
      const res = await fetch('/api/email/chercheur-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chercheurId,
          vendeurNom: form.nom.trim(),
          vendeurEmail: form.email.trim(),
          vendeurTel: form.telephone.trim(),
          message: form.message.trim(),
        }),
      })
      const data = await res.json()
      if (data.ok || data.skipped) {
        setStatus('sent')
      } else {
        setErrorMsg(data.error ?? 'Erreur lors de l\'envoi.')
        setStatus('error')
      }
    } catch {
      setStatus('error')
      setErrorMsg('Erreur réseau.')
    }
  }

  const inputCls = "w-full border border-navy/15 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors bg-white"
  const labelCls = "block text-xs font-medium text-navy/55 mb-1.5"

  if (status === 'sent') {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
        <div className="text-3xl mb-3">✓</div>
        <p className="text-sm font-medium text-emerald-800">Message envoyé !</p>
        <p className="text-xs text-emerald-600 mt-1">{chercheurPrenom} recevra votre message par email.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {status === 'error' && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{errorMsg}</div>
      )}

      {/* Honeypot */}
      <input type="text" name="website" value={form.website} onChange={e => update('website', e.target.value)} className="hidden" tabIndex={-1} autoComplete="off" />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Votre nom *</label>
          <input type="text" value={form.nom} onChange={e => update('nom', e.target.value)} required maxLength={120} className={inputCls} placeholder="Jean Dupont" />
        </div>
        <div>
          <label className={labelCls}>Votre email *</label>
          <input type="email" value={form.email} onChange={e => update('email', e.target.value)} required maxLength={254} className={inputCls} placeholder="vous@email.fr" />
        </div>
      </div>

      <div>
        <label className={labelCls}>Téléphone <span className="text-navy/30 font-normal">(optionnel)</span></label>
        <input type="tel" value={form.telephone} onChange={e => update('telephone', e.target.value)} maxLength={30} className={inputCls} placeholder="06 00 00 00 00" />
      </div>

      <div>
        <label className={labelCls}>Votre message *</label>
        <textarea
          value={form.message}
          onChange={e => update('message', e.target.value)}
          required
          rows={4}
          maxLength={2000}
          placeholder={`Bonjour ${chercheurPrenom}, j'ai un bien qui pourrait correspondre à votre recherche…`}
          className={inputCls + ' resize-none'}
        />
        <p className="text-[11px] text-navy/35 mt-1">{form.message.length}/2000</p>
      </div>

      <button
        type="submit"
        disabled={status === 'sending' || !form.nom || !form.email || !form.message}
        className="w-full bg-primary text-white rounded-xl py-3 text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-40"
      >
        {status === 'sending' ? 'Envoi…' : `Contacter ${chercheurPrenom}`}
      </button>
    </form>
  )
}
