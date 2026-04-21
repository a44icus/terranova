'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile, BienType, BienCategorie, DpeClasse } from '@/lib/types'
import { LIMITES_PLAN } from '@/lib/types'
import LocationPicker from '@/components/LocationPicker'

interface SiteSettings {
  moderation: "auto" | "manuelle"
  expirationJours: number
  categoriesActives: string[]
  typesActifs: string[]
  photosMaxUpload: number
  notifNouvelleAnnonce: boolean
  notifAdminEmail: string
  emailExpediteurNom: string
  emailExpediteur: string
  devise: string
}

interface Props {
  profile: Profile
  siteSettings: SiteSettings
}

const CATEGORIES: { value: BienCategorie; label: string; icon: string }[] = [
  { value: 'appartement', label: 'Appartement', icon: '🏢' },
  { value: 'maison',      label: 'Maison',       icon: '🏠' },
  { value: 'bureau',      label: 'Bureau/Local',  icon: '🏗️' },
  { value: 'terrain',     label: 'Terrain',       icon: '🌱' },
  { value: 'parking',     label: 'Parking',       icon: '🅿️' },
  { value: 'local',       label: 'Local comm.',   icon: '🏪' },
]

const OPTIONS = [
  { value: 'parking',  label: 'Parking'  },
  { value: 'terrasse', label: 'Terrasse' },
  { value: 'cave',     label: 'Cave'     },
  { value: 'gardien',  label: 'Gardien'  },
  { value: 'piscine',  label: 'Piscine'  },
  { value: 'ascenseur',label: 'Ascenseur'},
  { value: 'digicode', label: 'Digicode' },
  { value: 'jardin',   label: 'Jardin'   },
]

const DPE_CLASSES: DpeClasse[] = ['A','B','C','D','E','F','G']
const DPE_COLORS: Record<DpeClasse, string> = {
  A:'#2E7D32', B:'#558B2F', C:'#9E9D24',
  D:'#F9A825', E:'#EF6C00', F:'#D84315', G:'#B71C1C'
}

