'use client'

import { useState } from 'react'

interface Props {
  bienId:    string
  vendeurId: string
  bienTitre: string
  userId?:   string
  userNom?:  string
  userEmail?: string
}

const CRENEAUX = ['Matin (9h-12h)', 'Après-midi (14h-18h)', 'Soirée (18h-20h)', 'Flexible']

export default function DemandeVisiteForm({ bienId, vendeurId, bienTitre, userId, userNom, userEmail }: Props) {
  const [open,    setOpen]    = useState(false)
  const [nom,     setNom]     = useState(userNom   ?? '')
  const [email,   setEmail]   = useState(userEmail ?? '')
  const [tel,     setTel]     = useState('')
  const [date,    setDate]    = useState('')
  const [creneau, setCreneau] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error,   setError]   = useState('')

  // Date min = demain
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/visites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bienId,
          vendeurId,
          demandeurId:    userId ?? null,
          demandeurNom:   nom,
          demandeurEmail: email,
          demandeurTel:   tel || null,
          dateSouhaitee:  date,
          creneau:        creneau || null,
          message:        message || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur')
      setSuccess(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="bg-white rounded-2xl border border-navy/08 p-6">
        <div className="text-center py-4">
          <div className="text-3xl mb-3">✅</div>
          <h3 className="font-medium text-navy mb-1">Demande envoyée !</h3>
          <p className="text-sm text-navy/50">
            Le vendeur va vous contacter pour confirmer la visite de <em>{bienTitre}</em>.
          </p>
          <button onClick={() => { setSuccess(false); setOpen(false) }}
            className="mt-4 text-xs text-primary hover:underline">
            Fermer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-navy/08 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-navy/02 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">📅</span>
          <div>
            <div className="font-medium text-navy text-sm">Planifier une visite</div>
            {!open && <div className="text-xs text-navy/40 mt-0.5">Demander une visite gratuitement</div>}
          </div>
        </div>
        <svg className={`w-4 h-4 text-navy/40 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="px-6 pb-6 border-t border-navy/06 pt-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-navy/60 font-medium mb-1 block">Votre nom *</label>
              <input
                value={nom} onChange={e => setNom(e.target.value)}
                required maxLength={100}
                className="w-full text-sm border border-navy/15 rounded-xl px-3 py-2.5 focus:outline-none focus:border-primary"
                placeholder="Jean Dupont"
              />
            </div>
            <div>
              <label className="text-xs text-navy/60 font-medium mb-1 block">Email *</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                required
                className="w-full text-sm border border-navy/15 rounded-xl px-3 py-2.5 focus:outline-none focus:border-primary"
                placeholder="jean@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-navy/60 font-medium mb-1 block">Téléphone</label>
              <input
                type="tel" value={tel} onChange={e => setTel(e.target.value)}
                maxLength={20}
                className="w-full text-sm border border-navy/15 rounded-xl px-3 py-2.5 focus:outline-none focus:border-primary"
                placeholder="06 12 34 56 78"
              />
            </div>
            <div>
              <label className="text-xs text-navy/60 font-medium mb-1 block">Date souhaitée *</label>
              <input
                type="date" value={date} onChange={e => setDate(e.target.value)}
                required min={minDate}
                className="w-full text-sm border border-navy/15 rounded-xl px-3 py-2.5 focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Créneaux */}
          <div>
            <label className="text-xs text-navy/60 font-medium mb-1.5 block">Créneau préféré</label>
            <div className="flex flex-wrap gap-2">
              {CRENEAUX.map(c => (
                <button
                  key={c} type="button"
                  onClick={() => setCreneau(c === creneau ? '' : c)}
                  className={`text-xs px-3 py-1.5 rounded-full transition-all ${
                    creneau === c
                      ? 'bg-primary text-white'
                      : 'bg-navy/06 text-navy/60 hover:bg-navy/10'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="text-xs text-navy/60 font-medium mb-1 block">Message (optionnel)</label>
            <textarea
              value={message} onChange={e => setMessage(e.target.value)}
              rows={2} maxLength={500}
              className="w-full text-sm border border-navy/15 rounded-xl px-3 py-2.5 focus:outline-none focus:border-primary resize-none"
              placeholder="Questions particulières, accessibilité..."
            />
          </div>

          {error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full bg-primary text-white text-sm font-semibold py-3 rounded-xl hover:bg-primary/90 disabled:opacity-60 transition-all"
          >
            {loading ? 'Envoi en cours...' : '📅 Demander une visite'}
          </button>

          <p className="text-[11px] text-navy/35 text-center">
            Le vendeur vous contactera pour confirmer le créneau.
          </p>
        </form>
      )}
    </div>
  )
}
