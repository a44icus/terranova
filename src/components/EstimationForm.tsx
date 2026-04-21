'use client'
import { useState } from 'react'
import CityAutocomplete, { type CityResult } from '@/components/ui/CityAutocomplete'

const CATEGORIES = [
  { value: 'appartement', label: 'Appartement' },
  { value: 'maison',      label: 'Maison' },
  { value: 'bureau',      label: 'Bureau / Local' },
  { value: 'terrain',     label: 'Terrain' },
]

const ETATS = [
  { value: 'neuf',    label: '✨ Neuf / Récent', desc: 'Moins de 5 ans ou rénové entièrement' },
  { value: 'bon',     label: '👍 Bon état',      desc: 'Entretenu, quelques travaux mineurs' },
  { value: 'travaux', label: '🔨 Travaux',       desc: 'Rénovation nécessaire' },
]

const DPE_CLASSES = ['A','B','C','D','E','F','G']
const DPE_COLORS: Record<string, string> = {
  A: '#00A850', B: '#50B848', C: '#B4D334',
  D: '#FFF200', E: '#FEB800', F: '#F36E21', G: '#E0271A',
}

const OPTIONS_LIST = [
  { value: 'parking',   label: '🚗 Parking' },
  { value: 'cave',      label: '📦 Cave' },
  { value: 'balcon',    label: '🌿 Balcon' },
  { value: 'terrasse',  label: '☀️ Terrasse' },
  { value: 'jardin',    label: '🌳 Jardin' },
  { value: 'ascenseur', label: '🔼 Ascenseur' },
  { value: 'gardien',   label: '🔐 Gardien' },
  { value: 'piscine',   label: '🏊 Piscine' },
]

interface Result {
  estimate: number
  low: number
  high: number
  pricePerM2: number
  nbComparables: number
  confidence: 'high' | 'medium' | 'low'
  dataSource: string
  ville: string
  surface: number
  type: 'vente' | 'location'
  qualityDetails?: Record<string, number>
  marginPercent?: number
}

function formatPrix(n: number, type: string) {
  if (type === 'location') return `${n.toLocaleString('fr-FR')} €/mois`
  if (n >= 1000000) return `${(n / 1000000).toFixed(2).replace(/\.?0+$/, '')} M€`
  return `${n.toLocaleString('fr-FR')} €`
}

const CONFIDENCE_LABEL = {
  high:   { label: 'Fiabilité élevée',                  color: '#16A34A' },
  medium: { label: 'Fiabilité moyenne',                 color: '#D97706' },
  low:    { label: 'Fiabilité faible (peu de données)', color: '#DC2626' },
}

const QUALITY_LABELS: Record<string, string> = {
  etat: 'État du bien', pieces: 'Nb pièces', etage: 'Étage',
  anciennete: 'Ancienneté', dpe: 'DPE', options: 'Équipements',
  meuble: 'Meublé', terrain_attenant: 'Terrain',
}

function MultiplierBadge({ value }: { value: number }) {
  const pct = Math.round((value - 1) * 100)
  if (pct === 0) return null
  const positive = pct > 0
  return (
    <span className="text-xs font-medium px-1.5 py-0.5 rounded"
      style={{ background: positive ? '#DCFCE7' : '#FEE2E2', color: positive ? '#16A34A' : '#DC2626' }}>
      {positive ? '+' : ''}{pct}%
    </span>
  )
}

