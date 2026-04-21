'use client'

import { useState, useTransition } from 'react'
import type { MapAd, AdFormat } from '@/lib/mapAds'
import { createAd, updateAd, deleteAd, toggleAdActif } from './actions'

const FORMAT_LABELS: Record<AdFormat, { label: string; desc: string; emoji: string }> = {
  pin:    { label: 'Pin',    desc: 'Pastille compacte comme les biens', emoji: '📍' },
  banner: { label: 'Banner', desc: 'Bulle avec titre + description',    emoji: '🏷️' },
  card:   { label: 'Carte',  desc: 'Carte avec image et bouton CTA',    emoji: '🃏' },
}

const COULEURS_PRESET = [
  { hex: '#F59E0B', name: 'Ambre'   },
  { hex: '#7C3AED', name: 'Violet'  },
  { hex: '#0891B2', name: 'Cyan'    },
  { hex: '#DC2626', name: 'Rouge'   },
  { hex: '#16A34A', name: 'Vert'    },
  { hex: '#EA580C', name: 'Orange'  },
  { hex: '#0F172A', name: 'Marine'  },
  { hex: '#DB2777', name: 'Rose'    },
]

const EMPTY_FORM: Omit<MapAd, 'id'> = {
  titre: '',
  description: '',
  image_url: '',
  lien_url: '',
  emoji: '',
  format: 'pin',
  lat: 48.8566,
  lng: 2.3522,
  couleur: '#F59E0B',
  actif: true,
  date_debut: '',
  date_fin: '',
}

function isAdCurrentlyActive(ad: MapAd) {
  if (!ad.actif) return false
  const now = Date.now()
  if (ad.date_debut && new Date(ad.date_debut).getTime() > now) return false
  if (ad.date_fin   && new Date(ad.date_fin).getTime()   < now) return false
  return true
}

