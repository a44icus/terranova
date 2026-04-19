'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  bienId: string
  vendeurId: string
  bienTitre?: string
  vendeurEmail?: string
  vendeurNom?: string
}

type State = 'idle' | 'loading' | 'success' | 'error'

export default function ContactForm({ bienId, vendeurId, bienTitre = '', vendeurEmail, vendeurNom = '' }: Props) {
  const [state, setState] = useState<State>('idle')
  const [form, setForm] = useState({ nom: '', email: '', telephone: '', message: '' })

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nom || !form.email || !form.message) return
    // Honeypot : si ce champ est rempli, c'est un bot
    const honeypot = (e.currentTarget as HTMLFormElement).querySelector<HTMLInputElement>('[name="website"]')
    if (honeypot?.value) { setState('success'); return }
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

    if (error) {
      setState('error')
      return
    }

    // Notification email au vendeur (silencieux si erreur)
    if (vendeurEmail) {
      try {
        await fetch('/api/email/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vendeurEmail,
            vendeurNom,
            acheteurNom: form.nom.trim(),
            acheteurEmail: form.email.trim(),
            acheteurTel: form.telephone.trim() || null,
            message: form.message.trim(),
            bienTitre,
            bienId,
          }),
        })
      } catch {
        // Erreur email non bloquante
      }
    }

    setState('success')
  }

  if (state === 'success') {
    return (
      <div className="py-6 text-center space-y-2">
        <div className="text-3xl">✅</div>
        <p className="text-sm font-medium text-navy">Message envoyé !</p>
        <p className="text-xs text-navy/50">L'annonceur vous répondra par email.</p>
        <button
          onClick={() => { setState('idle'); setForm({ nom: '', email: '', telephone: '', message: '' }) }}
          className="text-xs text-primary hover:underline mt-2"
        >
          Envoyer un autre message
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Honeypot — invisible pour les humains, rempli par les bots */}
      <input name="website" type="text" tabIndex={-1} aria-hidden="true"
        className="absolute opacity-0 pointer-events-none w-0 h-0" autoComplete="off" />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-navy/50 mb-1">Nom *</label>
          <input
            type="text"
            value={form.nom}
            onChange={update('nom')}
            required
            placeholder="Votre nom"
            className="w-full text-sm border border-navy/15 rounded-lg px-3 py-2 bg-surface focus:outline-none focus:border-primary transition-colors placeholder:text-navy/25"
          />
        </div>
        <div>
          <label className="block text-xs text-navy/50 mb-1">Téléphone</label>
          <input
            type="tel"
            value={form.telephone}
            onChange={update('telephone')}
            placeholder="06 00 00 00 00"
            className="w-full text-sm border border-navy/15 rounded-lg px-3 py-2 bg-surface focus:outline-none focus:border-primary transition-colors placeholder:text-navy/25"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-navy/50 mb-1">Email *</label>
        <input
          type="email"
          value={form.email}
          onChange={update('email')}
          required
          placeholder="votre@email.fr"
          className="w-full text-sm border border-navy/15 rounded-lg px-3 py-2 bg-surface focus:outline-none focus:border-primary transition-colors placeholder:text-navy/25"
        />
      </div>

      <div>
        <label className="block text-xs text-navy/50 mb-1">Message *</label>
        <textarea
          value={form.message}
          onChange={update('message')}
          required
          rows={4}
          placeholder="Bonjour, je suis intéressé(e) par ce bien..."
          className="w-full text-sm border border-navy/15 rounded-lg px-3 py-2 bg-surface focus:outline-none focus:border-primary transition-colors resize-none placeholder:text-navy/25"
        />
      </div>

      {state === 'error' && (
        <p className="text-xs text-red-600">Une erreur est survenue. Veuillez réessayer.</p>
      )}

      <button
        type="submit"
        disabled={state === 'loading'}
        className="w-full bg-navy text-white text-sm font-medium py-2.5 rounded-xl hover:bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {state === 'loading' ? 'Envoi…' : 'Envoyer le message'}
      </button>

      <p className="text-[10px] text-navy/30 text-center">
        Vos coordonnées ne seront partagées qu'avec l'annonceur.
      </p>
    </form>
  )
}
