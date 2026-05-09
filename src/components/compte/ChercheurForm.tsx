'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { BienType, BienCategorie } from '@/lib/types'
import { POI_GROUPES } from '@/lib/poi'

const CATEGORIES: { value: BienCategorie; label: string; emoji: string }[] = [
  { value: 'appartement',           label: 'Appartement',       emoji: '🏛️' },
  { value: 'maison',                label: 'Maison',            emoji: '🌿' },
  { value: 'studio',                label: 'Studio / T1',       emoji: '🛋️' },
  { value: 'villa',                 label: 'Villa',             emoji: '🏰' },
  { value: 'chalet',                label: 'Chalet',            emoji: '🏔️' },
  { value: 'loft',                  label: 'Loft',              emoji: '🎨' },
  { value: 'colocation',            label: 'Colocation',        emoji: '👥' },
  { value: 'bureau',                label: 'Bureau',            emoji: '🏢' },
  { value: 'local',                 label: 'Local comm.',       emoji: '🏪' },
  { value: 'restaurant',            label: 'Restaurant',        emoji: '🍽️' },
  { value: 'entrepot',              label: 'Entrepôt',          emoji: '🏭' },
  { value: 'hotel',                 label: 'Hôtel',             emoji: '🏨' },
  { value: 'fonds_commerce',        label: 'Fonds comm.',       emoji: '💼' },
  { value: 'murs_commerciaux',      label: 'Murs comm.',        emoji: '🧱' },
  { value: 'terrain',               label: 'Terrain',           emoji: '🌱' },
  { value: 'terrain_agricole',      label: 'Terrain agri.',     emoji: '🌾' },
  { value: 'terrain_constructible', label: 'T. constructible',  emoji: '🏗️' },
  { value: 'parking',               label: 'Parking',           emoji: '🅿️' },
]

const TYPE_OPTIONS = [
  { value: 'vente' as const,    label: 'Vente',    emoji: '🏷️' },
  { value: 'location' as const, label: 'Location', emoji: '🔑' },
  { value: '' as const,         label: 'Les deux', emoji: '◈'  },
]

const RAYON_OPTIONS = [
  { val: '0.5', label: '500 m' },
  { val: '1',   label: '1 km'  },
  { val: '2',   label: '2 km'  },
  { val: '5',   label: '5 km'  },
]

function scoreQualLabel(v: number) {
  if (v === 0)  return { text: 'Pas de filtre', color: '#94a3b8' }
  if (v <= 3)   return { text: 'Modéré',        color: '#f59e0b' }
  if (v <= 6)   return { text: 'Bon',           color: '#65a30d' }
  if (v <= 8)   return { text: 'Très bon',      color: '#16a34a' }
  return               { text: 'Excellent',     color: '#0891b2' }
}

interface Recherche {
  id?: string
  actif: boolean
  type: BienType | ''
  categories: BienCategorie[]
  ville: string
  code_postal: string
  rayon_km: string
  prix_min: string
  prix_max: string
  surface_min: string
  surface_max: string
  pieces_min: string
  description: string
  budget_visible: boolean
  poi_priorites: string[]
  rayon_poi_km: string
  score_quartier_min: string
}

interface Props {
  userId: string
  initial: Recherche | null
}

const DEFAULT: Recherche = {
  actif: true, type: '', categories: [],
  ville: '', code_postal: '', rayon_km: '',
  prix_min: '', prix_max: '',
  surface_min: '', surface_max: '', pieces_min: '',
  description: '', budget_visible: true,
  poi_priorites: [], rayon_poi_km: '1', score_quartier_min: '0',
}

// ── Sous-composants UI ────────────────────────────────────────────────────────