export default function MapAdsClient({ ads: initialAds }: { ads: MapAd[] }) {
  const [ads, setAds] = useState<MapAd[]>(initialAds)
  const [showForm, setShowForm] = useState(false)
  const [editingAd, setEditingAd] = useState<MapAd | null>(null)
  const [form, setForm] = useState<Omit<MapAd, 'id'>>(EMPTY_FORM)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function openCreate() {
    setEditingAd(null)
    setForm(EMPTY_FORM)
    setError('')
    setShowForm(true)
  }

  function openEdit(ad: MapAd) {
    setEditingAd(ad)
    setForm({
      titre:       ad.titre,
      description: ad.description ?? '',
      image_url:   ad.image_url ?? '',
      lien_url:    ad.lien_url ?? '',
      emoji:       ad.emoji ?? '',
      format:      ad.format,
      lat:         ad.lat,
      lng:         ad.lng,
      couleur:     ad.couleur ?? '#F59E0B',
      actif:       ad.actif,
      date_debut:  ad.date_debut ?? '',
      date_fin:    ad.date_fin ?? '',
    })
    setError('')
    setShowForm(true)
  }

  function handleSubmit() {
    if (!form.titre.trim()) { setError('Le titre est obligatoire'); return }
    if (!form.lat || !form.lng) { setError('Les coordonnées sont obligatoires'); return }

    const payload = {
      ...form,
      description: form.description || undefined,
      image_url:   form.image_url   || undefined,
      lien_url:    form.lien_url    || undefined,
      emoji:       form.emoji       || undefined,
      date_debut:  form.date_debut  || undefined,
      date_fin:    form.date_fin    || undefined,
    }

    startTransition(async () => {
      try {
        if (editingAd) {
          await updateAd(editingAd.id, payload)
          setAds(prev => prev.map(a => a.id === editingAd.id ? { ...a, ...payload } : a))
        } else {
          await createAd(payload)
          // Recharge depuis le serveur via revalidatePath — simple refresh
          window.location.reload()
        }
        setShowForm(false)
      } catch (e: any) {
        setError(e.message)
      }
    })
  }

  function handleDelete(id: string) {
    if (!confirm('Supprimer cette publicité ?')) return
    startTransition(async () => {
      try {
        await deleteAd(id)
        setAds(prev => prev.filter(a => a.id !== id))
      } catch (e: any) {
        alert(e.message)
      }
    })
  }

  function handleToggle(ad: MapAd) {
    startTransition(async () => {
      try {
        await toggleAdActif(ad.id, !ad.actif)
        setAds(prev => prev.map(a => a.id === ad.id ? { ...a, actif: !a.actif } : a))
      } catch (e: any) {
        alert(e.message)
      }
    })
  }

  return (
    <div>
      {/* ── Barre d'action ── */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-[#0F172A]/50">
          {ads.length} publicité{ads.length !== 1 ? 's' : ''} configurée{ads.length !== 1 ? 's' : ''}
        </p>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-[#4F46E5] text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-[#4338CA] transition-colors shadow-sm"
        >
          <span className="text-base">＋</span>
          Nouvelle publicité
        </button>
      </div>

      {/* ── Liste des pubs ── */}
      {ads.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#0F172A]/08 p-16 text-center">
          <div className="text-4xl mb-4">📍</div>
          <p className="text-[#0F172A]/40 text-sm">Aucune publicité configurée</p>
          <button onClick={openCreate}
            className="mt-4 text-[#4F46E5] text-sm font-medium hover:underline">
            Créer la première
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {ads.map(ad => {
            const active = isAdCurrentlyActive(ad)
            const fmt = FORMAT_LABELS[ad.format]
            return (
              <div key={ad.id}
                className="bg-white rounded-2xl border border-[#0F172A]/08 p-5 flex items-center gap-5 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Couleur / emoji */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: ad.couleur ?? '#F59E0B' }}
                >
                  {ad.emoji || fmt.emoji}
                </div>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-[#0F172A] text-sm">{ad.titre}</span>
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full border border-[#0F172A]/15 text-[#0F172A]/50 uppercase tracking-wide">
                      {fmt.label}
                    </span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                      active
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-slate-50 text-slate-400 border border-slate-200'
                    }`}>
                      {active ? '● Actif' : '○ Inactif'}
                    </span>
                  </div>
                  {ad.description && (
                    <p className="text-xs text-[#0F172A]/50 truncate">{ad.description}</p>
                  )}
                  <p className="text-xs text-[#0F172A]/35 mt-0.5">
                    {ad.lat.toFixed(4)}, {ad.lng.toFixed(4)}
                    {ad.lien_url && <span className="ml-2">🔗 {ad.lien_url}</span>}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleToggle(ad)}
                    disabled={isPending}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                      ad.actif
                        ? 'border-slate-200 text-slate-500 hover:bg-slate-50'
                        : 'border-green-200 text-green-600 hover:bg-green-50'
                    }`}
                  >
                    {ad.actif ? 'Désactiver' : 'Activer'}
                  </button>
                  <button
                    onClick={() => openEdit(ad)}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg border border-[#4F46E5]/30 text-[#4F46E5] hover:bg-[#4F46E5]/05 transition-colors"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(ad.id)}
                    disabled={isPending}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Formulaire (modal) ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setShowForm(false) }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#0F172A]/08">
              <h2 className="font-serif text-xl text-[#0F172A]">
                {editingAd ? 'Modifier la publicité' : 'Nouvelle publicité'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-[#0F172A]/40 hover:text-[#0F172A] text-xl leading-none">✕</button>
            </div>

            <div className="px-6 py-5 space-y-5">

              {/* Format */}
              <div>
                <label className="block text-xs font-semibold text-[#0F172A]/50 uppercase tracking-wider mb-2">Format</label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.entries(FORMAT_LABELS) as [AdFormat, typeof FORMAT_LABELS[AdFormat]][]).map(([key, val]) => (
                    <button
                      key={key}
                      onClick={() => setForm(f => ({ ...f, format: key }))}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        form.format === key
                          ? 'border-[#4F46E5] bg-[#4F46E5]/05'
                          : 'border-[#0F172A]/10 hover:border-[#0F172A]/25'
                      }`}
                    >
                      <div className="text-xl mb-1">{val.emoji}</div>
                      <div className="text-xs font-semibold text-[#0F172A]">{val.label}</div>
                      <div className="text-[10px] text-[#0F172A]/45 mt-0.5 leading-tight">{val.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Titre + Emoji */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-[#0F172A]/50 uppercase tracking-wider mb-1.5">Titre *</label>
                  <input
                    type="text"
                    value={form.titre}
                    onChange={e => setForm(f => ({ ...f, titre: e.target.value }))}
                    placeholder="Ex : Agence Dupont"
                    className="w-full border border-[#0F172A]/15 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#4F46E5] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A]/50 uppercase tracking-wider mb-1.5">Emoji</label>
                  <input
                    type="text"
                    value={form.emoji}
                    onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))}
                    placeholder="🏡"
                    className="w-full border border-[#0F172A]/15 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#4F46E5] transition-colors text-center text-lg"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-[#0F172A]/50 uppercase tracking-wider mb-1.5">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Ex : Estimation gratuite en 48h"
                  className="w-full border border-[#0F172A]/15 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#4F46E5] transition-colors"
                />
              </div>

              {/* Coordonnées */}
              <div>
                <label className="block text-xs font-semibold text-[#0F172A]/50 uppercase tracking-wider mb-1.5">Coordonnées GPS *</label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#0F172A]/35 font-medium">Lat</span>
                    <input
                      type="number" step="0.0001"
                      value={form.lat}
                      onChange={e => setForm(f => ({ ...f, lat: parseFloat(e.target.value) }))}
                      className="w-full border border-[#0F172A]/15 rounded-xl pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#4F46E5] transition-colors"
                    />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#0F172A]/35 font-medium">Lng</span>
                    <input
                      type="number" step="0.0001"
                      value={form.lng}
                      onChange={e => setForm(f => ({ ...f, lng: parseFloat(e.target.value) }))}
                      className="w-full border border-[#0F172A]/15 rounded-xl pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#4F46E5] transition-colors"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-[#0F172A]/35 mt-1.5">
                  💡 Trouvez les coordonnées sur <a href="https://www.google.com/maps" target="_blank" rel="noopener" className="text-[#4F46E5] hover:underline">Google Maps</a> → clic droit → "Plus d'informations sur cet endroit"
                </p>
              </div>

              {/* Couleur */}
              <div>
                <label className="block text-xs font-semibold text-[#0F172A]/50 uppercase tracking-wider mb-2">Couleur</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {COULEURS_PRESET.map(c => (
                    <button
                      key={c.hex}
                      onClick={() => setForm(f => ({ ...f, couleur: c.hex }))}
                      title={c.name}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${form.couleur === c.hex ? 'border-[#0F172A] scale-110' : 'border-transparent hover:scale-105'}`}
                      style={{ background: c.hex }}
                    />
                  ))}
                  <input
                    type="color"
                    value={form.couleur}
                    onChange={e => setForm(f => ({ ...f, couleur: e.target.value }))}
                    className="w-8 h-8 rounded-full border-2 border-[#0F172A]/15 cursor-pointer overflow-hidden"
                    title="Couleur personnalisée"
                  />
                </div>
              </div>

              {/* Lien + Image URL */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A]/50 uppercase tracking-wider mb-1.5">URL de destination</label>
                  <input
                    type="url"
                    value={form.lien_url}
                    onChange={e => setForm(f => ({ ...f, lien_url: e.target.value }))}
                    placeholder="https://example.com"
                    className="w-full border border-[#0F172A]/15 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#4F46E5] transition-colors"
                  />
                </div>
                {form.format === 'card' && (
                  <div>
                    <label className="block text-xs font-semibold text-[#0F172A]/50 uppercase tracking-wider mb-1.5">URL de l'image</label>
                    <input
                      type="url"
                      value={form.image_url}
                      onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                      placeholder="https://example.com/image.jpg"
                      className="w-full border border-[#0F172A]/15 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#4F46E5] transition-colors"
                    />
                  </div>
                )}
              </div>

              {/* Planification */}
              <div>
                <label className="block text-xs font-semibold text-[#0F172A]/50 uppercase tracking-wider mb-2">Planification (optionnel)</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-[#0F172A]/40 mb-1">Début</label>
                    <input
                      type="datetime-local"
                      value={form.date_debut}
                      onChange={e => setForm(f => ({ ...f, date_debut: e.target.value }))}
                      className="w-full border border-[#0F172A]/15 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#4F46E5] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#0F172A]/40 mb-1">Fin</label>
                    <input
                      type="datetime-local"
                      value={form.date_fin}
                      onChange={e => setForm(f => ({ ...f, date_fin: e.target.value }))}
                      className="w-full border border-[#0F172A]/15 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#4F46E5] transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Actif */}
              <div className="flex items-center gap-3 p-3 bg-[#F8FAFC] rounded-xl">
                <button
                  onClick={() => setForm(f => ({ ...f, actif: !f.actif }))}
                  className={`w-11 h-6 rounded-full transition-colors flex-shrink-0 relative ${form.actif ? 'bg-[#4F46E5]' : 'bg-[#0F172A]/20'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.actif ? 'left-[22px]' : 'left-0.5'}`} />
                </button>
                <div>
                  <p className="text-sm font-medium text-[#0F172A]">
                    {form.actif ? 'Publicité active' : 'Publicité inactive'}
                  </p>
                  <p className="text-xs text-[#0F172A]/40">
                    {form.actif ? 'Visible sur la carte dès zoom 14' : 'Masquée sur la carte'}
                  </p>
                </div>
              </div>

              {/* Erreur */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[#0F172A]/08 flex gap-3 justify-end">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-[#0F172A]/60 hover:bg-[#0F172A]/05 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={isPending}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-[#4F46E5] text-white hover:bg-[#4338CA] disabled:opacity-60 transition-colors shadow-sm"
              >
                {isPending ? 'Enregistrement…' : (editingAd ? 'Enregistrer' : 'Créer la publicité')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
