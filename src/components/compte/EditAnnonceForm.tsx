'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { BienType, BienCategorie, DpeClasse, Profile } from '@/lib/types'
import LocationPicker from '@/components/LocationPicker'

interface Photo { id: string; url: string; storage_path: string; ordre: number; principale: boolean }

interface Props {
  bien: any
  photos: Photo[]
  profile: Profile
  planPhotosMax?: number   // limite photos du plan (live depuis DB)
}

const CATEGORIES: { value: BienCategorie; label: string; icon: string }[] = [
  // Résidentiel
  { value: 'appartement',           label: 'Appartement',      icon: '🏢' },
  { value: 'maison',                label: 'Maison',            icon: '🏠' },
  { value: 'studio',                label: 'Studio / T1',       icon: '🛏️' },
  { value: 'villa',                 label: 'Villa',             icon: '🏡' },
  { value: 'chalet',                label: 'Chalet',            icon: '🏔️' },
  { value: 'loft',                  label: 'Loft / Atelier',    icon: '🏭' },
  { value: 'colocation',            label: 'Colocation',        icon: '👥' },
  // Commercial / Pro
  { value: 'bureau',                label: 'Bureau',            icon: '🏗️' },
  { value: 'local',                 label: 'Local comm.',       icon: '🏪' },
  { value: 'restaurant',            label: 'Restaurant',        icon: '🍽️' },
  { value: 'entrepot',              label: 'Entrepôt',          icon: '🏭' },
  { value: 'hotel',                 label: 'Hôtel',             icon: '🏨' },
  { value: 'fonds_commerce',        label: 'Fonds commerce',    icon: '💼' },
  { value: 'murs_commerciaux',      label: 'Murs commerciaux',  icon: '🏬' },
  // Foncier
  { value: 'terrain',               label: 'Terrain',           icon: '🌱' },
  { value: 'terrain_agricole',      label: 'Terrain agricole',  icon: '🌾' },
  { value: 'terrain_constructible', label: 'Terrain construct.', icon: '🏗️' },
  // Autre
  { value: 'parking',               label: 'Parking',           icon: '🅿️' },
]

