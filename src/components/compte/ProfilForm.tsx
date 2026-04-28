'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile, Reseau } from '@/lib/types'
import { updateProfil } from '@/app/compte/profil/actions'
import LocationPicker from '@/components/LocationPicker'

interface Props {
  profile: Profile
  userEmail: string
}

export default function ProfilForm({ profile, userEmail }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    prenom:    profile.prenom ?? '',
    nom:       profile.nom ?? '',
    telephone: profile.telephone ?? '',
    ville:     profile.ville ?? '',
    adresse:   profile.adresse ?? '',
    lat:       profile.lat ?? 0,
    lng:       profile.lng ?? 0,
    agence:    profile.agence ?? '',
    siret:     profile.siret ?? '',
    site_web:  profile.site_web ?? '',
    bio:       profile.bio ?? '',
    reseau_id: profile.reseau_id ?? '',
  })
  const [loading, setLoading]     = useState(false)
  const [success, setSuccess]     = useState(false)
  const [error, setError]         = useState('')
  const [logoUrl, setLogoUrl]     = useState(profile.logo_url ?? '')
  const [logoLoading, setLogoLoading] = useState(false)
  const [logoError, setLogoError] = useState('')
  const [reseaux, setReseaux]     = useState<Reseau[]>([])

  useEffect(() => {
    if (profile.type !== 'pro') return
    supabase.from('reseaux').select('id, nom, slug, type_reseau').order('nom')
      .then(({ data }) => { if (data) setReseaux(data as Reseau[]) })
  }, [profile.type])

  function update(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function uploadLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { setLogoError('Fichier trop lourd (max 2 Mo)'); return }
    setLogoLoading(true); setLogoError('')
    const ext = file.name.split('.').pop()
    const path = `logos/${profile.id}/logo.${ext}`
    const { error: uploadErr } = await supabase.storage.from('photos-biens').upload(path, file, { upsert: true })
    if (uploadErr) { setLogoError(uploadErr.message); setLogoLoading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('photos-biens').getPublicUrl(path)
    await supabase.from('profiles').update({ logo_url: publicUrl }).eq('id', profile.id)
    setLogoUrl(publicUrl)
    setLogoLoading(false)
  }

  async function removeLogo() {
    await supabase.from('profiles').update({ logo_url: null }).eq('id', profile.id)
    setLogoUrl('')
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(''); setSuccess(false)
    try {
      await updateProfil({
        prenom: form.prenom, nom: form.nom,
        telephone: form.telephone || null,
        ville: form.ville || null,
        adresse: form.adresse || null,
        lat: form.lat || null,
        lng: form.lng || null,
        agence: form.agence || null, siret: form.siret || null,
        site_web: form.site_web || null, bio: form.bio || null,
        reseau_id: form.reseau_id || null,
      })
      setSuccess(true)
      router.refresh()
    } catch (err: any) {
      setError(err.message ?? 'Erreur lors de la sauvegarde')
    }
    setLoading(false)
  }

  const inputCls = "w-full border border-navy/15 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors bg-white"
  const labelCls = "block text-xs font-medium text-navy/55 mb-1.5"

  return (
    <form onSubmit={save} className="space-y-5">
      {/* Email (lecture seule) */}
      <div className="bg-navy/03 rounded-xl p-4 border border-navy/08">
        <label className={labelCls}>Email</label>
        <div className="text-sm text-navy/60">{userEmail}</div>
        <p className="text-[11px] text-navy/35 mt-1">L'email ne peut pas être modifié ici.</p>
      </div>

      {/* Identité */}
      <div className="bg-white rounded-2xl border border-navy/08 p-5 space-y-4">
        <h2 className="text-sm font-medium text-navy/50 uppercase tracking-wider">Identité</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Prénom *</label>
            <input type="text" required value={form.prenom} onChange={e => update('prenom', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Nom *</label>
            <input type="text" required value={form.nom} onChange={e => update('nom', e.target.value)} className={inputCls} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Téléphone</label>
            <input type="tel" value={form.telephone} onChange={e => update('telephone', e.target.value)} placeholder="06 00 00 00 00" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Ville</label>
            <input type="text" value={form.ville} onChange={e => update('ville', e.target.value)} placeholder="Paris" className={inputCls} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Bio</label>
          <textarea value={form.bio} onChange={e => update('bio', e.target.value)} rows={3} placeholder="Quelques mots sur vous…" className={inputCls + ' resize-none'} />
        </div>
      </div>

      {/* Infos pro */}
      {profile.type === 'pro' && (
        <div className="bg-white rounded-2xl border border-navy/08 p-5 space-y-4">
          <h2 className="text-sm font-medium text-navy/50 uppercase tracking-wider">Informations professionnelles</h2>
          {/* Réseau / enseigne */}
          <div>
            <label className={labelCls}>Réseau ou enseigne <span className="text-navy/30 font-normal">(optionnel)</span></label>
            <select value={form.reseau_id} onChange={e => update('reseau_id', e.target.value)} className={inputCls}>
              <option value="">— Indépendant</option>
              {reseaux.map(r => (
                <option key={r.id} value={r.id}>{r.nom}</option>
              ))}
            </select>
            <p className="text-[11px] text-navy/35 mt-1">
              Si votre réseau n'est pas listé, contactez un administrateur pour l'ajouter.
            </p>
          </div>

          <div>
            <label className={labelCls}>Nom de l'agence <span className="text-navy/30 font-normal">(optionnel si réseau sélectionné)</span></label>
            <input type="text" value={form.agence} onChange={e => update('agence', e.target.value)} placeholder="Agence Dupont Immobilier" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>SIRET</label>
              <input type="text" value={form.siret} onChange={e => update('siret', e.target.value)} placeholder="123 456 789 00010" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Site web</label>
              <input type="url" value={form.site_web} onChange={e => update('site_web', e.target.value)} placeholder="https://monagence.fr" className={inputCls} />
            </div>
          </div>

          {/* Localisation agence */}
          <div>
            <label className={labelCls}>Adresse de l'agence <span className="text-navy/30 font-normal">(optionnel)</span></label>
            <p className="text-[11px] text-navy/35 mb-2">Permet aux visiteurs de localiser votre agence sur une carte.</p>
            <div className="rounded-xl overflow-hidden border border-navy/12" style={{ height: 260 }}>
              <LocationPicker
                adresse={form.adresse}
                ville={form.ville}
                codePostal=""
                lat={form.lat}
                lng={form.lng}
                onChange={fields => setForm(f => ({
                  ...f,
                  ...(fields.adresse !== undefined ? { adresse: fields.adresse } : {}),
                  ...(fields.ville    !== undefined ? { ville:   fields.ville }   : {}),
                  ...(fields.lat      !== undefined ? { lat:     fields.lat }     : {}),
                  ...(fields.lng      !== undefined ? { lng:     fields.lng }     : {}),
                }))}
              />
            </div>
            {form.lat !== 0 && (
              <p className="text-[11px] text-green-600 mt-1.5">
                ✓ Position enregistrée · {form.lat.toFixed(5)}, {form.lng.toFixed(5)}
                <button type="button" onClick={() => setForm(f => ({ ...f, adresse: '', lat: 0, lng: 0 }))}
                  className="ml-2 text-navy/35 hover:text-red-500 transition-colors">Effacer</button>
              </p>
            )}
          </div>

          {/* Logo agence */}
          <div>
            <label className={labelCls}>Logo de l'agence</label>
            <div className="flex items-center gap-4">
              {/* Aperçu */}
              <div className="w-20 h-20 rounded-xl border border-navy/10 bg-[#F8FAFC] flex items-center justify-center overflow-hidden flex-shrink-0">
                {logoUrl
                  ? <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                  : <span className="text-2xl text-navy/20">🏢</span>
                }
              </div>
              {/* Actions */}
              <div className="flex-1">
                <label className="block cursor-pointer">
                  <span className="inline-flex items-center gap-2 border border-navy/15 rounded-lg px-4 py-2 text-sm text-navy/60 hover:border-navy/30 transition-colors">
                    {logoLoading ? 'Chargement…' : logoUrl ? '🔄 Changer le logo' : '📁 Choisir un logo'}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/svg+xml"
                    onChange={uploadLogo}
                    disabled={logoLoading}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-navy/35 mt-1.5">JPG, PNG, WebP ou SVG · Max 2 Mo</p>
                {logoUrl && (
                  <button type="button" onClick={removeLogo} className="text-[11px] text-red-400 hover:text-red-600 mt-1 transition-colors">
                    Supprimer le logo
                  </button>
                )}
                {logoError && <p className="text-[11px] text-red-500 mt-1">{logoError}</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mot de passe */}
      <div className="bg-white rounded-2xl border border-navy/08 p-5">
        <h2 className="text-sm font-medium text-navy/50 uppercase tracking-wider mb-3">Mot de passe</h2>
        <p className="text-xs text-navy/50 mb-3">Pour changer votre mot de passe, un email de réinitialisation vous sera envoyé.</p>
        <button type="button"
          onClick={async () => {
            await supabase.auth.resetPasswordForEmail(userEmail)
            alert('Email de réinitialisation envoyé !')
          }}
          className="text-sm text-primary hover:underline font-medium">
          Envoyer un lien de réinitialisation →
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3">✓ Profil mis à jour avec succès</div>}

      <button type="submit" disabled={loading}
        className="w-full bg-navy text-white rounded-xl py-3 text-sm font-medium hover:bg-primary transition-colors disabled:opacity-50">
        {loading ? 'Enregistrement…' : 'Enregistrer les modifications'}
      </button>
    </form>
  )
}