export default function EstimationForm() {
  const [form, setForm] = useState({
    ville:     '',
    codeInsee: '',
    surface:   '',
    pieces:    '3',
    categorie: 'appartement',
    type:      'vente' as 'vente' | 'location',
    etat:      'bon',
    // Champs avancés
    etage:              '',
    nb_etages:          '',
    annee_construction: '',
    dpe:                '',
    options:            [] as string[],
    meuble:             false,
    surface_terrain:    '',
  })
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState<Result | null>(null)
  const [error,   setError]   = useState('')

  function update(k: string, v: string | boolean) { setForm(f => ({ ...f, [k]: v })) }

  function toggleOption(opt: string) {
    setForm(f => ({
      ...f,
      options: f.options.includes(opt)
        ? f.options.filter(o => o !== opt)
        : [...f.options, opt],
    }))
  }

  function handleCitySelect(city: CityResult) {
    setForm(f => ({ ...f, ville: city.ville, codeInsee: city.codeInsee }))
  }

  // Permet la saisie libre si l'utilisateur ne sélectionne pas de suggestion
  function handleCityTextChange(text: string) {
    setForm(f => ({ ...f, ville: text, codeInsee: '' }))
  }

  async function handleSubmit() {
    if (!form.ville || !form.surface) { setError('Ville et surface sont requis'); return }
    setLoading(true); setError(''); setResult(null)
    try {
      const payload: Record<string, unknown> = {
        ville:     form.ville,
        codeInsee: form.codeInsee || undefined,
        surface:   parseFloat(form.surface),
        pieces:    parseInt(form.pieces),
        categorie: form.categorie,
        type:      form.type,
        etat:      form.etat,
      }
      if (form.etage !== '')              payload.etage              = parseInt(form.etage)
      if (form.nb_etages !== '')          payload.nb_etages          = parseInt(form.nb_etages)
      if (form.annee_construction !== '') payload.annee_construction = parseInt(form.annee_construction)
      if (form.dpe !== '')                payload.dpe                = form.dpe
      if (form.options.length > 0)        payload.options            = form.options
      if (form.meuble)                    payload.meuble             = true
      if (form.surface_terrain !== '')    payload.surface_terrain    = parseFloat(form.surface_terrain)

      const res  = await fetch('/api/estimer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
  const isAppt = form.categorie === 'appartement'
  const isMaison = form.categorie === 'maison'

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
          <CityAutocomplete value={form.ville} onChange={handleCitySelect} onTextChange={handleCityTextChange} placeholder="Paris, Lyon…" />
          {form.codeInsee && (
            <p className="mt-1 text-[11px] text-[#16A34A] flex items-center gap-1">
              <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
              {form.ville} · INSEE {form.codeInsee}
            </p>
          )}
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

      {/* ── Critères avancés ─────────────────────────────────────────── */}
      <button
        onClick={() => setShowAdvanced(v => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm transition-all"
        style={{ borderColor: 'rgba(79,70,229,0.3)', background: showAdvanced ? 'rgba(79,70,229,0.04)' : 'white', color: '#4F46E5' }}>
        <span className="font-medium">🎯 Affiner l'estimation</span>
        <span className="text-[#0F172A]/30 text-xs">{showAdvanced ? '▲ masquer' : '▼ étage, DPE, options…'}</span>
      </button>

      {showAdvanced && (
        <div className="space-y-4 p-4 rounded-xl border" style={{ borderColor: 'rgba(79,70,229,0.15)', background: 'rgba(79,70,229,0.02)' }}>

          {/* Étage (appartement) */}
          {isAppt && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#0F172A]/50 mb-1.5">Étage</label>
                <input type="number" min="0" max="50" value={form.etage} onChange={e => update('etage', e.target.value)}
                  placeholder="ex : 3"
                  className="w-full border border-[#0F172A]/15 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#4F46E5]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#0F172A]/50 mb-1.5">Nb étages immeuble</label>
                <input type="number" min="1" max="50" value={form.nb_etages} onChange={e => update('nb_etages', e.target.value)}
                  placeholder="ex : 6"
                  className="w-full border border-[#0F172A]/15 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#4F46E5]" />
              </div>
            </div>
          )}

          {/* Terrain attenant (maison) */}
          {isMaison && (
            <div>
              <label className="block text-xs font-medium text-[#0F172A]/50 mb-1.5">Surface terrain (m²)</label>
              <input type="number" min="0" value={form.surface_terrain} onChange={e => update('surface_terrain', e.target.value)}
                placeholder="ex : 500"
                className="w-full border border-[#0F172A]/15 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#4F46E5]" />
            </div>
          )}

          {/* Année de construction */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#0F172A]/50 mb-1.5">Année de construction</label>
              <input type="number" min="1800" max={new Date().getFullYear()} value={form.annee_construction}
                onChange={e => update('annee_construction', e.target.value)}
                placeholder="ex : 1985"
                className="w-full border border-[#0F172A]/15 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#4F46E5]" />
            </div>

            {/* DPE */}
            <div>
              <label className="block text-xs font-medium text-[#0F172A]/50 mb-1.5">Classe DPE</label>
              <div className="flex gap-1">
                {DPE_CLASSES.map(cls => (
                  <button key={cls} onClick={() => update('dpe', form.dpe === cls ? '' : cls)}
                    className="flex-1 py-2 rounded-lg text-xs font-bold border-2 transition-all"
                    style={form.dpe === cls
                      ? { background: DPE_COLORS[cls], color: ['A','B','C'].includes(cls) ? '#0F172A' : 'white', borderColor: DPE_COLORS[cls] }
                      : { background: 'white', color: '#0F172A', borderColor: 'rgba(15,23,42,0.15)' }
                    }>
                    {cls}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Options */}
          <div>
            <label className="block text-xs font-medium text-[#0F172A]/50 mb-1.5">Équipements & atouts</label>
            <div className="grid grid-cols-4 gap-2">
              {OPTIONS_LIST.map(opt => (
                <button key={opt.value} onClick={() => toggleOption(opt.value)}
                  className="py-2 px-1 rounded-xl text-xs border text-center transition-all"
                  style={form.options.includes(opt.value)
                    ? { background: '#4F46E5', color: 'white', borderColor: '#4F46E5' }
                    : { background: 'white', color: 'rgba(15,23,42,0.6)', borderColor: 'rgba(15,23,42,0.15)' }
                  }>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Meublé (location) */}
          {form.type === 'location' && (
            <label className="flex items-center gap-3 cursor-pointer">
              <div onClick={() => update('meuble', !form.meuble)}
                className="w-10 h-6 rounded-full transition-all flex items-center px-1"
                style={{ background: form.meuble ? '#4F46E5' : 'rgba(15,23,42,0.15)' }}>
                <div className="w-4 h-4 rounded-full bg-white shadow transition-transform"
                  style={{ transform: form.meuble ? 'translateX(16px)' : 'translateX(0)' }} />
              </div>
              <span className="text-sm text-[#0F172A]/70">Bien meublé</span>
            </label>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button onClick={handleSubmit} disabled={loading}
        className="w-full py-3.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
        style={{ background: loading ? '#94A3B8' : '#4F46E5' }}>
        {loading ? 'Calcul en cours…' : '🏡 Estimer mon bien'}
      </button>

      {result && (
        <div className="border rounded-2xl overflow-hidden" style={{ borderColor: 'rgba(15,23,42,0.1)' }}>
          <div className="p-5" style={{ background: 'linear-gradient(135deg, #0F172A, #1E293B)' }}>
            <p className="text-xs text-white/40 mb-1 uppercase tracking-wider">
              Estimation pour {result.surface} m² à {result.ville}
            </p>
            <div className="text-4xl font-serif text-white mb-1">{formatPrix(result.estimate, result.type)}</div>
            <p className="text-sm text-white/50">
              Fourchette : {formatPrix(result.low, result.type)} — {formatPrix(result.high, result.type)}
              {result.marginPercent !== undefined && (
                <span className="ml-1 text-white/30 text-xs">(±{result.marginPercent}%)</span>
              )}
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

            {/* Détail des ajustements appliqués */}
            {result.qualityDetails && Object.keys(result.qualityDetails).length > 0 && (
              <div className="pt-2 border-t border-[#0F172A]/06">
                <p className="text-xs text-[#0F172A]/40 mb-2">Ajustements appliqués</p>
                <div className="space-y-1">
                  {Object.entries(result.qualityDetails).map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between">
                      <span className="text-xs text-[#0F172A]/50">{QUALITY_LABELS[k] ?? k}</span>
                      <MultiplierBadge value={v} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