const LICENCES_RESTO = [
  { value: '', label: 'Sans licence' },
  { value: 'II',  label: 'Licence II (bières, vins, cidres)' },
  { value: 'III', label: 'Licence III (bières + alcools fermentés)' },
  { value: 'IV',  label: 'Licence IV (tous alcools)' },
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
// Couleurs officielles GES (bleu clair → bleu très foncé, comme sur la page annonce)
const GES_COLORS: Record<DpeClasse, string> = {
  A:'#9DD4E8', B:'#76B8D8', C:'#4D9DC4',
  D:'#2E7BAE', E:'#1B5C94', F:'#0F3D72', G:'#071E45'
}

const CAT_GROUPS = [
  { label: 'Résidentiel',      values: ['appartement','maison','studio','villa','chalet','loft','colocation'] },
  { label: 'Commercial / Pro', values: ['bureau','local','restaurant','entrepot','hotel','fonds_commerce','murs_commerciaux'] },
  { label: 'Foncier',          values: ['terrain','terrain_agricole','terrain_constructible'] },
  { label: 'Autre',            values: ['parking'] },
]

export default function EditAnnonceForm({ bien, photos: initialPhotos, profile, planPhotosMax }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const photoLimit = planPhotosMax ?? 10

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
    // Champs restaurant
    licence_restaurant: bien.licence_restaurant ?? '',
    couverts:           String(bien.couverts ?? ''),
    fonds_commerce:     bien.fonds_commerce ?? false,
    cuisine_pro:        bien.cuisine_pro ?? false,
    terrasse_ext:       bien.terrasse_ext ?? false,
    // Champs hôtel
    nb_chambres_hotel:  String(bien.nb_chambres_hotel ?? ''),
    nb_etoiles:         String(bien.nb_etoiles ?? ''),
    // Champs colocation
    nb_colocataires:    String(bien.nb_colocataires ?? ''),
    // Universal category fields
    type_chauffage:     bien.type_chauffage ?? '',
    exposition:         bien.exposition ?? '',
    charges_copro:      String(bien.charges_copro ?? ''),
    // Colocation extras
    loyer_par_chambre:  String(bien.loyer_par_chambre ?? ''),
    charges_incluses:   bien.charges_incluses ?? false,
    // Bureau / Local
    open_space:         bien.open_space ?? false,
    nb_postes_travail:  String(bien.nb_postes_travail ?? ''),
    bail_commercial:    bien.bail_commercial ?? false,
    droit_au_bail:      String(bien.droit_au_bail ?? ''),
    // Entrepôt
    hauteur_sous_plafond: String(bien.hauteur_sous_plafond ?? ''),
    quai_chargement:    bien.quai_chargement ?? false,
    porte_sectionnelle: bien.porte_sectionnelle ?? false,
    surface_bureau_incluse: String(bien.surface_bureau_incluse ?? ''),
    // Fonds de commerce
    chiffre_affaires:   String(bien.chiffre_affaires ?? ''),
    loyer_annuel:       String(bien.loyer_annuel ?? ''),
    duree_bail_restant: String(bien.duree_bail_restant ?? ''),
    effectif:           String(bien.effectif ?? ''),
    // Murs commerciaux
    bail_en_cours:      bien.bail_en_cours ?? false,
    rendement_locatif:  String(bien.rendement_locatif ?? ''),
    // Terrains
    viabilise:          bien.viabilise ?? false,
    nature_terrain:     bien.nature_terrain ?? '',
    zone_plu:           bien.zone_plu ?? '',
    // Parking
    type_parking:       bien.type_parking ?? '',
    acces_24h:          bien.acces_24h ?? false,
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
    const canAdd = photoLimit - totalExisting - newPhotos.length
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
          // Champs restaurant
          ...(form.categorie === 'restaurant' ? {
            licence_restaurant: form.licence_restaurant || null,
            couverts:           form.couverts ? parseInt(form.couverts) : null,
            fonds_commerce:     form.fonds_commerce,
            cuisine_pro:        form.cuisine_pro,
            terrasse_ext:       form.terrasse_ext,
          } : {}),
          // Champs hôtel
          ...(form.categorie === 'hotel' ? {
            nb_chambres_hotel: form.nb_chambres_hotel ? parseInt(form.nb_chambres_hotel) : null,
            nb_etoiles:        form.nb_etoiles ? parseInt(form.nb_etoiles) : null,
          } : {}),
          // Champs colocation
          ...(form.categorie === 'colocation' ? {
            nb_colocataires: form.nb_colocataires ? parseInt(form.nb_colocataires) : null,
            loyer_par_chambre: form.loyer_par_chambre ? parseInt(form.loyer_par_chambre) : null,
            charges_incluses: form.charges_incluses,
          } : {}),
          // Champs universels chauffage/exposition/charges_copro
          ...(['appartement','maison','studio','villa','chalet','loft','colocation','bureau'].includes(form.categorie) ? {
            type_chauffage: form.type_chauffage || null,
          } : {}),
          ...(['appartement','studio','loft'].includes(form.categorie) ? {
            charges_copro: form.charges_copro ? parseInt(form.charges_copro) : null,
          } : {}),
          ...(['appartement','maison','studio','villa','chalet','loft','colocation'].includes(form.categorie) ? {
            exposition: form.exposition || null,
          } : {}),
          // Champs bureau
          ...(form.categorie === 'bureau' ? {
            open_space: form.open_space,
            nb_postes_travail: form.nb_postes_travail ? parseInt(form.nb_postes_travail) : null,
            bail_commercial: form.bail_commercial,
          } : {}),
          // Champs local
          ...(form.categorie === 'local' ? {
            droit_au_bail: form.droit_au_bail ? parseInt(form.droit_au_bail) : null,
            bail_commercial: form.bail_commercial,
          } : {}),
          // Champs entrepôt
          ...(form.categorie === 'entrepot' ? {
            hauteur_sous_plafond: form.hauteur_sous_plafond ? parseFloat(form.hauteur_sous_plafond) : null,
            quai_chargement: form.quai_chargement,
            porte_sectionnelle: form.porte_sectionnelle,
            surface_bureau_incluse: form.surface_bureau_incluse ? parseInt(form.surface_bureau_incluse) : null,
          } : {}),
          // Champs fonds de commerce
          ...(form.categorie === 'fonds_commerce' ? {
            chiffre_affaires: form.chiffre_affaires ? parseInt(form.chiffre_affaires) : null,
            loyer_annuel: form.loyer_annuel ? parseInt(form.loyer_annuel) : null,
            duree_bail_restant: form.duree_bail_restant ? parseInt(form.duree_bail_restant) : null,
            effectif: form.effectif ? parseInt(form.effectif) : null,
            bail_commercial: form.bail_commercial,
          } : {}),
          // Champs murs commerciaux
          ...(form.categorie === 'murs_commerciaux' ? {
            bail_en_cours: form.bail_en_cours,
            rendement_locatif: form.rendement_locatif ? parseFloat(form.rendement_locatif) : null,
            loyer_annuel: form.loyer_annuel ? parseInt(form.loyer_annuel) : null,
            bail_commercial: form.bail_commercial,
          } : {}),
          // Champs terrains
          ...(['terrain','terrain_agricole','terrain_constructible'].includes(form.categorie) ? {
            viabilise: form.viabilise,
          } : {}),
          ...(form.categorie === 'terrain_agricole' ? {
            nature_terrain: form.nature_terrain || null,
          } : {}),
          ...(form.categorie === 'terrain_constructible' ? {
            zone_plu: form.zone_plu || null,
          } : {}),
          // Champs parking
          ...(form.categorie === 'parking' ? {
            type_parking: form.type_parking || null,
            acces_24h: form.acces_24h,
          } : {}),
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

            {/* Catégorie — groupée */}
            <div className="space-y-2">
              {CAT_GROUPS.map(group => (
                <div key={group.label}>
                  <p className="text-[9px] font-semibold text-navy/30 uppercase tracking-wider mb-1">{group.label}</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {CATEGORIES.filter(c => group.values.includes(c.value)).map(c => (
                      <button key={c.value} type="button" onClick={() => update('categorie', c.value)}
                        className={`py-1.5 px-1 rounded-lg text-xs border transition-all flex items-center gap-1.5 ${form.categorie === c.value ? 'bg-navy text-white border-navy' : 'bg-white text-navy/60 border-navy/15 hover:border-navy/30'}`}>
                        <span className="text-sm flex-shrink-0">{c.icon}</span>
                        <span className="font-medium leading-tight">{c.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
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
                      style={{ background: form.ges === d ? GES_COLORS[d] : '#f5f5f5' }}
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

          {/* ── Champs spécifiques restaurant ── */}
          {form.categorie === 'restaurant' && (
            <div className="bg-white rounded-2xl p-5 border border-amber-200 space-y-4">
              <h3 className="text-xs font-semibold text-amber-700 flex items-center gap-1.5">🍽️ Informations restaurant</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Licence alcool</label>
                  <select value={form.licence_restaurant} onChange={e => update('licence_restaurant', e.target.value)} className={inputCls}>
                    {LICENCES_RESTO.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Capacité (couverts)</label>
                  <input type="number" min="0" placeholder="40" value={form.couverts} onChange={e => update('couverts', e.target.value)} className={inputCls} />
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                {[
                  { field: 'fonds_commerce', label: 'Vente du fonds de commerce' },
                  { field: 'cuisine_pro',    label: 'Cuisine pro équipée' },
                  { field: 'terrasse_ext',   label: 'Terrasse extérieure (droits inclus)' },
                ].map(({ field, label }) => (
                  <label key={field} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={(form as any)[field]} onChange={e => update(field, e.target.checked)} className="accent-primary" />
                    <span className="text-sm text-navy/70">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* ── Champs spécifiques hôtel ── */}
          {form.categorie === 'hotel' && (
            <div className="bg-white rounded-2xl p-5 border border-blue-200 space-y-4">
              <h3 className="text-xs font-semibold text-blue-700 flex items-center gap-1.5">🏨 Informations hôtel</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Nombre de chambres</label>
                  <input type="number" min="0" placeholder="20" value={form.nb_chambres_hotel} onChange={e => update('nb_chambres_hotel', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Classement étoiles (1–5)</label>
                  <input type="number" min="1" max="5" placeholder="3" value={form.nb_etoiles} onChange={e => update('nb_etoiles', e.target.value)} className={inputCls} />
                </div>
              </div>
            </div>
          )}

          {/* ── Champs spécifiques colocation ── */}
          {form.categorie === 'colocation' && (
            <div className="bg-white rounded-2xl p-5 border border-purple-200 space-y-4">
              <h3 className="text-xs font-semibold text-purple-700 flex items-center gap-1.5">👥 Informations colocation</h3>
              <div>
                <label className={labelCls}>Nombre de colocataires max</label>
                <input type="number" min="2" placeholder="4" value={form.nb_colocataires} onChange={e => update('nb_colocataires', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Loyer par chambre (€/mois)</label>
                <input type="number" min="0" placeholder="450" value={form.loyer_par_chambre} onChange={e => update('loyer_par_chambre', e.target.value)} className={inputCls} />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={(form as any).charges_incluses} onChange={e => update('charges_incluses', e.target.checked)} className="accent-primary" />
                <span className="text-sm text-navy/70">Charges incluses</span>
              </label>
            </div>
          )}

          {/* ── Champs universels : chauffage / charges copro / exposition ── */}
          {['appartement','maison','studio','villa','chalet','loft','colocation','bureau'].includes(form.categorie) && (
            <div className="bg-white rounded-2xl p-5 border border-navy/08 space-y-4">
              <h3 className="text-xs font-medium text-navy/50 uppercase tracking-wider">Informations complémentaires</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Type de chauffage</label>
                  <select value={form.type_chauffage} onChange={e => update('type_chauffage', e.target.value)} className={inputCls}>
                    <option value="">— Non précisé —</option>
                    <option value="electrique">Électrique</option>
                    <option value="gaz">Gaz</option>
                    <option value="pac">PAC (pompe à chaleur)</option>
                    <option value="fioul">Fioul</option>
                    <option value="bois">Bois / Pellets</option>
                    <option value="collectif">Collectif / Réseau de chaleur</option>
                  </select>
                </div>
                {['appartement','studio','loft'].includes(form.categorie) && (
                  <div>
                    <label className={labelCls}>Charges de copropriété (€/mois)</label>
                    <input type="number" min="0" placeholder="150" value={form.charges_copro} onChange={e => update('charges_copro', e.target.value)} className={inputCls} />
                  </div>
                )}
                {['appartement','maison','studio','villa','chalet','loft','colocation'].includes(form.categorie) && (
                  <div>
                    <label className={labelCls}>Exposition</label>
                    <select value={form.exposition} onChange={e => update('exposition', e.target.value)} className={inputCls}>
                      <option value="">— Non précisé —</option>
                      <option value="N">Nord</option>
                      <option value="NE">Nord-Est</option>
                      <option value="E">Est</option>
                      <option value="SE">Sud-Est</option>
                      <option value="S">Sud</option>
                      <option value="SW">Sud-Ouest</option>
                      <option value="O">Ouest</option>
                      <option value="NO">Nord-Ouest</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Champs spécifiques bureau ── */}
          {form.categorie === 'bureau' && (
            <div className="bg-white rounded-2xl p-5 border border-blue-200 space-y-4">
              <h3 className="text-xs font-semibold text-blue-700 flex items-center gap-1.5">🏢 Informations bureau</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Nb postes de travail</label>
                  <input type="number" min="0" placeholder="10" value={form.nb_postes_travail} onChange={e => update('nb_postes_travail', e.target.value)} className={inputCls} />
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                {[
                  { key: 'open_space', label: 'Open space' },
                  { key: 'bail_commercial', label: 'Bail commercial' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={(form as any)[key]} onChange={e => update(key, e.target.checked)} className="accent-primary" />
                    <span className="text-sm text-navy/70">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* ── Champs spécifiques local commercial ── */}
          {form.categorie === 'local' && (
            <div className="bg-white rounded-2xl p-5 border border-blue-200 space-y-4">
              <h3 className="text-xs font-semibold text-blue-700 flex items-center gap-1.5">🏪 Informations local commercial</h3>
              <div>
                <label className={labelCls}>Droit au bail (€)</label>
                <input type="number" min="0" placeholder="15000" value={form.droit_au_bail} onChange={e => update('droit_au_bail', e.target.value)} className={inputCls} />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={(form as any).bail_commercial} onChange={e => update('bail_commercial', e.target.checked)} className="accent-primary" />
                <span className="text-sm text-navy/70">Bail commercial</span>
              </label>
            </div>
          )}

          {/* ── Champs spécifiques entrepôt ── */}
          {form.categorie === 'entrepot' && (
            <div className="bg-white rounded-2xl p-5 border border-orange-200 space-y-4">
              <h3 className="text-xs font-semibold text-orange-700 flex items-center gap-1.5">🏭 Informations entrepôt</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Hauteur sous plafond (m)</label>
                  <input type="number" min="0" step="0.1" placeholder="6.0" value={form.hauteur_sous_plafond} onChange={e => update('hauteur_sous_plafond', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Surface bureaux incluse (m²)</label>
                  <input type="number" min="0" placeholder="50" value={form.surface_bureau_incluse} onChange={e => update('surface_bureau_incluse', e.target.value)} className={inputCls} />
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                {[
                  { key: 'quai_chargement', label: 'Quai de chargement' },
                  { key: 'porte_sectionnelle', label: 'Porte sectionnelle' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={(form as any)[key]} onChange={e => update(key, e.target.checked)} className="accent-primary" />
                    <span className="text-sm text-navy/70">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* ── Champs spécifiques fonds de commerce ── */}
          {form.categorie === 'fonds_commerce' && (
            <div className="bg-white rounded-2xl p-5 border border-yellow-200 space-y-4">
              <h3 className="text-xs font-semibold text-yellow-700 flex items-center gap-1.5">💼 Informations fonds de commerce</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'chiffre_affaires', label: "Chiffre d'affaires (€/an)", placeholder: '200000' },
                  { key: 'loyer_annuel', label: 'Loyer annuel (€/an)', placeholder: '24000' },
                  { key: 'duree_bail_restant', label: 'Durée bail restant (années)', placeholder: '7' },
                  { key: 'effectif', label: 'Effectif (salariés)', placeholder: '5' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className={labelCls}>{label}</label>
                    <input type="number" min="0" placeholder={placeholder} value={(form as any)[key]} onChange={e => update(key, e.target.value)} className={inputCls} />
                  </div>
                ))}
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={(form as any).bail_commercial} onChange={e => update('bail_commercial', e.target.checked)} className="accent-primary" />
                <span className="text-sm text-navy/70">Bail commercial</span>
              </label>
            </div>
          )}

          {/* ── Champs spécifiques murs commerciaux ── */}
          {form.categorie === 'murs_commerciaux' && (
            <div className="bg-white rounded-2xl p-5 border border-indigo-200 space-y-4">
              <h3 className="text-xs font-semibold text-indigo-700 flex items-center gap-1.5">🏬 Informations murs commerciaux</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Loyer annuel (€/an)</label>
                  <input type="number" min="0" placeholder="24000" value={form.loyer_annuel} onChange={e => update('loyer_annuel', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Rendement locatif (%)</label>
                  <input type="number" min="0" step="0.1" placeholder="5.5" value={form.rendement_locatif} onChange={e => update('rendement_locatif', e.target.value)} className={inputCls} />
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                {[
                  { key: 'bail_en_cours', label: 'Bail en cours' },
                  { key: 'bail_commercial', label: 'Bail commercial' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={(form as any)[key]} onChange={e => update(key, e.target.checked)} className="accent-primary" />
                    <span className="text-sm text-navy/70">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* ── Champs spécifiques terrains ── */}
          {['terrain','terrain_agricole','terrain_constructible'].includes(form.categorie) && (
            <div className="bg-white rounded-2xl p-5 border border-green-200 space-y-4">
              <h3 className="text-xs font-semibold text-green-700 flex items-center gap-1.5">🌱 Informations terrain</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={(form as any).viabilise} onChange={e => update('viabilise', e.target.checked)} className="accent-primary" />
                <span className="text-sm text-navy/70">Terrain viabilisé</span>
              </label>
              {form.categorie === 'terrain_agricole' && (
                <div>
                  <label className={labelCls}>Nature du terrain</label>
                  <select value={form.nature_terrain} onChange={e => update('nature_terrain', e.target.value)} className={inputCls}>
                    <option value="">— Non précisé —</option>
                    <option value="terres">Terres arables</option>
                    <option value="prairies">Prairies</option>
                    <option value="bois">Bois / Forêt</option>
                    <option value="vignes">Vignes</option>
                  </select>
                </div>
              )}
              {form.categorie === 'terrain_constructible' && (
                <div>
                  <label className={labelCls}>Zone PLU</label>
                  <input type="text" placeholder="Ex: UA, UB, AU, N" value={form.zone_plu} onChange={e => update('zone_plu', e.target.value)} className={inputCls} />
                </div>
              )}
            </div>
          )}

          {/* ── Champs spécifiques parking ── */}
          {form.categorie === 'parking' && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 space-y-4">
              <h3 className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">🅿️ Informations parking</h3>
              <div>
                <label className={labelCls}>Type de parking</label>
                <select value={form.type_parking} onChange={e => update('type_parking', e.target.value)} className={inputCls}>
                  <option value="">— Non précisé —</option>
                  <option value="box_ferme">Box fermé</option>
                  <option value="place_ouverte">Place ouverte</option>
                  <option value="souterrain">Parking souterrain</option>
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={(form as any).acces_24h} onChange={e => update('acces_24h', e.target.checked)} className="accent-primary" />
                <span className="text-sm text-navy/70">Accès 24h/24</span>
              </label>
            </div>
          )}

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
            <p className="text-xs text-navy/40 mb-4">{totalPhotos}/{photoLimit} photos</p>

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
            {totalPhotos < photoLimit && (
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