export default function PublierForm({ profile, siteSettings }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const limite = LIMITES_PLAN[profile.plan]

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [photosPreviews, setPhotosPreviews] = useState<string[]>([])
  const [geocoding, setGeocoding] = useState(false)

  const [form, setForm] = useState({
    type: 'vente' as BienType,
    categorie: 'appartement' as BienCategorie,
    titre: '',
    description: '',
    prix: '',
    surface: '',
    pieces: '',
    sdb: '',
    etage: '',
    nb_etages: '',
    chambres: '',
    nb_wc: '',
    surface_terrain: '',
    annee_construction: '',
    dpe: '' as DpeClasse | '',
    ges: '' as DpeClasse | '',
    conso_energie: '',
    emissions_co2: '',
    depenses_energie_min: '',
    depenses_energie_max: '',
    meuble: false,
    fibre: false,
    options: [] as string[],
    adresse: '',
    complement: '',
    ville: '',
    code_postal: '',
    lat: 0,
    lng: 0,
    approx: false,
    neuf: false,
    ref_agence: '',
  })

  function update(field: string, value: unknown) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function toggleOption(val: string) {
    setForm(f => ({
      ...f,
      options: f.options.includes(val)
        ? f.options.filter(o => o !== val)
        : [...f.options, val]
    }))
  }

  function handlePhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
    const MAX_SIZE_MB = 10

    const files = Array.from(e.target.files ?? [])
    const valid = files.filter(f => {
      if (!ALLOWED_TYPES.includes(f.type)) {
        alert(`"${f.name}" n'est pas un format accepté (JPG, PNG, WebP uniquement).`)
        return false
      }
      if (f.size > MAX_SIZE_MB * 1024 * 1024) {
        alert(`"${f.name}" dépasse la limite de ${MAX_SIZE_MB} MB.`)
        return false
      }
      return true
    })
    const max = siteSettings.photosMaxUpload
    const selected = valid.slice(0, max - photos.length)
    setPhotos(p => [...p, ...selected])
    selected.forEach(f => {
      const reader = new FileReader()
      reader.onload = ev => setPhotosPreviews(p => [...p, ev.target?.result as string])
      reader.readAsDataURL(f)
    })
    // Réinitialiser pour permettre la re-sélection du même fichier
    e.target.value = ''
  }

  function removePhoto(idx: number) {
    setPhotos(p => p.filter((_, i) => i !== idx))
    setPhotosPreviews(p => p.filter((_, i) => i !== idx))
  }

  async function geocodeAdresse() {
    if (!form.adresse || !form.ville) return
    setGeocoding(true)
    try {
      const q = `${form.adresse}, ${form.ville}, France`
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1&countrycodes=fr`
      )
      const data = await res.json()
      if (data[0]) {
        update('lat', parseFloat(data[0].lat))
        update('lng', parseFloat(data[0].lon))
      }
    } finally {
      setGeocoding(false)
    }
  }

  async function handleSubmit(statut: 'brouillon' | 'en_attente') {
    setLoading(true)
    setError('')

    try {
      // 1. Créer le bien
      const { data: bien, error: bienError } = await supabase
        .from('biens')
        .insert({
          user_id: profile.id,
          statut,
          type: form.type,
          categorie: form.categorie,
          titre: form.titre,
          description: form.description || null,
          prix: parseFloat(form.prix),
          surface: form.surface ? parseFloat(form.surface) : null,
          pieces: form.pieces ? parseInt(form.pieces) : null,
          sdb: form.sdb ? parseInt(form.sdb) : null,
          chambres: form.chambres ? parseInt(form.chambres) : null,
          nb_wc: form.nb_wc ? parseInt(form.nb_wc) : null,
          surface_terrain: form.surface_terrain ? parseFloat(form.surface_terrain) : null,
          etage: form.etage ? parseInt(form.etage) : null,
          nb_etages: form.nb_etages ? parseInt(form.nb_etages) : null,
          annee_construction: form.annee_construction ? parseInt(form.annee_construction) : null,
          dpe: form.dpe || null,
          ges: form.ges || null,
          conso_energie: form.conso_energie ? parseFloat(form.conso_energie) : null,
          emissions_co2: form.emissions_co2 ? parseFloat(form.emissions_co2) : null,
          depenses_energie_min: form.depenses_energie_min ? parseInt(form.depenses_energie_min) : null,
          depenses_energie_max: form.depenses_energie_max ? parseInt(form.depenses_energie_max) : null,
          fibre: form.fibre,
          meuble: form.meuble,
          options: form.options,
          adresse: form.adresse || null,
          complement: form.complement || null,
          ville: form.ville,
          code_postal: form.code_postal,
          lat: form.lat,
          lng: form.lng,
          approx: form.approx,
          pro: profile.type === 'pro',
          neuf: form.neuf,
          ref_agence: form.ref_agence || null,
        })
        .select()
        .single()

      if (bienError) throw bienError

      // 2. Uploader les photos
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i]
        const ext = photo.name.split('.').pop()
        const path = `${profile.id}/${bien.id}/${i}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('photos-biens')
          .upload(path, photo, { upsert: true })

        if (uploadError) continue

        const { data: { publicUrl } } = supabase.storage
          .from('photos-biens')
          .getPublicUrl(path)

        await supabase.from('photos').insert({
          bien_id: bien.id,
          url: publicUrl,
          storage_path: path,
          ordre: i,
          principale: i === 0,
        })
      }

      router.push('/compte/mes-annonces')

    } catch (err: any) {
      setError(err.message ?? 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  // ── RENDU ──
  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="bg-navy text-white px-6 py-4 flex items-center justify-between">
        <h1 className="font-serif text-xl">Publier un bien</h1>
        <button onClick={() => router.back()} className="text-white/50 hover:text-white text-sm">
          ✕ Annuler
        </button>
      </div>

      {/* Étapes */}
      <div className="flex border-b border-navy/10 bg-white">
        {['Informations', 'Localisation', 'Photos'].map((s, i) => (
          <button
            key={s}
            onClick={() => setStep(i + 1)}
            className={`flex-1 py-3 text-sm font-medium transition-all border-b-2 ${
              step === i + 1
                ? 'border-primary text-primary'
                : 'border-transparent text-navy/40 hover:text-navy/70'
            }`}
          >
            {i + 1}. {s}
          </button>
        ))}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {/* ── ÉTAPE 1 : Informations ── */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-navy/10">
              <h2 className="font-medium text-sm text-navy/50 uppercase tracking-wider mb-4">Type d'annonce</h2>

              {/* Vente / Location */}
              <div className="flex gap-3 mb-6">
                {(['vente', 'location'] as BienType[]).map(t => (
                  <button
                    key={t}
                    onClick={() => update('type', t)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                      form.type === t
                        ? 'bg-navy text-white border-navy'
                        : 'bg-white text-navy/60 border-navy/15 hover:border-navy/30'
                    }`}
                  >
                    {t === 'vente' ? '🏷️ Vente' : '🔑 Location'}
                  </button>
                ))}
              </div>

              {/* Catégorie */}
              <div className="grid grid-cols-3 gap-2 mb-6">
                {CATEGORIES.map(c => (
                  <button
                    key={c.value}
                    onClick={() => update('categorie', c.value)}
                    className={`py-3 rounded-xl text-sm border transition-all flex flex-col items-center gap-1 ${
                      form.categorie === c.value
                        ? 'bg-navy text-white border-navy'
                        : 'bg-white text-navy/60 border-navy/15 hover:border-navy/30'
                    }`}
                  >
                    <span className="text-xl">{c.icon}</span>
                    <span className="text-xs font-medium">{c.label}</span>
                  </button>
                ))}
              </div>

              {/* Titre */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-navy/60 mb-2">Titre de l'annonce *</label>
                <input
                  type="text"
                  value={form.titre}
                  onChange={e => update('titre', e.target.value)}
                  placeholder="Ex: Bel appartement T3 avec terrasse"
                  maxLength={120}
                  className="w-full border border-navy/15 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                />
                <p className="text-[11px] text-navy/35 mt-1">{form.titre.length}/120</p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-navy/60 mb-2">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => update('description', e.target.value)}
                  placeholder="Décrivez votre bien en détail…"
                  rows={5}
                  maxLength={3000}
                  className="w-full border border-navy/15 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors resize-none"
                />
                <p className="text-[11px] text-navy/35 mt-1">{form.description.length}/3000</p>
              </div>
            </div>

            {/* Caractéristiques */}
            <div className="bg-white rounded-2xl p-6 border border-navy/10">
              <h2 className="font-medium text-sm text-navy/50 uppercase tracking-wider mb-4">Caractéristiques</h2>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-navy/60 mb-2">
                    Prix {form.type === 'location' ? '(€/mois)' : '(€)'} *
                  </label>
                  <input
                    type="number"
                    value={form.prix}
                    onChange={e => update('prix', e.target.value)}
                    placeholder={form.type === 'location' ? '1200' : '250000'}
                    min="0"
                    className="w-full border border-navy/15 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-navy/60 mb-2">Surface (m²)</label>
                  <input
                    type="number"
                    value={form.surface}
                    onChange={e => update('surface', e.target.value)}
                    placeholder="75"
                    min="0"
                    className="w-full border border-navy/15 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-navy/60 mb-2">Pièces</label>
                  <input
                    type="number"
                    value={form.pieces}
                    onChange={e => update('pieces', e.target.value)}
                    placeholder="3"
                    min="0"
                    className="w-full border border-navy/15 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-navy/60 mb-2">Salles de bain</label>
                  <input
                    type="number"
                    value={form.sdb}
                    onChange={e => update('sdb', e.target.value)}
                    placeholder="1"
                    min="0"
                    className="w-full border border-navy/15 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-navy/60 mb-2">Chambres</label>
                  <input
                    type="number"
                    value={form.chambres}
                    onChange={e => update('chambres', e.target.value)}
                    placeholder="2"
                    min="0"
                    className="w-full border border-navy/15 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-navy/60 mb-2">WC</label>
                  <input
                    type="number"
                    value={form.nb_wc}
                    onChange={e => update('nb_wc', e.target.value)}
                    placeholder="1"
                    min="0"
                    className="w-full border border-navy/15 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                {(form.categorie === 'maison' || form.categorie === 'terrain') && (
                  <div>
                    <label className="block text-xs font-medium text-navy/60 mb-2">Surface terrain (m²)</label>
                    <input
                      type="number"
                      value={form.surface_terrain}
                      onChange={e => update('surface_terrain', e.target.value)}
                      placeholder="200"
                      min="0"
                      className="w-full border border-navy/15 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-navy/60 mb-2">Étage</label>
                  <input
                    type="number"
                    value={form.etage}
                    onChange={e => update('etage', e.target.value)}
                    placeholder="2"
                    min="0"
                    className="w-full border border-navy/15 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-navy/60 mb-2">Nb étages total</label>
                  <input
                    type="number"
                    value={form.nb_etages}
                    onChange={e => update('nb_etages', e.target.value)}
                    placeholder="5"
                    min="0"
                    className="w-full border border-navy/15 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-navy/60 mb-2">Année construction</label>
                  <input
                    type="number"
                    value={form.annee_construction}
                    onChange={e => update('annee_construction', e.target.value)}
                    placeholder="1990"
                    min="1800"
                    max={new Date().getFullYear()}
                    className="w-full border border-navy/15 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              {/* DPE */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-navy/60 mb-2">Classe DPE</label>
                <div className="flex gap-2">
                  {DPE_CLASSES.map(d => (
                    <button
                      key={d}
                      onClick={() => update('dpe', form.dpe === d ? '' : d)}
                      style={{ background: form.dpe === d ? DPE_COLORS[d] : '#f5f5f5' }}
                      className={`w-9 h-8 rounded-md text-sm font-bold transition-all ${
                        form.dpe === d ? 'text-white scale-110' : 'text-navy/50'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* GES */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-navy/60 mb-2">Classe GES (émissions CO2)</label>
                <div className="flex gap-2">
                  {DPE_CLASSES.map(d => (
                    <button
                      key={d}
                      onClick={() => update('ges', form.ges === d ? '' : d)}
                      style={{ background: form.ges === d ? DPE_COLORS[d] : '#f5f5f5' }}
                      className={`w-9 h-8 rounded-md text-sm font-bold transition-all ${
                        form.ges === d ? 'text-white scale-110' : 'text-navy/50'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Détail DPE */}
              <div className="mb-4 bg-navy/02 rounded-xl p-4 border border-navy/08">
                <label className="block text-xs font-medium text-navy/50 uppercase tracking-wider mb-3">Détail DPE (optionnel)</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-navy/60 mb-2">Consommation énergétique (kWh/m²/an)</label>
                    <input
                      type="number"
                      value={form.conso_energie}
                      onChange={e => update('conso_energie', e.target.value)}
                      placeholder="264"
                      min="0"
                      className="w-full border border-navy/15 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-navy/60 mb-2">Émissions GES (kgCO2/m²/an)</label>
                    <input
                      type="number"
                      value={form.emissions_co2}
                      onChange={e => update('emissions_co2', e.target.value)}
                      placeholder="51"
                      min="0"
                      className="w-full border border-navy/15 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-navy/60 mb-2">Dépenses min (€/an)</label>
                    <input
                      type="number"
                      value={form.depenses_energie_min}
                      onChange={e => update('depenses_energie_min', e.target.value)}
                      placeholder="1200"
                      min="0"
                      className="w-full border border-navy/15 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-navy/60 mb-2">Dépenses max (€/an)</label>
                    <input
                      type="number"
                      value={form.depenses_energie_max}
                      onChange={e => update('depenses_energie_max', e.target.value)}
                      placeholder="1800"
                      min="0"
                      className="w-full border border-navy/15 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Options */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-navy/60 mb-2">Options</label>
                <div className="flex flex-wrap gap-2">
                  {OPTIONS.map(o => (
                    <button
                      key={o.value}
                      onClick={() => toggleOption(o.value)}
                      className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                        form.options.includes(o.value)
                          ? 'bg-navy text-white border-navy'
                          : 'bg-white text-navy/60 border-navy/15 hover:border-navy/30'
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Checkboxes */}
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.meuble}
                    onChange={e => update('meuble', e.target.checked)}
                    className="accent-primary"
                  />
                  <span className="text-sm text-navy/70">Meublé</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.neuf}
                    onChange={e => update('neuf', e.target.checked)}
                    className="accent-primary"
                  />
                  <span className="text-sm text-navy/70">Neuf / VEFA</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.fibre}
                    onChange={e => update('fibre', e.target.checked)}
                    className="accent-primary"
                  />
                  <span className="text-sm text-navy/70">Fibre optique disponible</span>
                </label>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!form.titre || !form.prix}
              className="w-full bg-navy text-white rounded-xl py-3.5 text-sm font-medium hover:bg-primary transition-colors disabled:opacity-40"
            >
              Suivant → Localisation
            </button>
          </div>
        )}

        {/* ── ÉTAPE 2 : Localisation ── */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-navy/10">
              <h2 className="font-medium text-sm text-navy/50 uppercase tracking-wider mb-4">Localisation</h2>

              <LocationPicker
                adresse={form.adresse}
                ville={form.ville}
                codePostal={form.code_postal}
                lat={form.lat}
                lng={form.lng}
                onChange={fields => {
                  if (fields.adresse    !== undefined) update('adresse',    fields.adresse)
                  if (fields.ville      !== undefined) update('ville',      fields.ville)
                  if (fields.code_postal !== undefined) update('code_postal', fields.code_postal)
                  if (fields.lat        !== undefined) update('lat',        fields.lat)
                  if (fields.lng        !== undefined) update('lng',        fields.lng)
                }}
              />

              <div className="mt-4 space-y-4">
                {/* Position approximative */}
                <label className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.approx}
                    onChange={e => update('approx', e.target.checked)}
                    className="accent-primary mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-medium text-amber-900">Position approximative</p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      L'adresse exacte ne sera pas affichée sur la carte. Un cercle indiquera la zone approximative.
                    </p>
                  </div>
                </label>

                {/* Référence agence (si pro) */}
                {profile.type === 'pro' && (
                  <div>
                    <label className="block text-xs font-medium text-navy/60 mb-2">Référence interne</label>
                    <input
                      type="text"
                      value={form.ref_agence}
                      onChange={e => update('ref_agence', e.target.value)}
                      placeholder="REF-2024-001"
                      className="w-full border border-navy/15 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 border border-navy/15 text-navy/60 rounded-xl py-3.5 text-sm font-medium hover:border-navy/30 transition-colors"
              >
                ← Retour
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!form.ville || !form.code_postal || form.lat === 0}
                className="flex-1 bg-navy text-white rounded-xl py-3.5 text-sm font-medium hover:bg-primary transition-colors disabled:opacity-40"
              >
                Suivant → Photos
              </button>
            </div>
          </div>
        )}

        {/* ── ÉTAPE 3 : Photos ── */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-navy/10">
              <h2 className="font-medium text-sm text-navy/50 uppercase tracking-wider mb-2">Photos</h2>
              <p className="text-xs text-navy/40 mb-4">
                {photos.length}/{siteSettings.photosMaxUpload} photos · La première sera la photo principale
              </p>

              {/* Upload zone */}
              {photos.length < siteSettings.photosMaxUpload && (
                <label className="block border-2 border-dashed border-navy/15 rounded-xl p-8 text-center cursor-pointer hover:border-primary transition-colors mb-4">
                  <div className="text-3xl mb-2">📷</div>
                  <p className="text-sm text-navy/50">
                    Cliquez pour ajouter des photos
                  </p>
                  <p className="text-xs text-navy/30 mt-1">JPG, PNG, WebP · Max 10 MB</p>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handlePhotos}
                    className="hidden"
                  />
                </label>
              )}

              {/* Aperçus */}
              {photosPreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {photosPreviews.map((src, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      {i === 0 && (
                        <span className="absolute top-1.5 left-1.5 bg-primary text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
                          Principale
                        </span>
                      )}
                      <button
                        onClick={() => removePhoto(i)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/50 text-white rounded-full text-xs hover:bg-black/70 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Récap limite */}
            {profile.plan === 'gratuit' && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                <strong>Plan gratuit</strong> — {limite.annonces} annonces max, {siteSettings.photosMaxUpload} photos/annonce, visible {limite.duree_jours} jours.{' '}
                <a href="/compte/plan" className="underline font-medium">Passer Pro →</a>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 border border-navy/15 text-navy/60 rounded-xl py-3.5 text-sm font-medium hover:border-navy/30 transition-colors"
              >
                ← Retour
              </button>
              <button
                onClick={() => handleSubmit('brouillon')}
                disabled={loading}
                className="px-6 border border-navy/15 text-navy/60 rounded-xl py-3.5 text-sm font-medium hover:border-navy/30 transition-colors disabled:opacity-40"
              >
                Sauvegarder
              </button>
              <button
                onClick={() => handleSubmit('en_attente')}
                disabled={loading}
                className="flex-1 bg-primary text-white rounded-xl py-3.5 text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-40"
              >
                {loading ? 'Publication…' : 'Publier →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


