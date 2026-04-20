'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  bienId: string
  vendeurId: string
  bienTitre?: string
  vendeurEmail?: string
  vendeurNom?: string
  delaiReponse?: string
  antispamMinutes?: number
}

type State = 'idle' | 'loading' | 'success' | 'error' | 'spam'

const ANTISPAM_KEY = 'terranova_last_contact'

export default function ContactForm({
  bienId, vendeurId, bienTitre = '', vendeurEmail, vendeurNom = '',
  delaiReponse, antispamMinutes = 5,
}: Props) {
  const [state, setState] = useState<State>('idle')
  const [form, setForm] = useState({ nom: '', email: '', telephone: '', message: '' })
  const [spamRemaining, setSpamRemaining] = useState(0)

  // Vérifier l'anti-spam au montage
  useEffect(() => {
    if (antispamMinutes <= 0) return
    const last = parseInt(localStorage.getItem(ANTISPAM_KEY) ?? '0', 10)
    const diff = Date.now() - last
    const limitMs = antispamMinutes * 60 * 1000
    if (diff < limitMs) {
      const remaining = Math.ceil((limitMs - diff) / 60000)
      setSpamRemaining(remaining)
      setState('spam')
      // Décompte live
      const interval = setInterval(() => {
        const now = Date.now() - last
        const rem = Math.ceil((limitMs - now) / 60000)
        if (rem <= 0) { clearInterval(interval); setSpamRemaining(0); setState('idle') }
        else setSpamRemaining(rem)
      }, 10000)
      return () => clearInterval(interval)
    }
  }, [antispamMinutes])

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nom || !form.email || !form.message) return

    // Honeypot
    const honeypot = (e.currentTarget as HTMLFormElement).querySelector<HTMLInputElement>('[name="website"]')
    if (honeypot?.value) { setState('success'); return }

    // Anti-spam côté client
    if (antispamMinutes > 0) {
      const last = parseInt(localStorage.getItem(ANTISPAM_KEY) ?? '0', 10)
      if (Date.now() - last < antispamMinutes * 60 * 1000) {
        setState('spam')
        return
      }
    }

    setState('loading')
    const supabase = createClient()
    const { error } = await supabase.from('contacts').insert({
      bien_id: bienId,
      vendeur_id: vendeurId,
      nom: form.nom.trim(),
      email: form.email.trim(),
      telephone: form.telephone.trim() || null,
      message: form.message.trim(),
      lu: false,
    })

    if (error) { setState('error'); return }

    // Marquer le timestamp anti-spam
    if (antispamMinutes > 0) localStorage.setItem(ANTISPAM_KEY, String(Date.now()))

    // Notification email vendeur (silencieux si erreur)
    if (vendeurEmail) {
      try {
        await fetch('/api/email/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vendeurEmail, vendeurNom,
            acheteurNom: form.nom.trim(),
            acheteurEmail: form.email.trim(),
            acheteurTel: form.telephone.trim() || null,
            message: form.message.trim(),
            bienTitre, bienId,
          }),
        })
      } catch { /* non bloquant */ }
    }

    setState('success')
  }

  // ── États alternatifs ──────────────────────────────────

  if (state === 'success') {
    return (
      <div className="py-6 text-center space-y-2">
        <div className="text-3xl">✅</div>
        <p className="text-sm font-medium text-navy">Message envoyé !</p>
        <p className="text-xs text-navy/50">
          L'annonceur vous répondra par email
          {delaiReponse ? ` sous ${delaiReponse}.` : '.'}
        </p>
        <button
          onClick={() => { setState('idle'); setForm({ nom: '', email: '', telephone: '', message: '' }) }}
          className="text-xs text-primary hover:underline mt-2"
        >
          Envoyer un autre message
        </button>
      </div>
    )
  }

  if (state === 'spam') {
    return (
      <div className="py-5 text-center space-y-2">
        <div className="text-2xl">⏳</div>
        <p className="text-sm font-medium text-navy">Merci de patienter</p>
        <p className="text-xs text-navy/50">
          Vous pourrez envoyer un nouveau message dans{' '}
          <span className="font-semibold">{spamRemaining} min</span>.
        </p>
      </div>
    )
  }

  // ── Formulaire principal ───────────────────────────────

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Honeypot */}
      <input name="website" type="text" tabIndex={-1} aria-hidden="true"
        className="absolute opacity-0 pointer-events-none w-0 h-0" autoComplete="off" />

      {/* Délai de réponse */}
      {delaiReponse && (
        <div className="flex items-center gap-1.5 text-[11px] text-navy/50 bg-navy/04 rounded-lg px-3 py-2">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          Répond généralement sous <strong className="text-navy/70">{delaiReponse}</strong>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-navy/50 mb-1">Nom *</label>
          <input type="text" value={form.nom} onChange={update('nom')} required placeholder="Votre nom"
            className="w-full text-sm border border-navy/15 rounded-lg px-3 py-2 bg-surface focus:outline-none focus:border-primary transition-colors placeholder:text-navy/25" />
        </div>
        <div>
          <label className="block text-xs text-navy/50 mb-1">Téléphone</label>
          <input type="tel" value={form.telephone} onChange={update('telephone')} placeholder="06 00 00 00 00"
            className="w-full text-sm border border-navy/15 rounded-lg px-3 py-2 bg-surface focus:outline-none focus:border-primary transition-colors placeholder:text-navy/25" />
        </div>
      </div>

      <div>
        <label className="block text-xs text-navy/50 mb-1">Email *</label>
        <input type="email" value={form.email} onChange={update('email')} required placeholder="votre@email.fr"
          className="w-full text-sm border border-navy/15 rounded-lg px-3 py-2 bg-surface focus:outline-none focus:border-primary transition-colors placeholder:text-navy/25" />
      </div>

      <div>
        <label className="block text-xs text-navy/50 mb-1">Message *</label>
        <textarea value={form.message} onChange={update('message')} required rows={4}
          placeholder="Bonjour, je suis intéressé(e) par ce bien..."
          className="w-full text-sm border border-navy/15 rounded-lg px-3 py-2 bg-surface focus:outline-none focus:border-primary transition-colors resize-none placeholder:text-navy/25" />
      </div>

      {state === 'error' && (
        <p className="text-xs text-red-600">Une erreur est survenue. Veuillez réessayer.</p>
      )}

      <button type="submit" disabled={state === 'loading'}
        className="w-full bg-navy text-white text-sm font-medium py-2.5 rounded-xl hover:bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
        {state === 'loading' ? 'Envoi…' : 'Envoyer le message'}
      </button>

      <p className="text-[10px] text-navy/30 text-center">
        Vos coordonnées ne seront partagées qu'avec l'annonceur.
      </p>
    </form>
  )
}
