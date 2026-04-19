'use client'
import { useState } from 'react'

const CATEGORIES = [
  { value: 'appartement', label: 'Appartement' },
  { value: 'maison', label: 'Maison' },
  { value: 'bureau', label: 'Bureau / Local' },
  { value: 'terrain', label: 'Terrain' },
]

const ETATS = [
  { value: 'neuf', label: '✨ Neuf / Récent', desc: 'Moins de 5 ans ou rénové entièrement' },
  { value: 'bon', label: '👍 Bon état', desc: 'Entretenu, quelques travaux mineurs' },
  { value: 'travaux', label: '🔨 Travaux', desc: 'Rénovation nécessaire' },
]

interface Result {
  estimate: number
  low: number
  high: number
  pricePerM2: number
  nbComparables: number
  confidence: 'high' | 'medium' | 'low'
  ville: string
  surface: number
  type: 'vente' | 'location'
}

function formatPrix(n: number, type: string) {
  if (type === 'location') return `${n.toLocaleString('fr-FR')} €/mois`
  if (n >= 1000000) return `${(n / 1000000).toFixed(2).replace(/\.?0+$/, '')} M€`
  return `${n.toLocaleString('fr-FR')} €`
}

const CONFIDENCE_LABEL = {
  high: { label: 'Fiabilité élevée', color: '#16A34A' },
  medium: { label: 'Fiabilité moyenne', color: '#D97706' },
  low: { label: 'Fiabilité faible (peu de données)', color: '#DC2626' },
}

export default function EstimationForm() {
  const [form, setForm] = useState({
    ville: '',
    surface: '',
    pieces: '3',
    categorie: 'appartement',
    type: 'vente' as 'vente' | 'location',
    etat: 'bon',
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState('')

  function update(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit() {
    if (!form.ville || !form.surface) { setError('Ville et surface sont requis'); return }
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('/api/estimer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ville: form.ville,
          surface: parseFloat(form.surface),
          pieces: parseInt(form.pieces),
          categorie: form.categorie,
          type: form.type,
          etat: form.etat,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  const confidence = result ? CONFIDENCE_LABEL[result.confidence] : null

  return (
    <div className="space-y-5">
      {/* Type */}
      <div className="flex gap-2">
        {(['vente', 'location'] as const).map(t => (
          <button key={t} onClick={() => update('type', t)}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all"
            style={form.type === t
              ? { background: '#0F172A', color: 'white', borderColor: '#0F172A' }
              : { background: 'white', color: 'rgba(15,23,42,0.6)', borderColor: 'rgba(15,23,42,0.15)' }
            }>
            {t === 'vente' ? '🏷️ Vente' : '🔑 Location'}
          </button>
        ))}
      </div>

      {/* Catégorie */}
      <div className="grid grid-cols-2 gap-2">
        {CATEGORIES.map(c => (
          <button key={c.value} onClick={() => update('categorie', c.value)}
            className="py-2.5 rounded-xl text-sm border transition-all"
            style={form.categorie === c.value
              ? { background: '#4F46E5', color: 'white', borderColor: '#4F46E5' }
              : { background: 'white', color: 'rgba(15,23,42,0.6)', borderColor: 'rgba(15,23,42,0.15)' }
            }>
            {c.label}
          </button>
        ))}
      </div>

      {/* Ville + Surface */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-[#0F172A]/50 mb-1.5">Ville *</label>
          <input type="text" value={form.ville} onChange={e => update('ville', e.target.value)}
            placeholder="Paris, Lyon…"
            className="w-full border border-[#0F172A]/15 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#4F46E5]" />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#0F172A]/50 mb-1.5">Surface (m²) *</label>
          <input type="number" value={form.surface} onChange={e => update('surface', e.target.value)}
            placeholder="75"
            className="w-full border border-[#0F172A]/15 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#4F46E5]" />
        </div>
      </div>

      {/* Pièces */}
      <div>
        <label className="block text-xs font-medium text-[#0F172A]/50 mb-1.5">Nombre de pièces</label>
        <div className="flex gap-2">
          {['1','2','3','4','5','6+'].map(p => (
            <button key={p} onClick={() => update('pieces', p === '6+' ? '6' : p)}
              className="flex-1 py-2 rounded-lg text-sm border transition-all"
              style={form.pieces === (p === '6+' ? '6' : p)
                ? { background: '#0F172A', color: 'white', borderColor: '#0F172A' }
                : { background: 'white', color: 'rgba(15,23,42,0.5)', borderColor: 'rgba(15,23,42,0.15)' }
              }>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* État */}
      <div>
        <label className="block text-xs font-medium text-[#0F172A]/50 mb-1.5">État du bien</label>
        <div className="space-y-2">
          {ETATS.map(e => (
            <label key={e.value} onClick={() => update('etat', e.value)}
              className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all"
              style={form.etat === e.value
                ? { borderColor: '#4F46E5', background: 'rgba(79,70,229,0.05)' }
                : { borderColor: 'rgba(15,23,42,0.15)', background: 'white' }
              }>
              <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                style={{ borderColor: form.etat === e.value ? '#4F46E5' : 'rgba(15,23,42,0.2)' }}>
                {form.etat === e.value && <div className="w-2 h-2 rounded-full" style={{ background: '#4F46E5' }} />}
              </div>
              <div>
                <div className="text-sm font-medium text-[#0F172A]">{e.label}</div>
                <div className="text-xs text-[#0F172A]/40">{e.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button onClick={handleSubmit} disabled={loading}
        className="w-full py-3.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
        style={{ background: loading ? '#94A3B8' : '#4F46E5' }}>
        {loading ? 'Calcul en cours…' : '🏡 Estimer mon bien'}
      </button>

      {/* Result */}
      {result && (
        <div className="border rounded-2xl overflow-hidden" style={{ borderColor: 'rgba(15,23,42,0.1)' }}>
          <div className="p-5" style={{ background: 'linear-gradient(135deg, #0F172A, #1E293B)' }}>
            <p className="text-xs text-white/40 mb-1 uppercase tracking-wider">Estimation pour {result.surface} m² à {result.ville}</p>
            <div className="text-4xl font-serif text-white mb-1">{formatPrix(result.estimate, result.type)}</div>
            <p className="text-sm text-white/50">
              Fourchette : {formatPrix(result.low, result.type)} — {formatPrix(result.high, result.type)}
            </p>
          </div>
          <div className="bg-white p-5 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-[#0F172A]/50">Prix au m²</span>
              <span className="font-medium text-[#0F172A]">{result.pricePerM2.toLocaleString('fr-FR')} €/m²</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#0F172A]/50">Basé sur</span>
              <span className="font-medium text-[#0F172A]">{result.nbComparables} bien{result.nbComparables > 1 ? 's' : ''} similaire{result.nbComparables > 1 ? 's' : ''}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#0F172A]/50">Fiabilité</span>
              <span className="font-medium" style={{ color: confidence!.color }}>{confidence!.label}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}



