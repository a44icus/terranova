'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { BienType, BienCategorie } from '@/lib/types'

const CATEGORIES: { value: BienCategorie; label: string }[] = [
  { value: 'appartement', label: 'Appartement' },
  { value: 'maison',      label: 'Maison'       },
  { value: 'bureau',      label: 'Bureau/Local' },
  { value: 'terrain',     label: 'Terrain'      },
  { value: 'parking',     label: 'Parking'      },
  { value: 'local',       label: 'Local comm.'  },
]

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
}

interface Props {
  userId: string
  initial: Recherche | null
}

const DEFAULT: Recherche = {
  actif: true,
  type: '',
  categories: [],
  ville: '',
  code_postal: '',
  rayon_km: '',
  prix_min: '',
  prix_max: '',
  surface_min: '',
  surface_max: '',
  pieces_min: '',
  description: '',
  budget_visible: true,
}

export default function ChercheurForm({ userId, initial }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [form, setForm] = useState<Recherche>(
    initial ? {
      ...initial,
      type: initial.type ?? '',
      rayon_km:   String(initial.rayon_km ?? ''),
      prix_min:   String(initial.prix_min ?? ''),
      prix_max:   String(initial.prix_max ?? ''),
      surface_min: String(initial.surface_min ?? ''),
      surface_max: String(initial.surface_max ?? ''),
      pieces_min:  String(initial.pieces_min ?? ''),
    } : DEFAULT
  )
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

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

  async function handleSave() {
    setSaving(true)
    setMsg(null)
    const payload = {
      user_id:        userId,
      actif:          form.actif,
      type:           form.type || null,
      categories:     form.categories,
      ville:          form.ville || null,
      code_postal:    form.code_postal || null,
      rayon_km:       form.rayon_km ? parseInt(form.rayon_km) : null,
      prix_min:       form.prix_min ? parseInt(form.prix_min) : null,
      prix_max:       form.prix_max ? parseInt(form.prix_max) : null,
      surface_min:    form.surface_min ? parseInt(form.surface_min) : null,
      surface_max:    form.surface_max ? parseInt(form.surface_max) : null,
      pieces_min:     form.pieces_min ? parseInt(form.pieces_min) : null,
      description:    form.description || null,
      budget_visible: form.budget_visible,
    }

    const { error } = initial?.id
      ? await supabase.from('recherches').update(payload).eq('id', initial.id)
      : await supabase.from('recherches').upsert(payload, { onConflict: 'user_id' })

    setSaving(false)
    if (error) {
      setMsg({ type: 'error', text: error.message })
    } else {
      setMsg({ type: 'success', text: 'Profil chercheur sauvegardé.' })
      router.refresh()
    }
  }

  const inputCls = "w-full border border-navy/15 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors bg-white"
  const labelCls = "block text-xs font-medium text-navy/55 mb-1.5"

  return (
    <div className="space-y-5">
      {msg && (
        <div className={`text-sm rounded-xl px-4 py-3 ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {msg.text}
        </div>
      )}

      {/* Activer / désactiver */}
      <label className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-navy/08 cursor-pointer hover:bg-navy/02 transition-colors">
        <input type="checkbox" checked={form.actif} onChange={e => update('actif', e.target.checked)} className="accent-primary w-4 h-4" />
        <div>
          <p className="text-sm font-medium text-navy">Profil actif</p>
          <p className="text-xs text-navy/45">Votre recherche est visible publiquement par les vendeurs.</p>
        </div>
      </label>

      <div className="bg-white rounded-2xl p-5 border border-navy/08 space-y-4">
        <h3 className="text-xs font-medium text-navy/50 uppercase tracking-wider">Critères de recherche</h3>

        {/* Type vente/location */}
        <div>
          <label className={labelCls}>Type de transaction</label>
          <div className="flex gap-3">
            {(['vente', 'location', ''] as const).map(t => (
              <button key={t} type="button" onClick={() => update('type', t)}
                className={`flex-1 py-2 rounded-lg text-sm border transition-all ${form.type === t ? 'bg-navy text-white border-navy' : 'bg-white text-navy/60 border-navy/15 hover:border-navy/30'}`}>
                {t === 'vente' ? 'Vente' : t === 'location' ? 'Location' : 'Les deux'}
              </button>
            ))}
          </div>
        </div>

        {/* Catégories */}
        <div>
          <label className={labelCls}>Type(s) de bien</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <button key={c.value} type="button" onClick={() => toggleCat(c.value)}
                className={`px-3 py-1.5 rounded-full text-xs border transition-all ${form.categories.includes(c.value) ? 'bg-navy text-white border-navy' : 'bg-white text-navy/60 border-navy/15 hover:border-navy/30'}`}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Localisation */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className={labelCls}>Ville</label>
            <input type="text" value={form.ville} onChange={e => update('ville', e.target.value)} placeholder="Paris" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Rayon (km)</label>
            <input type="number" value={form.rayon_km} onChange={e => update('rayon_km', e.target.value)} placeholder="20" min="0" max="200" className={inputCls} />
          </div>
        </div>

        {/* Budget */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className={labelCls + ' mb-0'}>Budget (€)</label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={form.budget_visible} onChange={e => update('budget_visible', e.target.checked)} className="accent-primary w-3.5 h-3.5" />
              <span className="text-[11px] text-navy/45">Visible publiquement</span>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="number" value={form.prix_min} onChange={e => update('prix_min', e.target.value)} placeholder="Min" className={inputCls} />
            <input type="number" value={form.prix_max} onChange={e => update('prix_max', e.target.value)} placeholder="Max" className={inputCls} />
          </div>
        </div>

        {/* Surface + pièces */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>Surface min (m²)</label>
            <input type="number" value={form.surface_min} onChange={e => update('surface_min', e.target.value)} placeholder="40" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Surface max (m²)</label>
            <input type="number" value={form.surface_max} onChange={e => update('surface_max', e.target.value)} placeholder="100" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Pièces min</label>
            <input type="number" value={form.pieces_min} onChange={e => update('pieces_min', e.target.value)} placeholder="2" className={inputCls} />
          </div>
        </div>

        {/* Description libre */}
        <div>
          <label className={labelCls}>Description de votre projet <span className="text-navy/30 font-normal">(optionnel)</span></label>
          <textarea
            value={form.description}
            onChange={e => update('description', e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Ex : Cherche maison avec jardin, proche écoles, idéalement sud-exposition…"
            className={inputCls + ' resize-none'}
          />
          <p className="text-[11px] text-navy/35 mt-1">{form.description.length}/500</p>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-primary text-white rounded-xl py-3 text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-40"
      >
        {saving ? 'Sauvegarde…' : 'Sauvegarder mon profil chercheur'}
      </button>

      {form.actif && (
        <p className="text-center text-xs text-navy/40">
          Votre profil sera visible sur{' '}
          <a href="/chercheurs" target="_blank" className="text-primary hover:underline">/chercheurs</a>
        </p>
      )}
    </div>
  )
}
