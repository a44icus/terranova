'use client'

import { useState, useTransition } from 'react'
import { createReseau, updateReseau, deleteReseau } from './actions'
import { createClient } from '@/lib/supabase/client'
import type { TypeReseau } from '@/lib/types'

const TYPE_OPTIONS: { value: TypeReseau; label: string }[] = [
  { value: 'franchise',   label: 'Franchise' },
  { value: 'mandataires', label: 'Réseau de mandataires' },
  { value: 'groupement',  label: 'Groupement' },
  { value: 'enseigne',    label: 'Enseigne nationale' },
]

interface ReseauConnu {
  nom: string
  type: TypeReseau
  site?: string
}

const RESEAUX_CONNUS: { groupe: string; items: ReseauConnu[] }[] = [
  {
    groupe: 'Franchises',
    items: [
      { nom: 'Century 21',               type: 'franchise',   site: 'https://www.century21.fr' },
      { nom: 'ERA Immobilier',            type: 'franchise',   site: 'https://www.era-immobilier.fr' },
      { nom: 'Guy Hoquet',               type: 'franchise',   site: 'https://www.guy-hoquet.com' },
      { nom: 'Laforêt Immobilier',        type: 'franchise',   site: 'https://www.laforet.com' },
      { nom: 'Stéphane Plaza Immobilier', type: 'franchise',   site: 'https://www.stephaneplaza.com' },
      { nom: 'Nestenn',                  type: 'franchise',   site: 'https://www.nestenn.com' },
      { nom: "L'Adresse",                type: 'franchise',   site: 'https://www.ladresse.net' },
      { nom: 'Arthurimmo',               type: 'franchise',   site: 'https://www.arthurimmo.com' },
      { nom: 'Solvimo',                  type: 'franchise',   site: 'https://www.solvimo.com' },
      { nom: 'Citya Immobilier',         type: 'franchise',   site: 'https://www.citya.com' },
    ],
  },
  {
    groupe: 'Réseaux de mandataires',
    items: [
      { nom: 'iAd Immobilier',           type: 'mandataires', site: 'https://www.iadfrance.fr' },
      { nom: 'Capifrance',               type: 'mandataires', site: 'https://www.capifrance.fr' },
      { nom: 'Optimhome',                type: 'mandataires', site: 'https://www.optimhome.com' },
      { nom: 'Efficity',                 type: 'mandataires', site: 'https://www.efficity.com' },
      { nom: 'Safti',                    type: 'mandataires', site: 'https://www.safti.fr' },
      { nom: 'Human Immobilier',         type: 'mandataires', site: 'https://www.human-immobilier.fr' },
      { nom: 'Expertimo',                type: 'mandataires', site: 'https://www.expertimo.fr' },
      { nom: 'Megagence',                type: 'mandataires', site: 'https://www.megagence.com' },
      { nom: '3G Immo',                  type: 'mandataires', site: 'https://www.3gimmo.com' },
      { nom: 'Rezoximo',                 type: 'mandataires', site: 'https://www.rezoximo.com' },
      { nom: 'BL Agents Immobilier',     type: 'mandataires', site: 'https://www.blagentsimmobilier.com' },
      { nom: 'Proprioo',                 type: 'mandataires', site: 'https://www.proprioo.fr' },
      { nom: 'Réseau Expert Immobilier', type: 'mandataires' },
    ],
  },
  {
    groupe: 'Groupements & Coopératives',
    items: [
      { nom: 'Orpi',                     type: 'groupement',  site: 'https://www.orpi.com' },
      { nom: 'Square Habitat',           type: 'groupement',  site: 'https://www.square-habitat.fr' },
      { nom: 'FNAIM',                    type: 'groupement',  site: 'https://www.fnaim.fr' },
    ],
  },
  {
    groupe: 'Enseignes nationales',
    items: [
      { nom: 'Nexity',                   type: 'enseigne',    site: 'https://www.nexity.fr' },
      { nom: 'Foncia',                   type: 'enseigne',    site: 'https://fr.foncia.com' },
      { nom: 'BNP Paribas Real Estate',  type: 'enseigne',    site: 'https://realestate.bnpparibas.fr' },
      { nom: 'Crédit Agricole Immobilier', type: 'enseigne',  site: 'https://www.ca-immobilier.fr' },
      { nom: 'Bouygues Immobilier',      type: 'enseigne',    site: 'https://www.bouygues-immobilier.com' },
      { nom: 'Kaufman & Broad',          type: 'enseigne',    site: 'https://www.k-et-b.fr' },
      { nom: 'LCL Immobilier',           type: 'enseigne',    site: 'https://www.lcl.fr/immobilier' },
    ],
  },
]

