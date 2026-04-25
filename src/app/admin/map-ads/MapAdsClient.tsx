'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { isAdActive } from '@/lib/mapAds'
import type { MapAd, AdFormat } from '@/lib/mapAds'
import type { AdWithStats } from './page'
import { createAd, updateAd, deleteAd, toggleAdActif } from './actions'
import StatsChart from './StatsChart'
import { createClient } from '@/lib/supabase/client'

interface GeoSuggestion { display_name: string; lat: string; lon: string }

function LocationSearch({ onSelect }: { onSelect: (lat: number, lng: number, label: string) => void }) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<GeoSuggestion[]>([])
  const [open, setOpen] = useState(false)
  const timer = useRef<NodeJS.Timeout | undefined>(undefined)

  useEffect(() => {
    clearTimeout(timer.current)
    if (query.length < 3) { setSuggestions([]); return }
    timer.current = setTimeout(async () => {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=fr`,
        { headers: { 'Accept-Language': 'fr' } }
      )
      setSuggestions(await res.json())
      setOpen(true)
    }, 350)
  }, [query])

  return (
    <div className="relative">
      <div className="relative flex items-center">
        <svg className="absolute left-3 w-3.5 h-3.5 text-[#0F172A]/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Rechercher une adresse, ville…"
          className="w-full border border-[#0F172A]/15 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#4F46E5]"
        />
      </div>
      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-[#0F172A]/10 rounded-xl shadow-lg overflow-hidden">
          {suggestions.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                onMouseDown={e => {
                  e.preventDefault()
                  onSelect(parseFloat(s.lat), parseFloat(s.lon), s.display_name)
                  setQuery(s.display_name.split(',')[0])
                  setOpen(false)
                }}
                className="w-full text-left px-3 py-2.5 text-xs text-[#0F172A] hover:bg-[#4F46E5]/05 border-b border-[#0F172A]/06 last:border-0 truncate"
              >
                {s.display_name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

interface MiniMapPickerProps {
  lat: number | null
  lng: number | null
  onChange: (lat: number, lng: number) => void
  flyToSignal?: { lat: number; lng: number; ts: number } | null
}

function MiniMapPicker({ lat, lng, onChange, flyToSignal }: MiniMapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    let map: any, marker: any

    import('maplibre-gl').then(async ({ default: mgl }) => {
      const { MAP_STYLES } = await import('@/lib/mapStyles')
      const hasPos = lat != null && lng != null

      map = new mgl.Map({
        container: containerRef.current!,
        style: MAP_STYLES.street as any,
        center: hasPos ? [lng, lat] : [2.3522, 46.8],
        zoom: hasPos ? 13 : 5,
        attributionControl: false,
      })
      mapRef.current = map

      const el = document.createElement('div')
      el.style.cssText = `width:24px;height:30px;cursor:grab;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 28 34'%3E%3Cpath d='M14 2C8.477 2 4 6.477 4 12c0 7.5 10 20 10 20s10-12.5 10-20c0-5.523-4.477-10-10-10z' fill='%234F46E5'/%3E%3Ccircle cx='14' cy='12' r='4' fill='white'/%3E%3C/svg%3E") center/contain no-repeat;`

      marker = new mgl.Marker({ element: el, draggable: true, anchor: 'bottom' })
      markerRef.current = marker

      if (hasPos) marker.setLngLat([lng, lat]).addTo(map)

      // Clic sur la carte → déplace le marker
      map.on('click', (e: any) => {
        const { lat: ly, lng: lx } = e.lngLat
        marker.setLngLat([lx, ly]).addTo(map)
        onChange(ly, lx)
      })

      // Fin de drag → met à jour les coords
      marker.on('dragend', () => {
        const pos = marker.getLngLat()
        onChange(pos.lat, pos.lng)
      })
    })

    return () => { mapRef.current?.remove(); mapRef.current = null; markerRef.current = null }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Fly to when address is selected from search
  useEffect(() => {
    if (!flyToSignal || !mapRef.current || !markerRef.current) return
    mapRef.current.flyTo({ center: [flyToSignal.lng, flyToSignal.lat], zoom: 13, duration: 800 })
    markerRef.current.setLngLat([flyToSignal.lng, flyToSignal.lat]).addTo(mapRef.current)
  }, [flyToSignal])

  return (
    <div
      ref={containerRef}
      style={{ height: 200, borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(15,23,42,0.12)' }}
    />
  )
}

const FORMAT_LABELS: Record<AdFormat, { label: string; desc: string; emoji: string }> = {
  pin:    { label: 'Pin',    desc: 'Pastille compacte comme les biens', emoji: '📍' },
  banner: { label: 'Banner', desc: 'Bulle avec titre + description',    emoji: '🏷️' },
  card:   { label: 'Carte',  desc: 'Carte avec image et bouton CTA',    emoji: '🃏' },
}

const COULEURS_PRESET = [
  { hex: '#F59E0B' }, { hex: '#7C3AED' }, { hex: '#0891B2' }, { hex: '#DC2626' },
  { hex: '#16A34A' }, { hex: '#EA580C' }, { hex: '#0F172A' }, { hex: '#DB2777' },
]

const EMPTY_FORM: Omit<MapAd, 'id'> = {
  titre: '', description: '', image_url: '', lien_url: '', emoji: '',
  format: 'pin', lat: null, lng: null, couleur: '#F59E0B',
  actif: true, date_debut: '', date_fin: '',
  visibility_radius_km: null,
  bbox_north: null, bbox_south: null, bbox_east: null, bbox_west: null,
  impressions_max_par_jour: null,
}

// ── Aperçu temps réel ────────────────────────────────────────────────────────
function AdPreview({ form }: { form: Omit<MapAd, 'id'> }) {
  const color = form.couleur ?? '#F59E0B'
  return (
    <div>
      <div className="text-xs font-semibold text-[#0F172A]/50 uppercase tracking-wider mb-2">Aperçu</div>
      <div className="bg-slate-100 rounded-xl p-4 flex items-end justify-center min-h-[110px]">
        {form.format === 'pin' && (
          <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ background: color, color: 'white', padding: '5px 11px 5px 9px', borderRadius: 20,
              fontFamily: 'sans-serif', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
              boxShadow: '0 2px 12px rgba(0,0,0,0.2)', border: '2px solid white',
              display: 'flex', alignItems: 'center', gap: 6 }}>
              {form.emoji && <span style={{ fontSize: 14 }}>{form.emoji}</span>}
              <span>{form.titre || 'Titre de la pub'}</span>
              <span style={{ fontSize: 9, background: 'rgba(255,255,255,0.25)', borderRadius: 4, padding: '1px 4px' }}>PUB</span>
            </div>
            <div style={{ width: 0, height: 0, borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderTop: `9px solid white`, marginTop: -1 }} />
          </div>
        )}
        {form.format === 'banner' && (
          <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ background: color, color: 'white', borderRadius: 10, padding: '8px 14px',
              fontFamily: 'sans-serif', boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
              border: '2px solid rgba(255,255,255,0.8)', maxWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {form.emoji && <span style={{ fontSize: 18 }}>{form.emoji}</span>}
                <span style={{ fontSize: 13, fontWeight: 700 }}>{form.titre || 'Titre de la pub'}</span>
                <span style={{ marginLeft: 'auto', fontSize: 9, background: 'rgba(0,0,0,0.2)', borderRadius: 4, padding: '1px 5px' }}>PUB</span>
              </div>
              {form.description && <div style={{ fontSize: 11, opacity: 0.85, lineHeight: 1.4, marginTop: 3 }}>{form.description}</div>}
            </div>
            <div style={{ width: 0, height: 0, borderLeft: '9px solid transparent', borderRight: '9px solid transparent', borderTop: '10px solid rgba(255,255,255,0.8)', marginTop: -1 }} />
          </div>
        )}
        {form.format === 'card' && (
          <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden',
              boxShadow: '0 6px 24px rgba(0,0,0,0.15)', border: `2px solid ${color}`, width: 160, fontFamily: 'sans-serif' }}>
              <div style={{ height: 60, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, position: 'relative', overflow: 'hidden' }}>
                {form.image_url
                  ? <img src={form.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : (form.emoji || '📢')
                }
                <span style={{ position: 'absolute', top: 4, right: 6, fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>PUB</span>
              </div>
              <div style={{ padding: '7px 9px 9px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', marginBottom: 2 }}>{form.titre || 'Titre'}</div>
                {form.description && <div style={{ fontSize: 10, color: 'rgba(15,23,42,0.5)', lineHeight: 1.4 }}>{form.description}</div>}
                {form.lien_url && <div style={{ marginTop: 5, textAlign: 'center', background: color, color: 'white', borderRadius: 5, padding: '3px 6px', fontSize: 10, fontWeight: 600 }}>En savoir plus →</div>}
              </div>
            </div>
            <div style={{ width: 0, height: 0, borderLeft: '9px solid transparent', borderRight: '9px solid transparent', borderTop: `10px solid ${color}`, marginTop: -1 }} />
          </div>
        )}
      </div>
    </div>
  )
}

function StatBadge({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <div className="text-lg font-bold text-[#0F172A]">{value}</div>
      <div className="text-[10px] text-[#0F172A]/40 font-medium uppercase tracking-wide">{label}</div>
    </div>
  )
}

// ── Composant principal ──────────────────────────────────────────────────────
export default function MapAdsClient({ ads: initialAds }: { ads: AdWithStats[] }) {
  const [ads, setAds] = useState<AdWithStats[]>(initialAds)
  const [showForm, setShowForm] = useState(false)
  const [editingAd, setEditingAd] = useState<AdWithStats | null>(null)
  const [form, setForm] = useState<Omit<MapAd, 'id'>>(EMPTY_FORM)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const [expandedStats, setExpandedStats] = useState<string | null>(null)
  const [targetMode, setTargetMode] = useState<'none' | 'radius' | 'bbox'>('none')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [flyToSignal, setFlyToSignal] = useState<{ lat: number; lng: number; ts: number } | null>(null)

  const totalImpressions = ads.reduce((s, a) => s + (a.impressions ?? 0), 0)
  const totalClicks      = ads.reduce((s, a) => s + (a.clicks ?? 0), 0)
  const globalCtr        = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : '0'

  function openCreate() {
    setEditingAd(null)
    setForm(EMPTY_FORM)
    setTargetMode('none')
    setError('')
    setShowForm(true)
  }

  function openEdit(ad: AdWithStats) {
    setEditingAd(ad)
    const hasBbox = ad.bbox_north != null
    const hasRadius = ad.visibility_radius_km != null
    setTargetMode(hasBbox ? 'bbox' : hasRadius ? 'radius' : 'none')
    setForm({
      titre: ad.titre, description: ad.description ?? '', image_url: ad.image_url ?? '',
      lien_url: ad.lien_url ?? '', emoji: ad.emoji ?? '', format: ad.format,
      lat: ad.lat ?? null, lng: ad.lng ?? null, couleur: ad.couleur ?? '#F59E0B',
      actif: ad.actif, date_debut: ad.date_debut ?? '', date_fin: ad.date_fin ?? '',
      visibility_radius_km: ad.visibility_radius_km ?? null,
      bbox_north: ad.bbox_north ?? null, bbox_south: ad.bbox_south ?? null,
      bbox_east: ad.bbox_east ?? null, bbox_west: ad.bbox_west ?? null,
      impressions_max_par_jour: ad.impressions_max_par_jour ?? null,
    })
    setError('')
    setShowForm(true)
  }

  function buildPayload() {
    // Efface les champs de ciblage non actifs
    const bbox = targetMode === 'bbox'
      ? { bbox_north: form.bbox_north, bbox_south: form.bbox_south, bbox_east: form.bbox_east, bbox_west: form.bbox_west, visibility_radius_km: null }
      : { bbox_north: null, bbox_south: null, bbox_east: null, bbox_west: null,
          visibility_radius_km: targetMode === 'radius' ? form.visibility_radius_km : null }

    // Forcer lat/lng en number pur pour éviter tout souci de sérialisation
    const lat = form.lat != null ? Number(form.lat) : null
    const lng = form.lng != null ? Number(form.lng) : null

    return {
      ...form,
      lat: lat != null && !isNaN(lat) ? lat : null,
      lng: lng != null && !isNaN(lng) ? lng : null,
      ...bbox,
      description:             form.description || undefined,
      image_url:               form.image_url   || undefined,
      lien_url:                form.lien_url    || undefined,
      emoji:                   form.emoji       || undefined,
      date_debut:              form.date_debut  || undefined,
      date_fin:                form.date_fin    || undefined,
      impressions_max_par_jour: form.impressions_max_par_jour || null,
    }
  }

  function handleSubmit() {
    if (!form.titre.trim()) { setError('Le titre est obligatoire'); return }
    if (form.lat == null || form.lng == null || isNaN(form.lat) || isNaN(form.lng)) {
      setError('Les coordonnées GPS sont obligatoires'); return
    }
    const payload = buildPayload()
    startTransition(async () => {
      try {
        if (editingAd) {
          await updateAd(editingAd.id, payload)
          setAds(prev => prev.map(a => a.id === editingAd.id ? { ...a, ...payload } : a))
        } else {
          await createAd(payload)
          window.location.reload()
        }
        setShowForm(false)
      } catch (e: any) { setError(e.message) }
    })
  }

  function handleDelete(id: string) {
    if (!confirm('Supprimer cette publicité ?')) return
    startTransition(async () => {
      try { await deleteAd(id); setAds(prev => prev.filter(a => a.id !== id)) }
      catch (e: any) { alert(e.message) }
    })
  }

  function handleToggle(ad: AdWithStats) {
    startTransition(async () => {
      try {
        await toggleAdActif(ad.id, !ad.actif)
        setAds(prev => prev.map(a => a.id === ad.id ? { ...a, actif: !a.actif } : a))
      } catch (e: any) { alert(e.message) }
    })
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const path = `map-ads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadError } = await supabase.storage.from('photos-biens').upload(path, file, { upsert: false })
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from('photos-biens').getPublicUrl(path)
      setForm(f => ({ ...f, image_url: publicUrl }))
    } catch (e: any) {
      setError(`Erreur upload : ${e.message}`)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div>
      {/* ── KPIs globaux ── */}
      {ads.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Impressions', value: totalImpressions.toLocaleString('fr-FR') },
            { label: 'Clics',       value: totalClicks.toLocaleString('fr-FR') },
            { label: 'CTR moyen',   value: `${globalCtr} %` },
          ].map(k => (
            <div key={k.label} className="bg-white rounded-2xl border border-[#0F172A]/08 p-5 text-center shadow-sm">
              <div className="font-serif text-3xl text-[#0F172A] mb-1">{k.value}</div>
              <div className="text-xs font-medium text-[#0F172A]/40 uppercase tracking-wider">{k.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Barre d'action ── */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-[#0F172A]/50">
          {ads.length} publicité{ads.length !== 1 ? 's' : ''} configurée{ads.length !== 1 ? 's' : ''}
        </p>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-[#4F46E5] text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-[#4338CA] transition-colors shadow-sm">
          <span className="text-base">＋</span> Nouvelle publicité
        </button>
      </div>

      {/* ── Liste ── */}
      {ads.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#0F172A]/08 p-16 text-center">
          <div className="text-4xl mb-4">📍</div>
          <p className="text-[#0F172A]/40 text-sm">Aucune publicité configurée</p>
          <button onClick={openCreate} className="mt-4 text-[#4F46E5] text-sm font-medium hover:underline">
            Créer la première
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {ads.map(ad => {
            const active = isAdActive(ad)
            const fmt    = FORMAT_LABELS[ad.format]
            const statsOpen = expandedStats === ad.id
            return (
              <div key={ad.id} className="bg-white rounded-2xl border border-[#0F172A]/08 shadow-sm overflow-hidden">
                <div className="p-5 flex items-center gap-5">
                  {/* Couleur / emoji / photo */}
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden"
                    style={{ background: ad.couleur ?? '#F59E0B' }}>
                    {ad.image_url
                      ? <img src={ad.image_url} alt="" className="w-full h-full object-cover" />
                      : (ad.emoji || fmt.emoji)
                    }
                  </div>

                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="font-semibold text-[#0F172A] text-sm">{ad.titre}</span>
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full border border-[#0F172A]/15 text-[#0F172A]/50 uppercase tracking-wide">
                        {fmt.label}
                      </span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                        active ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-slate-50 text-slate-400 border border-slate-200'
                      }`}>{active ? '● Actif' : '○ Inactif'}</span>
                      {ad.visibility_radius_km && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                          📡 {ad.visibility_radius_km} km
                        </span>
                      )}
                      {ad.bbox_north != null && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-600 border border-violet-200">
                          🗺 Zone ciblée
                        </span>
                      )}
                      {ad.impressions_max_par_jour != null && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                          🔒 {ad.impressions_max_par_jour}/j
                        </span>
                      )}
                    </div>
                    {ad.description && <p className="text-xs text-[#0F172A]/50 truncate">{ad.description}</p>}
                    <p className="text-xs text-[#0F172A]/35 mt-0.5">
                      {ad.lat != null ? ad.lat.toFixed(4) : '—'}, {ad.lng != null ? ad.lng.toFixed(4) : '—'}
                    </p>
                  </div>

                  {/* Stats inline */}
                  <div className="hidden lg:flex items-center gap-6 px-4 border-x border-[#0F172A]/08">
                    <StatBadge label="Impressions" value={(ad.impressions ?? 0).toLocaleString('fr-FR')} />
                    <StatBadge label="Clics"       value={(ad.clicks ?? 0).toLocaleString('fr-FR')} />
                    <StatBadge label="CTR"         value={`${ad.ctr ?? 0} %`} />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setExpandedStats(statsOpen ? null : ad.id)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                        statsOpen
                          ? 'border-[#4F46E5] bg-[#4F46E5]/05 text-[#4F46E5]'
                          : 'border-[#0F172A]/15 text-[#0F172A]/50 hover:bg-[#0F172A]/05'
                      }`}>
                      📈 Stats
                    </button>
                    <button onClick={() => handleToggle(ad)} disabled={isPending}
                      className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                        ad.actif ? 'border-slate-200 text-slate-500 hover:bg-slate-50' : 'border-green-200 text-green-600 hover:bg-green-50'
                      }`}>{ad.actif ? 'Désactiver' : 'Activer'}</button>
                    <button onClick={() => openEdit(ad)}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg border border-[#4F46E5]/30 text-[#4F46E5] hover:bg-[#4F46E5]/05 transition-colors">
                      Modifier
                    </button>
                    <button onClick={() => handleDelete(ad.id)} disabled={isPending}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
                      Supprimer
                    </button>
                  </div>
                </div>

                {/* ── Graphique temporel dépliable ── */}
                {statsOpen && (
                  <div className="px-5 pb-5">
                    <StatsChart adId={ad.id} adTitre={ad.titre} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Modal formulaire ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowForm(false) }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#0F172A]/08">
              <h2 className="font-serif text-xl text-[#0F172A]">
                {editingAd ? 'Modifier la publicité' : 'Nouvelle publicité'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-[#0F172A]/40 hover:text-[#0F172A] text-xl">✕</button>
            </div>

            <div className="px-6 py-5">
              <div className="grid grid-cols-2 gap-6">
                {/* Colonne gauche */}
                <div className="space-y-5">
                  {/* Format */}
                  <div>
                    <label className="block text-xs font-semibold text-[#0F172A]/50 uppercase tracking-wider mb-2">Format</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(Object.entries(FORMAT_LABELS) as [AdFormat, typeof FORMAT_LABELS[AdFormat]][]).map(([key, val]) => (
                        <button key={key} onClick={() => setForm(f => ({ ...f, format: key }))}
                          className={`p-3 rounded-xl border-2 text-left transition-all ${
                            form.format === key ? 'border-[#4F46E5] bg-[#4F46E5]/05' : 'border-[#0F172A]/10 hover:border-[#0F172A]/25'
                          }`}>
                          <div className="text-xl mb-1">{val.emoji}</div>
                          <div className="text-xs font-semibold text-[#0F172A]">{val.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Titre + Emoji */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-[#0F172A]/50 uppercase tracking-wider mb-1.5">Titre *</label>
                      <input type="text" value={form.titre}
                        onChange={e => setForm(f => ({ ...f, titre: e.target.value }))}
                        placeholder="Ex : Agence Dupont"
                        className="w-full border border-[#0F172A]/15 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#4F46E5]" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#0F172A]/50 uppercase tracking-wider mb-1.5">Emoji</label>
                      <input type="text" value={form.emoji}
                        onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))}
                        placeholder="🏡"
                        className="w-full border border-[#0F172A]/15 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#4F46E5] text-center text-lg" />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-semibold text-[#0F172A]/50 uppercase tracking-wider mb-1.5">Description</label>
                    <input type="text" value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Ex : Estimation gratuite en 48h"
                      className="w-full border border-[#0F172A]/15 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#4F46E5]" />
                  </div>

                  {/* Position via mini carte */}
                  <div>
                    <label className="block text-xs font-semibold text-[#0F172A]/50 uppercase tracking-wider mb-1.5">Position sur la carte *</label>
                    <LocationSearch onSelect={(lat, lng) => {
                      setForm(f => ({ ...f, lat, lng }))
                      setFlyToSignal({ lat, lng, ts: Date.now() })
                    }} />
                    <div className="mt-2">
                      <MiniMapPicker
                        lat={form.lat}
                        lng={form.lng}
                        onChange={(lat, lng) => setForm(f => ({ ...f, lat, lng }))}
                        flyToSignal={flyToSignal}
                      />
                    </div>
                    {form.lat != null && form.lng != null && (
                      <p className="text-[10px] text-[#0F172A]/35 mt-1.5 text-center">
                        {form.lat.toFixed(5)}, {form.lng.toFixed(5)}
                      </p>
                    )}
                  </div>

                  {/* Couleur */}
                  <div>
                    <label className="block text-xs font-semibold text-[#0F172A]/50 uppercase tracking-wider mb-2">Couleur</label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {COULEURS_PRESET.map(c => (
                        <button key={c.hex} onClick={() => setForm(f => ({ ...f, couleur: c.hex }))}
                          title={c.hex}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${form.couleur === c.hex ? 'border-[#0F172A] scale-110' : 'border-transparent hover:scale-105'}`}
                          style={{ background: c.hex }} />
                      ))}
                      <input type="color" value={form.couleur}
                        onChange={e => setForm(f => ({ ...f, couleur: e.target.value }))}
                        className="w-8 h-8 rounded-full border-2 border-[#0F172A]/15 cursor-pointer overflow-hidden" />
                    </div>
                  </div>
                </div>

                {/* Colonne droite */}
                <div className="space-y-5">
                  <AdPreview form={form} />

                  {/* Lien + Image */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#0F172A]/50 uppercase tracking-wider mb-1.5">URL de destination</label>
                      <input type="url" value={form.lien_url}
                        onChange={e => setForm(f => ({ ...f, lien_url: e.target.value }))}
                        placeholder="https://example.com"
                        className="w-full border border-[#0F172A]/15 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#4F46E5]" />
                    </div>

                    {/* Photo upload */}
                    <div>
                      <label className="block text-xs font-semibold text-[#0F172A]/50 uppercase tracking-wider mb-1.5">Photo</label>
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                      {form.image_url ? (
                        <div className="relative rounded-xl overflow-hidden border border-[#0F172A]/10">
                          <img src={form.image_url} alt="" className="w-full h-28 object-cover" />
                          <button
                            type="button"
                            onClick={() => setForm(f => ({ ...f, image_url: '' }))}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 text-white text-xs flex items-center justify-center hover:bg-black/70 transition-colors"
                          >✕</button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className="w-full border-2 border-dashed border-[#0F172A]/15 rounded-xl py-4 text-center text-sm text-[#0F172A]/40 hover:border-[#4F46E5]/40 hover:text-[#4F46E5] transition-colors disabled:opacity-50"
                        >
                          {uploading ? 'Envoi en cours…' : '+ Ajouter une photo'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Ciblage géographique */}
                  <div>
                    <label className="block text-xs font-semibold text-[#0F172A]/50 uppercase tracking-wider mb-2">Ciblage géographique</label>
                    <div className="flex gap-2 mb-3">
                      {([['none', 'Aucun'], ['radius', '📡 Rayon'], ['bbox', '🗺 Zone carte']] as const).map(([mode, label]) => (
                        <button key={mode} onClick={() => setTargetMode(mode)}
                          className={`flex-1 text-xs font-medium py-1.5 rounded-lg border transition-colors ${
                            targetMode === mode ? 'border-[#4F46E5] bg-[#4F46E5]/08 text-[#4F46E5]' : 'border-[#0F172A]/15 text-[#0F172A]/50 hover:bg-[#0F172A]/05'
                          }`}>
                          {label}
                        </button>
                      ))}
                    </div>

                    {targetMode === 'radius' && (
                      <div className="flex items-center gap-2">
                        <input type="number" min="1" max="500" step="1"
                          value={form.visibility_radius_km ?? ''}
                          onChange={e => setForm(f => ({ ...f, visibility_radius_km: e.target.value ? parseFloat(e.target.value) : null }))}
                          placeholder="Ex : 10"
                          className="flex-1 border border-[#0F172A]/15 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#4F46E5]" />
                        <span className="text-sm text-[#0F172A]/40">km du point</span>
                      </div>
                    )}

                    {targetMode === 'bbox' && (
                      <div className="space-y-2">
                        <p className="text-[11px] text-[#0F172A]/40">La pub s'affiche uniquement quand la carte est dans cette zone.</p>
                        <div className="grid grid-cols-2 gap-2">
                          {([['bbox_north', 'Nord'], ['bbox_south', 'Sud'], ['bbox_east', 'Est'], ['bbox_west', 'Ouest']] as const).map(([key, label]) => (
                            <div key={key} className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#0F172A]/35">{label}</span>
                              <input type="number" step="0.001"
                                value={form[key] ?? ''}
                                onChange={e => setForm(f => ({ ...f, [key]: e.target.value ? parseFloat(e.target.value) : null }))}
                                placeholder="—"
                                className="w-full border border-[#0F172A]/15 rounded-lg pl-10 pr-2 py-2 text-sm focus:outline-none focus:border-[#4F46E5]" />
                            </div>
                          ))}
                        </div>
                        <p className="text-[11px] text-[#0F172A]/35">💡 Copie les coordonnées depuis Google Maps (coin NE et coin SW de la zone)</p>
                      </div>
                    )}

                    {targetMode === 'none' && (
                      <p className="text-[11px] text-[#0F172A]/35">La pub sera visible partout sur la carte.</p>
                    )}
                  </div>

                  {/* Capping d'impressions */}
                  <div>
                    <label className="block text-xs font-semibold text-[#0F172A]/50 uppercase tracking-wider mb-1.5">
                      Capping d'impressions
                    </label>
                    <div className="flex items-center gap-2">
                      <input type="number" min="1" step="1"
                        value={form.impressions_max_par_jour ?? ''}
                        onChange={e => setForm(f => ({ ...f, impressions_max_par_jour: e.target.value ? parseInt(e.target.value) : null }))}
                        placeholder="Illimité"
                        className="flex-1 border border-[#0F172A]/15 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#4F46E5]" />
                      <span className="text-sm text-[#0F172A]/40">/ jour</span>
                    </div>
                    <p className="text-[11px] text-[#0F172A]/35 mt-1">Laisser vide = aucune limite d'affichages</p>
                  </div>

                  {/* Planification */}
                  <div>
                    <label className="block text-xs font-semibold text-[#0F172A]/50 uppercase tracking-wider mb-2">Planification</label>
                    <div className="space-y-2">
                      {[{ label: 'Début', key: 'date_debut' }, { label: 'Fin', key: 'date_fin' }].map(f => (
                        <div key={f.key}>
                          <label className="block text-[11px] text-[#0F172A]/40 mb-1">{f.label}</label>
                          <input type="datetime-local"
                            value={form[f.key as 'date_debut' | 'date_fin']}
                            onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                            className="w-full border border-[#0F172A]/15 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#4F46E5]" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actif toggle */}
                  <div className="flex items-center gap-3 p-3 bg-[#F8FAFC] rounded-xl">
                    <button onClick={() => setForm(f => ({ ...f, actif: !f.actif }))}
                      className={`w-11 h-6 rounded-full transition-colors flex-shrink-0 relative ${form.actif ? 'bg-[#4F46E5]' : 'bg-[#0F172A]/20'}`}>
                      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.actif ? 'left-[22px]' : 'left-0.5'}`} />
                    </button>
                    <p className="text-sm font-medium text-[#0F172A]">{form.actif ? 'Active' : 'Inactive'}</p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-[#0F172A]/08 flex gap-3 justify-end">
              <button onClick={() => setShowForm(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-[#0F172A]/60 hover:bg-[#0F172A]/05 transition-colors">
                Annuler
              </button>
              <button onClick={handleSubmit} disabled={isPending}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-[#4F46E5] text-white hover:bg-[#4338CA] disabled:opacity-60 transition-colors shadow-sm">
                {isPending ? 'Enregistrement…' : (editingAd ? 'Enregistrer' : 'Créer la publicité')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
