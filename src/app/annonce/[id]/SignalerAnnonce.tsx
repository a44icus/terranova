'use client'

import { useState } from 'react'

const MOTIFS = [
  { value: 'prix_suspect',    label: 'Prix suspect / trop beau pour être vrai' },
  { value: 'photos_fausses',  label: 'Photos volées ou fausses' },
  { value: 'bien_inexistant', label: 'Bien inexistant ou introuvable' },
  { value: 'arnaque',         label: 'Suspicion d\'arnaque' },
  { value: 'doublon',         label: 'Annonce en doublon' },
  { value: 'autre',           label: 'Autre' },
]

interface Props {
  bienId: string
  vendeurId: string
  isLoggedIn: boolean
}

export default function SignalerAnnonce({ bienId, vendeurId, isLoggedIn }: Props) {
  const [open, setOpen]       = useState(false)
  const [motif, setMotif]     = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(false)
  const [error, setError]     = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!motif) return
    setLoading(true)
    setError('')

    const res = await fetch('/api/signalements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reported_user_id: vendeurId, bien_id: bienId, motif, message }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Une erreur est survenue.')
      setLoading(false)
      return
    }

    setDone(true)
    setLoading(false)
  }

  function handleClose() {
    setOpen(false)
    setMotif('')
    setMessage('')
    setError('')
    if (done) setDone(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-navy/30 hover:text-red-500 transition-colors"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
          <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 7l2.55 2.4A1 1 0 0116 11H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
        </svg>
        Signaler cette annonce
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10">
            {done ? (
              <div className="text-center py-4">
                <div className="text-4xl mb-3">✓</div>
                <h3 className="font-serif text-xl text-navy mb-2">Signalement envoyé</h3>
                <p className="text-sm text-navy/50 mb-5">
                  Merci. Notre équipe va examiner cette annonce.
                </p>
                <button onClick={handleClose}
                  className="bg-navy text-white text-sm font-medium px-6 py-2.5 rounded-xl hover:bg-primary transition-colors">
                  Fermer
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h3 className="font-serif text-xl text-navy">Signaler cette annonce</h3>
                    <p className="text-xs text-navy/45 mt-1">Votre signalement sera examiné par notre équipe.</p>
                  </div>
                  <button onClick={handleClose} className="text-navy/30 hover:text-navy/60 transition-colors text-xl leading-none mt-0.5">×</button>
                </div>

                {!isLoggedIn ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                    Vous devez être <a href="/auth/login" className="font-semibold underline">connecté</a> pour signaler une annonce.
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-navy/55 mb-2">Motif *</label>
                      <div className="space-y-2">
                        {MOTIFS.map(m => (
                          <label key={m.value}
                            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                              motif === m.value
                                ? 'border-primary/40 bg-primary/04'
                                : 'border-navy/12 hover:border-navy/25'
                            }`}>
                            <input
                              type="radio" name="motif" value={m.value}
                              checked={motif === m.value}
                              onChange={() => setMotif(m.value)}
                              className="accent-primary"
                            />
                            <span className="text-sm text-navy/70">{m.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-navy/55 mb-1.5">
                        Précisions <span className="font-normal text-navy/35">(optionnel)</span>
                      </label>
                      <textarea
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        rows={3}
                        maxLength={500}
                        placeholder="Décrivez brièvement le problème…"
                        className="w-full border border-navy/15 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors resize-none"
                      />
                    </div>

                    {error && (
                      <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                        {error}
                      </div>
                    )}

                    <div className="flex gap-3 pt-1">
                      <button type="button" onClick={handleClose}
                        className="flex-1 border border-navy/15 text-navy/60 text-sm font-medium py-2.5 rounded-xl hover:border-navy/30 transition-colors">
                        Annuler
                      </button>
                      <button type="submit" disabled={!motif || loading}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-40">
                        {loading ? 'Envoi…' : 'Envoyer'}
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