const ALL_RESEAUX_CONNUS = RESEAUX_CONNUS.flatMap(g => g.items)

interface Reseau {
  id: string
  nom: string
  slug: string
  logo_url: string | null
  description: string | null
  site_web: string | null
  type_reseau: TypeReseau
  _count?: number
}

interface Props {
  reseaux: Reseau[]
}

const EMPTY_FORM = { nom: '', type_reseau: 'enseigne' as TypeReseau, description: '', site_web: '', logo_url: '' }

export default function ReseauxClient({ reseaux: initial }: Props) {
  const [reseaux, setReseaux] = useState(initial)
  const [showCreate, setShowCreate] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [nomSelectionne, setNomSelectionne] = useState('')
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const [logoLoading, setLogoLoading] = useState(false)
  const [logoError, setLogoError] = useState('')
  const supabase = createClient()

  async function uploadLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { setLogoError('Fichier trop lourd (max 2 Mo)'); return }
    setLogoLoading(true); setLogoError('')
    const ext = file.name.split('.').pop()
    const folder = editId ?? `tmp-${Date.now()}`
    const path = `reseaux/${folder}/logo.${ext}`
    const { error: uploadErr } = await supabase.storage.from('photos-biens').upload(path, file, { upsert: true })
    if (uploadErr) { setLogoError(uploadErr.message); setLogoLoading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('photos-biens').getPublicUrl(path)
    update('logo_url', publicUrl)
    setLogoLoading(false)
  }

  function update(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  function handleNomSelect(val: string) {
    setNomSelectionne(val)
    if (val === '__custom__') {
      setForm(f => ({ ...f, nom: '' }))
      return
    }
    const connu = ALL_RESEAUX_CONNUS.find(r => r.nom === val)
    if (connu) {
      setForm(f => ({
        ...f,
        nom: connu.nom,
        type_reseau: connu.type,
        site_web: f.site_web || connu.site || '',
      }))
    }
  }

  function openCreate() {
    setEditId(null)
    setForm(EMPTY_FORM)
    setNomSelectionne('')
    setShowCreate(true)
    setMsg(null)
  }

  function openEdit(r: Reseau) {
    setEditId(r.id)
    const estConnu = ALL_RESEAUX_CONNUS.some(x => x.nom === r.nom)
    setNomSelectionne(estConnu ? r.nom : '__custom__')
    setForm({
      nom: r.nom,
      type_reseau: r.type_reseau,
      description: r.description ?? '',
      site_web: r.site_web ?? '',
      logo_url: r.logo_url ?? '',
    })
    setShowCreate(true)
    setMsg(null)
  }

  function handleSubmit() {
    startTransition(async () => {
      const result = editId
        ? await updateReseau(editId, form)
        : await createReseau(form)

      if (result.ok) {
        setMsg({ type: 'ok', text: editId ? 'Réseau mis à jour.' : 'Réseau créé.' })
        setShowCreate(false)
        setEditId(null)
        // Refresh via router not available in client — just show success
        window.location.reload()
      } else {
        setMsg({ type: 'err', text: result.error ?? 'Erreur' })
      }
    })
  }

  function handleDelete(id: string, nom: string) {
    if (!confirm(`Supprimer le réseau "${nom}" ? Les agents affiliés deviendront indépendants.`)) return
    startTransition(async () => {
      const result = await deleteReseau(id)
      if (result.ok) {
        setReseaux(r => r.filter(x => x.id !== id))
      } else {
        alert(result.error)
      }
    })
  }

  const inputCls = "w-full border border-[#0F172A]/15 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#4F46E5] transition-colors bg-white"
  const labelCls = "block text-xs font-medium text-[#0F172A]/55 mb-1.5"

  return (
    <div>
      {/* Bouton créer */}
      <div className="flex justify-end mb-6">
        <button onClick={openCreate}
          className="bg-[#4F46E5] text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-[#4338CA] transition-colors">
          + Nouveau réseau
        </button>
      </div>

      {/* Formulaire création / édition */}
      {showCreate && (
        <div className="bg-white rounded-2xl border border-[#0F172A]/08 p-6 mb-6">
          <h2 className="text-sm font-semibold text-[#0F172A] mb-4">
            {editId ? 'Modifier le réseau' : 'Nouveau réseau'}
          </h2>

          {msg && (
            <div className={`text-sm rounded-xl px-4 py-3 mb-4 ${msg.type === 'ok' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {msg.text}
            </div>
          )}

          <div className="mb-4">
            <label className={labelCls}>Réseau *</label>
            <select
              value={nomSelectionne}
              onChange={e => handleNomSelect(e.target.value)}
              className={inputCls}
            >
              <option value="">— Choisir un réseau connu…</option>
              {RESEAUX_CONNUS.map(groupe => (
                <optgroup key={groupe.groupe} label={groupe.groupe}>
                  {groupe.items.map(r => (
                    <option key={r.nom} value={r.nom}>{r.nom}</option>
                  ))}
                </optgroup>
              ))}
              <option value="__custom__">✏️ Autre / Personnalisé</option>
            </select>
          </div>

          {/* Nom personnalisé + type — affichés après sélection */}
          {nomSelectionne && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className={labelCls}>Nom {nomSelectionne === '__custom__' ? '*' : ''}</label>
                <input
                  type="text"
                  value={form.nom}
                  onChange={e => update('nom', e.target.value)}
                  readOnly={nomSelectionne !== '__custom__'}
                  placeholder="Nom du réseau"
                  className={inputCls + (nomSelectionne !== '__custom__' ? ' bg-navy/03 text-navy/60 cursor-default' : '')}
                />
              </div>
              <div>
                <label className={labelCls}>Type</label>
                <select
                  value={form.type_reseau}
                  onChange={e => update('type_reseau', e.target.value)}
                  disabled={nomSelectionne !== '__custom__'}
                  className={inputCls + (nomSelectionne !== '__custom__' ? ' bg-navy/03 text-navy/60 cursor-default' : '')}
                >
                  {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                {nomSelectionne !== '__custom__' && (
                  <p className="text-[11px] text-navy/35 mt-1">Auto-détecté depuis la liste</p>
                )}
              </div>
            </div>
          )}

          <div className="mb-4">
            <label className={labelCls}>Description</label>
            <textarea value={form.description} onChange={e => update('description', e.target.value)}
              rows={2} placeholder="Présentation du réseau…" className={inputCls + ' resize-none'} />
          </div>

          <div className="mb-4">
            <label className={labelCls}>Site web</label>
            <input type="url" value={form.site_web} onChange={e => update('site_web', e.target.value)} placeholder="https://reseau.fr" className={inputCls} />
          </div>

          {/* Upload logo */}
          <div className="mb-6">
            <label className={labelCls}>Logo du réseau</label>
            <div className="flex items-center gap-4">
              {/* Aperçu */}
              <div className="w-20 h-20 rounded-xl border border-[#0F172A]/10 bg-[#F8FAFC] flex items-center justify-center overflow-hidden flex-shrink-0">
                {form.logo_url
                  ? <img src={form.logo_url} alt="Logo" className="w-full h-full object-contain p-1.5" />
                  : <span className="text-2xl text-[#0F172A]/20">🏢</span>
                }
              </div>
              {/* Actions */}
              <div className="flex-1 space-y-2">
                <label className="block cursor-pointer">
                  <span className="inline-flex items-center gap-2 border border-[#0F172A]/15 rounded-lg px-4 py-2 text-sm text-[#0F172A]/60 hover:border-[#4F46E5]/40 hover:text-[#4F46E5] transition-colors">
                    {logoLoading ? '⏳ Chargement…' : form.logo_url ? '🔄 Changer le logo' : '📁 Choisir un fichier'}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/svg+xml"
                    onChange={uploadLogo}
                    disabled={logoLoading}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-[#0F172A]/35">JPG, PNG, WebP ou SVG · Max 2 Mo</p>
                {form.logo_url && (
                  <button type="button" onClick={() => { update('logo_url', ''); setLogoError('') }}
                    className="text-[11px] text-red-400 hover:text-red-600 transition-colors">
                    Supprimer le logo
                  </button>
                )}
                {logoError && <p className="text-[11px] text-red-500">{logoError}</p>}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={isPending || !form.nom.trim() || !nomSelectionne}
              className="bg-[#4F46E5] text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-[#4338CA] transition-colors disabled:opacity-40"
            >
              {isPending ? 'Enregistrement…' : editId ? 'Mettre à jour' : 'Créer'}
            </button>
            <button onClick={() => { setShowCreate(false); setEditId(null); setMsg(null) }}
              className="text-sm text-[#0F172A]/50 px-4 py-2.5 rounded-xl hover:bg-[#0F172A]/05 transition-colors">
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Liste */}
      {reseaux.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#0F172A]/08 py-16 text-center">
          <p className="text-sm text-[#0F172A]/40">Aucun réseau créé — ajoutez Century 21, iAd, Orpi…</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reseaux.map(reseau => (
            <div key={reseau.id} className="bg-white rounded-2xl border border-[#0F172A]/08 p-5 flex items-center gap-4">
              {/* Logo */}
              <div className="w-12 h-12 rounded-xl border border-[#0F172A]/08 flex items-center justify-center flex-shrink-0 overflow-hidden bg-[#F8FAFC]">
                {reseau.logo_url
                  ? <img src={reseau.logo_url} alt={reseau.nom} className="w-full h-full object-contain p-1" />
                  : <span className="text-sm font-bold text-[#0F172A]/25">{reseau.nom.slice(0, 2).toUpperCase()}</span>
                }
              </div>

              {/* Infos */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-semibold text-[#0F172A]">{reseau.nom}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#4F46E5]/10 text-[#4F46E5] uppercase tracking-wide">
                    {TYPE_OPTIONS.find(o => o.value === reseau.type_reseau)?.label}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-[#0F172A]/35">
                  <span>slug : {reseau.slug}</span>
                  {(reseau._count ?? 0) > 0 && <span>· {reseau._count} agent{(reseau._count ?? 0) > 1 ? 's' : ''}</span>}
                  {reseau.site_web && <a href={reseau.site_web} target="_blank" rel="noopener noreferrer" className="text-[#4F46E5] hover:underline">{reseau.site_web.replace(/^https?:\/\//, '')}</a>}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <a href={`/agences/reseau/${reseau.slug}`} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-[#0F172A]/40 hover:text-[#0F172A] underline underline-offset-2">
                  Voir
                </a>
                <button onClick={() => openEdit(reseau)}
                  className="text-xs text-[#4F46E5] border border-[#4F46E5]/20 px-3 py-1.5 rounded-lg hover:bg-[#4F46E5]/05 transition-colors">
                  Modifier
                </button>
                <button onClick={() => handleDelete(reseau.id, reseau.nom)}
                  className="text-xs text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