function Section({ emoji, title, subtitle, children }: {
  emoji: string; title: string; subtitle?: string; children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl border border-navy/08 overflow-hidden">
      <div className="px-5 pt-5 pb-4 border-b border-navy/05 flex items-start gap-3">
        <span className="text-xl leading-none mt-0.5 flex-shrink-0">{emoji}</span>
        <div>
          <h3 className="text-sm font-semibold text-navy">{title}</h3>
          {subtitle && <p className="text-xs text-navy/40 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none ${checked ? 'bg-primary' : 'bg-navy/20'}`}>
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  )
}

function NumInput({ value, onChange, placeholder, prefix, suffix }: {
  value: string; onChange: (v: string) => void
  placeholder?: string; prefix?: string; suffix?: string
}) {
  return (
    <div className="relative">
      {prefix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-navy/35 text-sm pointer-events-none">{prefix}</span>
      )}
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full border border-navy/15 rounded-xl py-2.5 text-sm focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10 transition-all bg-white ${prefix ? 'pl-8' : 'pl-4'} ${suffix ? 'pr-10' : 'pr-4'}`}
      />
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-navy/30 text-xs pointer-events-none">{suffix}</span>
      )}
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────────────────────

export default function ChercheurForm({ userId, initial }: Props) {
  const supabase = createClient()
  const router   = useRouter()
  const [form, setForm] = useState<Recherche>(
    initial ? {
      ...initial,
      type:               initial.type ?? '',
      code_postal:        initial.code_postal ?? '',
      rayon_km:           String(initial.rayon_km ?? ''),
      prix_min:           String(initial.prix_min ?? ''),
      prix_max:           String(initial.prix_max ?? ''),
      surface_min:        String(initial.surface_min ?? ''),
      surface_max:        String(initial.surface_max ?? ''),
      pieces_min:         String(initial.pieces_min ?? ''),
      description:        initial.description ?? '',
      poi_priorites:      (initial as any).poi_priorites ?? [],
      rayon_poi_km:       String((initial as any).rayon_poi_km ?? '1'),
      score_quartier_min: String((initial as any).score_quartier_min ?? '0'),
    } : DEFAULT
  )
  const [saving, setSaving] = useState(false)
  const [msg, setMsg]       = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  function update<K extends keyof Recherche>(field: K, value: Recherche[K]) {
    setForm(f => ({ ...f, [field]: value }))
  }
  function toggleCat(cat: BienCategorie) {
    setForm(f => ({
      ...f,
      categories: f.categories.includes(cat)
        ? f.categories.filter(c => c !== cat)
        : [...f.categories, cat],
    }))
  }
  function togglePoi(key: string) {
    setForm(f => ({
      ...f,
      poi_priorites: f.poi_priorites.includes(key)
        ? f.poi_priorites.filter(p => p !== key)
        : [...f.poi_priorites, key],
    }))
  }

  async function handleSave() {
    setSaving(true); setMsg(null)
    const payload = {
      user_id:            userId,
      actif:              form.actif,
      type:               form.type || null,
      categories:         form.categories,
      ville:              form.ville || null,
      code_postal:        form.code_postal || null,
      rayon_km:           form.rayon_km ? parseInt(form.rayon_km) : null,
      prix_min:           form.prix_min ? parseInt(form.prix_min) : null,
      prix_max:           form.prix_max ? parseInt(form.prix_max) : null,
      surface_min:        form.surface_min ? parseInt(form.surface_min) : null,
      surface_max:        form.surface_max ? parseInt(form.surface_max) : null,
      pieces_min:         form.pieces_min ? parseInt(form.pieces_min) : null,
      description:        form.description || null,
      budget_visible:     form.budget_visible,
      poi_priorites:      form.poi_priorites,
      rayon_poi_km:       form.rayon_poi_km ? parseInt(form.rayon_poi_km) : 1,
      score_quartier_min: form.score_quartier_min ? parseInt(form.score_quartier_min) : 0,
    }
    const { error } = initial?.id
      ? await supabase.from('recherches').update(payload).eq('id', initial.id)
      : await supabase.from('recherches').upsert(payload, { onConflict: 'user_id' })
    setSaving(false)
    if (error) {
      setMsg({ type: 'error', text: error.message })
    } else {
      setMsg({ type: 'success', text: 'Profil chercheur sauvegardé ✓' })
      router.refresh()
    }
  }

  const scoreNum   = parseInt(form.score_quartier_min) || 0
  const scoreQual  = scoreQualLabel(scoreNum)
  const hasPoi     = form.poi_priorites.length > 0
  const piecesNum  = form.pieces_min === '' ? 0 : parseInt(form.pieces_min)

  return (
    <div className="space-y-4">

      {/* ── Feedback ── */}
      {msg && (
        <div className={`text-sm rounded-xl px-4 py-3 flex items-center gap-2.5 ${
          msg.type === 'success'
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          <span>{msg.type === 'success' ? '✓' : '✕'}</span>
          {msg.text}
        </div>
      )}

      {/* ── Statut du profil ── */}
      <button
        type="button"
        onClick={() => update('actif', !form.actif)}
        className={`w-full text-left rounded-2xl p-4 border-2 transition-all ${
          form.actif
            ? 'bg-primary/04 border-primary/25 hover:border-primary/40'
            : 'bg-navy/02 border-navy/10 hover:border-navy/20'
        }`}>
        <div className="flex items-center gap-4">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
            form.actif ? 'bg-primary/10' : 'bg-navy/06'
          }`}>
            🔍
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${form.actif ? 'text-primary' : 'text-navy/50'}`}>
              Profil chercheur {form.actif ? 'actif' : 'désactivé'}
            </p>
            <p className="text-xs text-navy/40 mt-0.5">
              {form.actif
                ? 'Visible sur /chercheurs — les vendeurs peuvent vous contacter'
                : 'Votre recherche est masquée des vendeurs'}
            </p>
          </div>
          <Toggle checked={form.actif} onChange={v => update('actif', v)} />
        </div>
      </button>

      {/* ── 1. Type + catégories ── */}
      <Section emoji="🏠" title="Vous cherchez" subtitle="Quel type de bien et transaction ?">

        {/* Type de transaction */}
        <div className="flex gap-2">
          {TYPE_OPTIONS.map(t => (
            <button key={t.value} type="button" onClick={() => update('type', t.value)}
              className={`flex-1 flex flex-col items-center gap-1.5 py-3.5 rounded-xl border transition-all ${
                form.type === t.value
                  ? 'bg-navy text-white border-navy shadow-sm'
                  : 'bg-navy/02 text-navy/55 border-navy/12 hover:border-navy/25 hover:text-navy'
              }`}>
              <span className="text-xl leading-none">{t.emoji}</span>
              <span className="text-xs font-semibold">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Catégories */}
        <div>
          <p className="text-xs font-medium text-navy/45 mb-2.5">
            Type(s) de bien
            {form.categories.length > 0 && (
              <span className="ml-1.5 text-primary font-semibold">{form.categories.length} sélectionné{form.categories.length > 1 ? 's' : ''}</span>
            )}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map(c => (
              <button key={c.value} type="button" onClick={() => toggleCat(c.value)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs border transition-all ${
                  form.categories.includes(c.value)
                    ? 'bg-navy text-white border-navy'
                    : 'bg-white text-navy/55 border-navy/15 hover:border-navy/30 hover:text-navy'
                }`}>
                <span>{c.emoji}</span>
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* ── 2. Localisation ── */}
      <Section emoji="📍" title="Où ?" subtitle="Ville, zone géographique et rayon de recherche">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs font-medium text-navy/45 mb-1.5">Ville</label>
            <input
              type="text"
              value={form.ville}
              onChange={e => update('ville', e.target.value)}
              placeholder="Ex : Lyon, Paris…"
              className="w-full border border-navy/15 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10 transition-all bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-navy/45 mb-1.5">Code postal</label>
            <input
              type="text"
              value={form.code_postal ?? ''}
              onChange={e => update('code_postal', e.target.value)}
              placeholder="69000"
              maxLength={10}
              className="w-full border border-navy/15 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10 transition-all bg-white"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-navy/45 mb-1.5">
            Rayon autour de la ville
            {form.rayon_km && <span className="ml-1.5 text-primary font-semibold">{form.rayon_km} km</span>}
          </label>
          <div className="flex gap-2 flex-wrap">
            {['5', '10', '20', '30', '50'].map(r => (
              <button key={r} type="button"
                onClick={() => update('rayon_km', form.rayon_km === r ? '' : r)}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-all ${
                  form.rayon_km === r
                    ? 'bg-navy text-white border-navy'
                    : 'bg-white text-navy/55 border-navy/15 hover:border-navy/30'
                }`}>
                {r} km
              </button>
            ))}
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                value={!['5','10','20','30','50'].includes(form.rayon_km) ? form.rayon_km : ''}
                onChange={e => update('rayon_km', e.target.value)}
                placeholder="Autre"
                min="1" max="200"
                className="w-20 border border-navy/15 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10 transition-all bg-white"
              />
              {!['5','10','20','30','50',''].includes(form.rayon_km) && (
                <span className="text-xs text-navy/40">km</span>
              )}
            </div>
          </div>
        </div>
      </Section>

      {/* ── 3. Budget ── */}
      <Section emoji="💰" title="Votre budget" subtitle="Fourchette de prix souhaitée">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-navy/45 mb-1.5">Prix minimum</label>
            <NumInput value={form.prix_min} onChange={v => update('prix_min', v)} placeholder="0" prefix="€" />
          </div>
          <div>
            <label className="block text-xs font-medium text-navy/45 mb-1.5">Prix maximum</label>
            <NumInput value={form.prix_max} onChange={v => update('prix_max', v)} placeholder="Sans limite" prefix="€" />
          </div>
        </div>
        <div className="flex items-center justify-between p-3 bg-navy/02 rounded-xl border border-navy/08">
          <div>
            <p className="text-xs font-medium text-navy/70">Budget visible publiquement</p>
            <p className="text-[11px] text-navy/35 mt-0.5">Les vendeurs pourront voir votre budget</p>
          </div>
          <Toggle checked={form.budget_visible} onChange={v => update('budget_visible', v)} />
        </div>
      </Section>

      {/* ── 4. Caractéristiques ── */}
      <Section emoji="📐" title="Le bien" subtitle="Surface et nombre de pièces souhaités">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-navy/45 mb-1.5">Surface minimum</label>
            <NumInput value={form.surface_min} onChange={v => update('surface_min', v)} placeholder="—" suffix="m²" />
          </div>
          <div>
            <label className="block text-xs font-medium text-navy/45 mb-1.5">Surface maximum</label>
            <NumInput value={form.surface_max} onChange={v => update('surface_max', v)} placeholder="—" suffix="m²" />
          </div>
        </div>

        {/* Pièces min — stepper */}
        <div>
          <label className="block text-xs font-medium text-navy/45 mb-2.5">
            Nombre de pièces minimum
            {piecesNum > 0 && <span className="ml-1.5 text-primary font-semibold">{piecesNum}+</span>}
          </label>
          <div className="flex gap-2">
            {[0, 1, 2, 3, 4, 5, 6].map(n => (
              <button key={n} type="button"
                onClick={() => update('pieces_min', n === 0 ? '' : String(n))}
                className={`flex-1 h-10 rounded-xl text-sm font-semibold border transition-all ${
                  (form.pieces_min === '' && n === 0) || form.pieces_min === String(n)
                    ? 'bg-navy text-white border-navy shadow-sm'
                    : 'bg-white text-navy/50 border-navy/15 hover:border-navy/30 hover:text-navy'
                }`}>
                {n === 0 ? '—' : n < 6 ? n : '6+'}
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* ── 5. Environnement ── */}
      <Section emoji="🗺️" title="Environnement souhaité" subtitle="POI et qualité de quartier (indicatif)">
        <div className="space-y-4">
          {POI_GROUPES.map(groupe => (
            <div key={groupe.categorie.key}>
              <p className="text-[11px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5"
                style={{ color: groupe.categorie.color }}>
                <span className="text-sm">{groupe.categorie.emoji}</span>
                {groupe.categorie.label}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {groupe.pois.map(poi => {
                  const selected = form.poi_priorites.includes(poi.key)
                  return (
                    <button key={poi.key} type="button" onClick={() => togglePoi(poi.key)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border transition-all ${
                        selected ? 'text-white border-transparent' : 'bg-white text-navy/55 border-navy/15 hover:border-navy/30'
                      }`}
                      style={selected ? { background: groupe.categorie.color } : {}}>
                      <span>{poi.emoji}</span>
                      {poi.label}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Options POI si sélection */}
        {hasPoi && (
          <div className="pt-4 border-t border-navy/08 space-y-4">

            {/* Distance */}
            <div>
              <p className="text-xs font-medium text-navy/45 mb-2">Distance souhaitée</p>
              <div className="flex gap-2 flex-wrap">
                {RAYON_OPTIONS.map(opt => (
                  <button key={opt.val} type="button"
                    onClick={() => update('rayon_poi_km', opt.val)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-all ${
                      form.rayon_poi_km === opt.val
                        ? 'bg-navy text-white border-navy'
                        : 'bg-white text-navy/55 border-navy/15 hover:border-navy/30'
                    }`}>
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-navy/30 mt-1.5">
                Indicatif — le filtrage se base sur le score global du quartier.
              </p>
            </div>

            {/* Score min */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-navy/45">Score de quartier minimum</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-bold" style={{ color: scoreQual.color }}>{scoreNum}</span>
                  <span className="text-[10px] text-navy/30">/10</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full ml-0.5"
                    style={{ color: scoreQual.color, background: scoreQual.color + '18' }}>
                    {scoreQual.text}
                  </span>
                </div>
              </div>
              <input
                type="range" min="0" max="10" step="1"
                value={form.score_quartier_min}
                onChange={e => update('score_quartier_min', e.target.value)}
                className="w-full h-2 rounded-full appearance-none cursor-pointer accent-primary"
                style={{
                  background: `linear-gradient(to right, ${scoreQual.color} 0%, ${scoreQual.color} ${scoreNum * 10}%, rgba(15,23,42,0.10) ${scoreNum * 10}%, rgba(15,23,42,0.10) 100%)`,
                }}
              />
              <div className="flex justify-between text-[10px] text-navy/25 mt-1">
                <span>Aucun filtre</span>
                <span>Excellent</span>
              </div>
            </div>
          </div>
        )}

        {!hasPoi && (
          <p className="text-xs text-navy/35 italic text-center py-2">
            Sélectionnez des lieux pour affiner votre recherche
          </p>
        )}
      </Section>

      {/* ── 6. Description ── */}
      <Section emoji="📝" title="Votre projet" subtitle="Décrivez librement votre projet (optionnel)">
        <div>
          <textarea
            value={form.description}
            onChange={e => update('description', e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Ex : Cherche maison avec jardin, proche des écoles, idéalement sud-exposition…"
            className="w-full border border-navy/15 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10 transition-all bg-white resize-none"
          />
          <div className="flex justify-end mt-1">
            <span className={`text-[11px] ${(form.description ?? '').length > 450 ? 'text-amber-500' : 'text-navy/30'}`}>
              {(form.description ?? '').length}/500
            </span>
          </div>
        </div>
      </Section>

      {/* ── Bouton save ── */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-primary text-white rounded-2xl py-3.5 text-sm font-semibold hover:bg-primary-dark transition-all disabled:opacity-40 shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0">
        {saving ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Sauvegarde…
          </span>
        ) : (
          'Sauvegarder mon profil chercheur'
        )}
      </button>

      {form.actif && (
        <p className="text-center text-xs text-navy/35 -mt-1">
          Votre profil sera visible sur{' '}
          <a href="/chercheurs" target="_blank" className="text-primary hover:underline font-medium">
            /chercheurs
          </a>
        </p>
      )}
    </div>
  )
}
