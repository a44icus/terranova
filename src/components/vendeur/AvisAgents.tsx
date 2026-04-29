'use client'

import { useState } from 'react'

interface Avis {
  id:          string
  auteur_nom:  string
  auteur_id:   string | null
  note:        number
  commentaire: string | null
  created_at:  string
}

interface Props {
  agentId:     string
  avis:        Avis[]
  userId?:     string  // utilisateur connecté
  hasDejaNote: boolean // l'user connecté a déjà noté
}

function Stars({ note, interactive = false, onSelect }: {
  note: number
  interactive?: boolean
  onSelect?: (n: number) => void
}) {
  const [hovered, setHovered] = useState(0)

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type={interactive ? 'button' : undefined}
          onClick={interactive ? () => onSelect?.(i) : undefined}
          onMouseEnter={interactive ? () => setHovered(i) : undefined}
          onMouseLeave={interactive ? () => setHovered(0) : undefined}
          className={interactive ? 'cursor-pointer' : 'cursor-default'}
          style={{ background: 'none', border: 'none', padding: 0 }}
        >
          <svg
            className={`w-5 h-5 transition-colors ${
              i <= (hovered || note)
                ? 'text-amber-400'
                : 'text-navy/15'
            }`}
            fill="currentColor" viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  )
}

export default function AvisAgents({ agentId, avis: initialAvis, userId, hasDejaNote: initialHasNote }: Props) {
  const [avis,        setAvis]        = useState(initialAvis)
  const [hasDejaNote, setHasDejaNote] = useState(initialHasNote)
  const [note,        setNote]        = useState(5)
  const [commentaire, setCommentaire] = useState('')
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [showForm,    setShowForm]    = useState(false)

  const moyenne = avis.length
    ? avis.reduce((s, a) => s + a.note, 0) / avis.length
    : 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/avis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, note, commentaire: commentaire || null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur')

      // Optimistic update
      setAvis(prev => [{
        id: crypto.randomUUID(),
        auteur_id:   userId ?? null,
        auteur_nom:  'Vous',
        note,
        commentaire: commentaire || null,
        created_at:  new Date().toISOString(),
      }, ...prev])
      setHasDejaNote(true)
      setShowForm(false)
      setCommentaire('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(avisId: string) {
    await fetch(`/api/avis?id=${avisId}`, { method: 'DELETE' })
    setAvis(prev => prev.filter(a => a.id !== avisId))
    setHasDejaNote(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-[#0F172A]/08 p-6">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h2 className="font-serif text-xl text-[#0F172A] mb-2">Avis clients</h2>
          {avis.length > 0 ? (
            <div className="flex items-center gap-3">
              <Stars note={Math.round(moyenne)} />
              <span className="font-serif text-2xl text-[#0F172A]">{moyenne.toFixed(1)}</span>
              <span className="text-sm text-[#0F172A]/40">{avis.length} avis</span>
            </div>
          ) : (
            <p className="text-sm text-[#0F172A]/40">Aucun avis pour le moment</p>
          )}
        </div>

        {/* CTA laisser un avis */}
        {userId && !hasDejaNote && userId !== agentId && (
          <button
            onClick={() => setShowForm(s => !s)}
            className="text-sm font-semibold px-4 py-2 rounded-xl bg-primary/08 text-primary hover:bg-primary/15 transition-all flex-shrink-0"
          >
            ✍️ Laisser un avis
          </button>
        )}
        {!userId && (
          <a href="/auth/login" className="text-sm text-primary hover:underline flex-shrink-0">
            Connectez-vous pour noter
          </a>
        )}
      </div>

      {/* Formulaire */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[#F8FAFC] rounded-xl p-4 mb-6 space-y-3">
          <h3 className="text-sm font-medium text-[#0F172A]">Votre avis</h3>

          <div>
            <div className="text-xs text-[#0F172A]/60 mb-1.5">Note *</div>
            <Stars note={note} interactive onSelect={setNote} />
          </div>

          <div>
            <label className="text-xs text-[#0F172A]/60 mb-1 block">Commentaire (optionnel)</label>
            <textarea
              value={commentaire} onChange={e => setCommentaire(e.target.value)}
              rows={3} maxLength={1000}
              className="w-full text-sm border border-[#0F172A]/12 rounded-xl px-3 py-2.5 focus:outline-none focus:border-primary resize-none"
              placeholder="Partagez votre expérience avec cet agent..."
            />
          </div>

          {error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="submit" disabled={loading}
              className="flex-1 bg-primary text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-primary/90 disabled:opacity-60 transition-all"
            >
              {loading ? 'Envoi...' : 'Publier mon avis'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 text-sm text-[#0F172A]/50 hover:text-[#0F172A] transition-colors">
              Annuler
            </button>
          </div>
        </form>
      )}

      {/* Répartition par note */}
      {avis.length > 0 && (
        <div className="mb-5 space-y-1.5">
          {[5, 4, 3, 2, 1].map(n => {
            const count = avis.filter(a => a.note === n).length
            const pct   = avis.length > 0 ? (count / avis.length) * 100 : 0
            return (
              <div key={n} className="flex items-center gap-2 text-xs text-[#0F172A]/50">
                <span className="w-3 text-right">{n}</span>
                <svg className="w-3 h-3 text-amber-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <div className="flex-1 h-1.5 bg-navy/08 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-6 text-right">{count}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Liste des avis */}
      <div className="space-y-4">
        {avis.map(a => (
          <div key={a.id} className="border-t border-[#0F172A]/06 pt-4 first:border-0 first:pt-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-xs font-semibold text-primary flex-shrink-0">
                  {a.auteur_nom[0]?.toUpperCase() ?? '?'}
                </div>
                <span className="text-sm font-medium text-[#0F172A]">{a.auteur_nom}</span>
                <Stars note={a.note} />
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[11px] text-[#0F172A]/35">
                  {new Date(a.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                {a.auteur_id === userId && (
                  <button onClick={() => handleDelete(a.id)}
                    className="text-[11px] text-red-400 hover:text-red-600 transition-colors">
                    Supprimer
                  </button>
                )}
              </div>
            </div>
            {a.commentaire && (
              <p className="text-sm text-[#0F172A]/60 mt-2 leading-relaxed">
                {a.commentaire}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
