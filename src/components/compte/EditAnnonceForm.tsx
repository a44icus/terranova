'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { BienType, BienCategorie, DpeClasse, Profile } from '@/lib/types'
import { LIMITES_PLAN } from '@/lib/types'
import LocationPicker from '@/components/LocationPicker'

interface Photo { id: string; url: string; storage_path: string; ordre: number; principale: boolean }

interface Props {
  bien: any
  photos: Photo[]
  profile: Profile
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
  { value: 'parking',   label: 'Parking'   },
  { value: 'terrasse',  label: 'Terrasse'  },
  { value: 'cave',      label: 'Cave'      },
  { value: 'gardien',   label: 'Gardien'   },
  { value: 'piscine',   label: 'Piscine'   },
  { value: 'ascenseur', label: 'Ascenseur' },
  { value: 'jardin',    label: 'Jardin'    },
]

const DPE_CLASSES: DpeClasse[] = ['A','B','C','D','E','F','G']
const DPE_COLORS: Record<DpeClasse, string> = {
  A:'#2E7D32', B:'#558B2F', C:'#9E9D24',
  D:'#F9A825', E:'#EF6C00', F:'#D84315', G:'#B71C1C',
}

export default function EditAnnonceForm({ bien, photos: initialPhotos, profile }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const limite = LIMITES_PLAN[profile.plan]

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Photos existantes + nouvelles
  const [existingPhotos, setExistingPhotos] = useState<Photo[]>(initialPhotos)
  const [newPhotos, setNewPhotos] = useState<File[]>([])
  const [newPreviews, setNewPreviews] = useState<string[]>([])
  const [deletedPhotoIds, setDeletedPhotoIds] = useState<string[]>([])

  // Photos 360°
  const [new360Photos, setNew360Photos] = useState<File[]>([])
  const [new360Previews, setNew360Previews] = useState<string[]>([])
  const [deleted360Ids, setDeleted360Ids] = useState<string[]>([])

  const [form, setForm] = useState({
    type:               bien.type as BienType,
    categorie:          bien.categorie as BienCategorie,
    titre:              bien.titre ?? '',
    description:        bien.description ?? '',
    prix:               String(bien.prix ?? ''),
    surface:            String(bien.surface ?? ''),
    pieces:             String(bien.pieces ?? ''),
    chambres:           String(bien.chambres ?? ''),
    sdb:                String(bien.sdb ?? ''),
    nb_wc:              String(bien.nb_wc ?? ''),
    surface_terrain:    String(bien.surface_terrain ?? ''),
    etage:              String(bien.etage ?? ''),
    nb_etages:          String(bien.nb_etages ?? ''),
    annee_construction: String(bien.annee_construction ?? ''),
    dpe:                (bien.dpe ?? '') as DpeClasse | '',
    ges:                (bien.ges ?? '') as DpeClasse | '',
    conso_energie:      String(bien.conso_energie ?? ''),
    emissions_co2:      String(bien.emissions_co2 ?? ''),
    depenses_energie_min: String(bien.depenses_energie_min ?? ''),
    depenses_energie_max: String(bien.depenses_energie_max ?? ''),
    fibre:              bien.fibre ?? false,
    meuble:             bien.meuble ?? false,
    neuf:               bien.neuf ?? false,
    options:            (bien.options ?? []) as string[],
    adresse:            bien.adresse ?? '',
    complement:         bien.complement ?? '',
    ville:              bien.ville ?? '',
    code_postal:        bien.code_postal ?? '',
    lat:                bien.lat ?? 0,
    lng:                bien.lng ?? 0,
    approx:             bien.approx ?? false,
    ref_agence:         bien.ref_agence ?? '',
  })

  function update(field: string, value: unknown) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function toggleOption(val: string) {
    setForm(f => ({
      ...f,
      options: f.options.includes(val)
        ? f.options.filter(o => o !== val)
        : [...f.options, val],
    }))
  }

  function handleNew360Photos(e: React.ChangeEvent<HTMLInputElement>) {
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
    const files = Array.from(e.target.files ?? []).filter(f => {
      if (!ALLOWED_TYPES.includes(f.type)) {
        alert(`"${f.name}" doit être JPG, PNG ou WebP.`)
        return false
      }
      if (f.size > 30 * 1024 * 1024) {
        alert(`"${f.name}" dépasse 30 MB.`)
        return false
      }
      return true
    })
    setNew360Photos(p => [...p, ...files])
    files.forEach(f => {
      const reader = new FileReader()
      reader.onload = ev => setNew360Previews(p => [...p, ev.target?.result as string])
      reader.readAsDataURL(f)
    })
    e.target.value = ''
  }

  function removeNew360Photo(idx: number) {
    setNew360Photos(p => p.filter((_, i) => i !== idx))
    setNew360Previews(p => p.filter((_, i) => i !== idx))
  }

  function removeExisting360Photo(photo: Photo) {
    setDeleted360Ids(ids => [...ids, photo.id])
    setExistingPhotos(ps => ps.filter(p => p.id !== photo.id))
  }

  function handleNewPhotos(e: React.ChangeEvent<HTMLInputElement>) {
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
    const totalExisting = existingPhotos.length - deletedPhotoIds.length
    const canAdd = limite.photos - totalExisting - newPhotos.length
    const selected = valid.slice(0, Math.max(canAdd, 0))
    setNewPhotos(p => [...p, ...selected])
    selected.forEach(f => {
      const reader = new FileReader()
      reader.onload = ev => setNewPreviews(p => [...p, ev.target?.result as string])
      reader.readAsDataURL(f)
    })
    // Réinitialiser pour permettre la re-sélection du même fichier
    e.target.value = ''
  }

  function removeNewPhoto(idx: number) {
    setNewPhotos(p => p.filter((_, i) => i !== idx))
    setNewPreviews(p => p.filter((_, i) => i !== idx))
  }

  function removeExistingPhoto(photo: Photo) {
    setDeletedPhotoIds(ids => [...ids, photo.id])
    setExistingPhotos(ps => ps.filter(p => p.id !== photo.id))
  }

  function setPrincipale(photo: Photo) {
    setExistingPhotos(ps => ps.map(p => ({ ...p, principale: p.id === photo.id })))
  }

  async function handleSubmit(statut: 'brouillon' | 'en_attente') {
    setLoading(true)
    setError('')
    try {
      // 1. Mettre à jour le bien
      const { error: bienError } = await supabase
        .from('biens')
        .update({
          statut,
          type:               form.type,
          categorie:          form.categorie,
          titre:              form.titre,
          description:        form.description || null,
          prix:               parseFloat(form.prix),
          surface:            form.surface ? parseFloat(form.surface) : null,
          pieces:             form.pieces ? parseInt(form.pieces) : null,
          chambres:           form.chambres ? parseInt(form.chambres) : null,
          sdb:                form.sdb ? parseInt(form.sdb) : null,
          nb_wc:              form.nb_wc ? parseInt(form.nb_wc) : null,
          surface_terrain:    form.surface_terrain ? parseFloat(form.surface_terrain) : null,
          etage:              form.etage ? parseInt(form.etage) : null,
          nb_etages:          form.nb_etages ? parseInt(form.nb_etages) : null,
          annee_construction: form.annee_construction ? parseInt(form.annee_construction) : null,
          dpe:                form.dpe || null,
          ges:                form.ges || null,
          conso_energie:      form.conso_energie ? parseFloat(form.conso_energie) : null,
          emissions_co2:      form.emissions_co2 ? parseFloat(form.emissions_co2) : null,
          depenses_energie_min: form.depenses_energie_min ? parseInt(form.depenses_energie_min) : null,
          depenses_energie_max: form.depenses_energie_max ? parseInt(form.depenses_energie_max) : null,
          fibre:              form.fibre,
          meuble:             form.meuble,
          options:            form.options,
          adresse:            form.adresse || null,
          complement:         form.complement || null,
          ville:              form.ville,
          code_postal:        form.code_postal,
          lat:                form.lat,
          lng:                form.lng,
          approx:             form.approx,
          neuf:               form.neuf,
          ref_agence:         form.ref_agence || null,
        })
        .eq('id', bien.id)

      if (bienError) throw bienError

      // 2. Supprimer les photos marquées
      for (const photoId of deletedPhotoIds) {
        const photo = initialPhotos.find(p => p.id === photoId)
        if (photo) {
          await supabase.storage.from('photos-biens').remove([photo.storage_path])
          await supabase.from('photos').delete().eq('id', photoId)
        }
      }

      // 3. Mettre à jour la photo principale
      const principale = existingPhotos.find(p => p.principale)
      if (principale) {
        await supabase.from('photos').update({ principale: false }).eq('bien_id', bien.id)
        await supabase.from('photos').update({ principale: true }).eq('id', principale.id)
      }

      // 4. Uploader les nouvelles photos
      const startOrdre = existingPhotos.length
      for (let i = 0; i < newPhotos.length; i++) {
        const photo = newPhotos[i]
        const ext = photo.name.split('.').pop()
        const path = `${profile.id}/${bien.id}/${Date.now()}-${i}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('photos-biens')
          .upload(path, photo, { upsert: true })
        if (uploadError) continue
        const { data: { publicUrl } } = supabase.storage.from('photos-biens').getPublicUrl(path)
        await supabase.from('photos').insert({
          bien_id: bien.id,
          url: publicUrl,
          storage_path: path,
          ordre: startOrdre + i,
          principale: existingPhotos.length === 0 && i === 0,
        })
      }

      // 5. Supprimer les photos 360° marquées
      for (const photoId of deleted360Ids) {
        const photo = existingPhotos.find(p => p.id === photoId) ?? initialPhotos.find(p => p.id === photoId)
        if (photo) {
          await supabase.storage.from('photos-biens').remove([photo.storage_path])
          await supabase.from('photos').delete().eq('id', photoId)
        }
      }

      // 6. Uploader les nouvelles photos 360°
      for (let i = 0; i < new360Photos.length; i++) {
        const photo = new360Photos[i]
        const ext = photo.name.split('.').pop()
        const path = `${profile.id}/${bien.id}/360-${Date.now()}-${i}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('photos-biens')
          .upload(path, photo, { upsert: true })
        if (uploadError) continue
        const { data: { publicUrl } } = supabase.storage.from('photos-biens').getPublicUrl(path)
        await supabase.from('photos').insert({
          bien_id: bien.id,
          url: publicUrl,
          storage_path: path,
          ordre: 1000 + i,
          principale: false,
          is_360: true,
        })
      }

      router.push('/compte/mes-annonces')
      router.refresh()
    } catch (err: any) {
      setError(err.message ?? 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Supprimer définitivement cette annonce ? Cette action est irréversible.')) return
    setLoading(true)
    // Supprimer toutes les photos du storage
    for (const photo of initialPhotos) {
      await supabase.storage.from('photos-biens').remove([photo.storage_path])
    }
    await supabase.from('biens').delete().eq('id', bien.id)
    router.push('/compte/mes-annonces')
    router.refresh()
  }

  const inputCls = "w-full border border-navy/15 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors bg-white"
  const labelCls = "block text-xs font-medium text-navy/55 mb-1.5"

  const totalPhotos = existingPhotos.length + newPhotos.length

  return (
    <div>
      {/* Étapes */}
      <div className="flex border-b border-navy/10 bg-white rounded-t-2xl mb-6 overflow-hidden">
        {['Informations', 'Localisation', 'Photos'].map((s, i) => (
          <button key={s} onClick={() => setStep(i + 1)}
            className={`flex-1 py-3 text-sm font-medium transition-all border-b-2 ${step === i + 1 ? 'border-primary text-primary' : 'border-transparent text-navy/40 hover:text-navy/70'}`}>
            {i + 1}. {s}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-5">{error}</div>
      )}

      {/* ── ÉTAPE 1 ── */}
      {step === 1 && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl p-5 border border-navy/08 space-y-5">
            {/* Vente / Location */}
            <div className="flex gap-3">
              {(['vente', 'location'] as BienType[]).map(t => (
                <button key={t} type="button" onClick={() => update('type', t)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${form.type === t ? 'bg-navy text-white border-navy' : 'bg-white text-navy/60 border-navy/15 hover:border-navy/30'}`}>
                  {t === 'vente' ? '🏷️ Vente' : '🔑 Location'}
                </button>
              ))}
            </div>

            {/* Catégorie */}
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map(c => (
                <button key={c.value} type="button" onClick={() => update('categorie', c.value)}
                  className={`py-2.5 rounded-xl text-sm border transition-all flex flex-col items-center gap-1 ${form.categorie === c.value ? 'bg-navy text-white border-navy' : 'bg-white text-navy/60 border-navy/15 hover:border-navy/30'}`}>
                  <span className="text-lg">{c.icon}</span>
                  <span className="text-xs font-medium">{c.label}</span>
                </button>
              ))}
            </div>

            {/* Titre */}
            <div>
              <label className={labelCls}>Titre *</label>
              <input type="text" value={form.titre} onChange={e => update('titre', e.target.value)} maxLength={120} className={inputCls} />
              <p className="text-[11px] text-navy/35 mt-1">{form.titre.length}/120</p>
            </div>

            {/* Description */}
            <div>
              <label className={labelCls}>Description</label>
              <textarea value={form.description} onChange={e => update('description', e.target.value)} rows={5} maxLength={3000} className={inputCls + ' resize-none'} />
              <p className="text-[11px] text-navy/35 mt-1">{form.description.length}/3000</p>
            </div>
          </div>

          {/* Caractéristiques */}
          <div className="bg-white rounded-2xl p-5 border border-navy/08 space-y-4">
            <h3 className="text-xs font-medium text-navy/50 uppercase tracking-wider">Caractéristiques</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: `Prix ${form.type === 'location' ? '(€/mois)' : '(€)'} *`, key: 'prix', placeholder: form.type === 'location' ? '1200' : '250000' },
                { label: 'Surface (m²)', key: 'surface', placeholder: '75' },
                { label: 'Pièces', key: 'pieces', placeholder: '3' },
                { label: 'Chambres', key: 'chambres', placeholder: '2' },
                { label: 'Salles de bain', key: 'sdb', placeholder: '1' },
                { label: 'WC', key: 'nb_wc', placeholder: '1' },
                { label: 'Étage', key: 'etage', placeholder: '2' },
                { label: 'Nb étages total', key: 'nb_etages', placeholder: '5' },
                { label: 'Année construction', key: 'annee_construction', placeholder: '1990' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className={labelCls}>{label}</label>
                  <input type="number" value={(form as any)[key]} onChange={e => update(key, e.target.value)} placeholder={placeholder} className={inputCls} />
                </div>
              ))}
              {(form.categorie === 'maison' || form.categorie === 'terrain') && (
                <div>
                  <label className={labelCls}>Surface terrain (m²)</label>
                  <input type="number" value={form.surface_terrain} onChange={e => update('surface_terrain', e.target.value)} placeholder="500" className={inputCls} />
                </div>
              )}
            </div>

            {/* DPE + GES */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Classe DPE</label>
                <div className="flex gap-1.5 flex-wrap">
                  {DPE_CLASSES.map(d => (
                    <button key={d} type="button" onClick={() => update('dpe', form.dpe === d ? '' : d)}
                      style={{ background: form.dpe === d ? DPE_COLORS[d] : '#f5f5f5' }}
                      className={`w-9 h-8 rounded-md text-sm font-bold transition-all ${form.dpe === d ? 'text-white scale-110' : 'text-navy/50'}`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelCls}>Classe GES</label>
                <div className="flex gap-1.5 flex-wrap">
                  {DPE_CLASSES.map(d => (
                    <button key={d} type="button" onClick={() => update('ges', form.ges === d ? '' : d)}
                      style={{ background: form.ges === d ? DPE_COLORS[d] : '#f5f5f5' }}
                      className={`w-9 h-8 rounded-md text-sm font-bold transition-all ${form.ges === d ? 'text-white scale-110' : 'text-navy/50'}`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Détail DPE */}
            <div>
              <label className={labelCls}>Détail DPE <span className="text-navy/30 font-normal">(optionnel)</span></label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Consommation (kWh/m²/an)</label>
                  <input type="number" value={form.conso_energie} onChange={e => update('conso_energie', e.target.value)} placeholder="264" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Émissions GES (kgCO2/m²/an)</label>
                  <input type="number" value={form.emissions_co2} onChange={e => update('emissions_co2', e.target.value)} placeholder="51" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Dépenses min (€/an)</label>
                  <input type="number" value={form.depenses_energie_min} onChange={e => update('depenses_energie_min', e.target.value)} placeholder="1200" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Dépenses max (€/an)</label>
                  <input type="number" value={form.depenses_energie_max} onChange={e => update('depenses_energie_max', e.target.value)} placeholder="1800" className={inputCls} />
                </div>
              </div>
            </div>

            {/* Options */}
            <div>
              <label className={labelCls}>Options</label>
              <div className="flex flex-wrap gap-2">
                {OPTIONS.map(o => (
                  <button key={o.value} type="button" onClick={() => toggleOption(o.value)}
                    className={`px-3 py-1.5 rounded-full text-xs border transition-all ${form.options.includes(o.value) ? 'bg-navy text-white border-navy' : 'bg-white text-navy/60 border-navy/15 hover:border-navy/30'}`}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-5">
              {[
                { key: 'meuble', label: 'Meublé' },
                { key: 'neuf', label: 'Neuf / VEFA' },
                { key: 'fibre', label: 'Fibre optique' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={(form as any)[key]} onChange={e => update(key, e.target.checked)} className="accent-primary" />
                  <span className="text-sm text-navy/70">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <button onClick={() => setStep(2)} disabled={!form.titre || !form.prix}
            className="w-full bg-navy text-white rounded-xl py-3 text-sm font-medium hover:bg-primary transition-colors disabled:opacity-40">
            Suivant → Localisation
          </button>
        </div>
      )}

      {/* ── ÉTAPE 2 ── */}
      {step === 2 && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl p-5 border border-navy/08 space-y-4">
            <h3 className="text-xs font-medium text-navy/50 uppercase tracking-wider">Localisation</h3>

            <LocationPicker
              adresse={form.adresse}
              ville={form.ville}
              codePostal={form.code_postal}
              lat={form.lat}
              lng={form.lng}
              onChange={fields => {
                if (fields.adresse     !== undefined) update('adresse',     fields.adresse)
                if (fields.ville       !== undefined) update('ville',       fields.ville)
                if (fields.code_postal !== undefined) update('code_postal', fields.code_postal)
                if (fields.lat         !== undefined) update('lat',         fields.lat)
                if (fields.lng         !== undefined) update('lng',         fields.lng)
              }}
            />

            <label className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl cursor-pointer">
              <input type="checkbox" checked={form.approx} onChange={e => update('approx', e.target.checked)} className="accent-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-900">Position approximative</p>
                <p className="text-xs text-amber-700 mt-0.5">L'adresse exacte ne sera pas affichée sur la carte.</p>
              </div>
            </label>

            {profile.type === 'pro' && (
              <div>
                <label className={labelCls}>Référence interne</label>
                <input type="text" value={form.ref_agence} onChange={e => update('ref_agence', e.target.value)} placeholder="REF-2024-001" className={inputCls} />
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 border border-navy/15 text-navy/60 rounded-xl py-3 text-sm font-medium hover:border-navy/30 transition-colors">← Retour</button>
            <button onClick={() => setStep(3)} disabled={!form.ville || !form.code_postal}
              className="flex-1 bg-navy text-white rounded-xl py-3 text-sm font-medium hover:bg-primary transition-colors disabled:opacity-40">
              Suivant → Photos
            </button>
          </div>
        </div>
      )}

      {/* ── ÉTAPE 3 ── */}
      {step === 3 && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl p-5 border border-navy/08">
            <h3 className="text-xs font-medium text-navy/50 uppercase tracking-wider mb-1">Photos</h3>
            <p className="text-xs text-navy/40 mb-4">{totalPhotos}/{limite.photos} photos</p>

            {/* Photos existantes */}
            {existingPhotos.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-navy/50 mb-2">Photos actuelles</p>
                <div className="grid grid-cols-3 gap-3">
                  {existingPhotos.map(photo => (
                    <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group">
                      <img src={photo.url} alt="" className="w-full h-full object-cover" />
                      {photo.principale && (
                        <span className="absolute top-1.5 left-1.5 bg-primary text-white text-[9px] font-semibold px-1.5 py-0.5 rounded">
                          Principale
                        </span>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100">
                        {!photo.principale && (
                          <button onClick={() => setPrincipale(photo)}
                            className="bg-white text-navy text-[9px] font-semibold px-2 py-1 rounded-lg shadow">
                            Principale
                          </button>
                        )}
                        <button onClick={() => removeExistingPhoto(photo)}
                          className="w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center shadow">
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Nouvelles photos */}
            {totalPhotos < limite.photos && (
              <label className="block border-2 border-dashed border-navy/15 rounded-xl p-6 text-center cursor-pointer hover:border-primary transition-colors mb-3">
                <div className="text-2xl mb-1">📷</div>
                <p className="text-xs text-navy/50">Ajouter des photos</p>
                <p className="text-[10px] text-navy/30 mt-0.5">JPG, PNG, WebP · Max 10 MB</p>
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleNewPhotos} className="hidden" />
              </label>
            )}

            {newPreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {newPreviews.map((src, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <span className="absolute top-1.5 left-1.5 bg-blue-500 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded">Nouvelle</span>
                    <button onClick={() => removeNewPhoto(i)}
                      className="absolute top-1.5 right-1.5 w-5 h-5 bg-black/50 text-white rounded-full text-xs hover:bg-black/70">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 360° */}
          <div className="bg-white rounded-2xl p-5 border border-navy/08 space-y-3">
            <div>
              <h3 className="text-xs font-medium text-navy/50 uppercase tracking-wider mb-0.5">Visite virtuelle 360°</h3>
              <p className="text-xs text-navy/40">Uploadez des photos sphériques equirectangulaires (format 2:1).</p>
            </div>

            {/* Photos 360° existantes */}
            {existingPhotos.filter(p => (p as any).is_360).length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {existingPhotos.filter(p => (p as any).is_360).map(photo => (
                  <div key={photo.id} className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 group">
                    <img src={photo.url} alt="" className="w-full h-full object-cover" />
                    <span className="absolute top-1.5 left-1.5 bg-indigo-600 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded">360°</span>
                    <button onClick={() => removeExisting360Photo(photo)}
                      className="absolute top-1.5 right-1.5 w-5 h-5 bg-black/50 text-white rounded-full text-xs flex items-center justify-center hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                  </div>
                ))}
              </div>
            )}

            {/* Nouvelles photos 360° */}
            {new360Previews.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {new360Previews.map((src, i) => (
                  <div key={i} className="relative aspect-video rounded-xl overflow-hidden bg-gray-100">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <span className="absolute top-1.5 left-1.5 bg-indigo-500 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded">Nouvelle · 360°</span>
                    <button onClick={() => removeNew360Photo(i)}
                      className="absolute top-1.5 right-1.5 w-5 h-5 bg-black/50 text-white rounded-full text-xs flex items-center justify-center hover:bg-black/70">✕</button>
                  </div>
                ))}
              </div>
            )}

            <label className="block border-2 border-dashed border-indigo-200 rounded-xl p-5 text-center cursor-pointer hover:border-indigo-400 transition-colors">
              <div className="text-2xl mb-1">🌐</div>
              <p className="text-xs text-navy/50">Ajouter une photo 360°</p>
              <p className="text-[10px] text-navy/30 mt-0.5">JPG, PNG, WebP · Max 30 MB · Ratio 2:1 recommandé</p>
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleNew360Photos} className="hidden" />
            </label>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="border border-navy/15 text-navy/60 rounded-xl py-3 px-5 text-sm font-medium hover:border-navy/30 transition-colors">← Retour</button>
            <button onClick={() => handleSubmit('brouillon')} disabled={loading}
              className="px-5 border border-navy/15 text-navy/60 rounded-xl py-3 text-sm font-medium hover:border-navy/30 transition-colors disabled:opacity-40">
              Sauvegarder
            </button>
            <button onClick={() => handleSubmit('en_attente')} disabled={loading}
              className="flex-1 bg-primary text-white rounded-xl py-3 text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-40">
              {loading ? 'Enregistrement…' : 'Soumettre →'}
            </button>
          </div>

          {/* Danger zone */}
          <div className="border border-red-200 rounded-2xl p-4 bg-red-50">
            <p className="text-xs font-medium text-red-700 mb-2">Zone dangereuse</p>
            <p className="text-xs text-red-600 mb-3">La suppression est définitive et irréversible.</p>
            <button onClick={handleDelete} disabled={loading}
              className="text-xs bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50">
              Supprimer cette annonce
            </button>
          </div>
        </div>
      )}
    </div>
  )
}



