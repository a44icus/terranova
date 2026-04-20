'use client'

import { useState, useTransition } from 'react'
import { saveSettings } from './actions'
import type { SiteSettings } from '@/lib/siteSettings'

const TABS = [
  { id: 'site',        label: 'Site & Légal',     icon: '🌐' },
  { id: 'seo',         label: 'SEO & Tracking',   icon: '📊' },
  { id: 'carte',       label: 'Carte & POI',      icon: '🗺️' },
  { id: 'annonces',    label: 'Annonces',         icon: '🏠' },
  { id: 'emails',      label: 'Emails & Notifs',  icon: '📧' },
  { id: 'securite',    label: 'Sécurité & RGPD',  icon: '🔒' },
  { id: 'integrations',label: 'Intégrations',     icon: '🔗' },
]

const CATEGORIES = [
  { key: 'appartement', label: 'Appartement', icon: '🏛️' },
  { key: 'maison',      label: 'Maison',      icon: '🌿' },
  { key: 'terrain',     label: 'Terrain',     icon: '🌱' },
  { key: 'bureau',      label: 'Bureau',      icon: '🏢' },
  { key: 'parking',     label: 'Parking',     icon: '🅿️' },
  { key: 'local',       label: 'Local comm.', icon: '🏪' },
]

const POI_CATEGORIES_WEIGHTS = [
  { key: 'poi_poids_transport',    label: 'Transports',         icon: '🚇' },
  { key: 'poi_poids_sante',        label: 'Santé',              icon: '🏥' },
  { key: 'poi_poids_education',    label: 'Éducation',          icon: '🏫' },
  { key: 'poi_poids_commerce',     label: 'Commerce',           icon: '🛒' },
  { key: 'poi_poids_restauration', label: 'Restauration',       icon: '🍽️' },
  { key: 'poi_poids_loisirs',      label: 'Loisirs',            icon: '🌳' },
  { key: 'poi_poids_services',     label: 'Services',           icon: '🏦' },
  { key: 'poi_poids_beaute',       label: 'Beauté',             icon: '💆' },
] as const

// ── Petits composants ──────────────────────────────────────────

function SaveBar({ pending, saved, error }: { pending: boolean; saved: boolean; error: string }) {
  return (
    <div className="flex items-center gap-3 mt-8 pt-6 border-t border-[#0F172A]/08">
      <button type="submit" disabled={pending}
        className="bg-[#0F172A] text-white px-7 py-2.5 rounded-xl text-sm font-medium hover:bg-[#4F46E5] transition-colors disabled:opacity-50 flex items-center gap-2">
        {pending ? <><span className="animate-spin inline-block">⟳</span> Enregistrement…</> : '✓ Enregistrer'}
      </button>
      {saved && !pending && (
        <span className="text-sm text-emerald-600 font-medium flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
          Sauvegardé
        </span>
      )}
      {error && <span className="text-sm text-red-500">{error}</span>}
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#0F172A]/60 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-[#0F172A]/35 mt-1">{hint}</p>}
    </div>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...props}
      className={`w-full border border-[#0F172A]/15 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#4F46E5] transition-colors ${props.className ?? ''}`}
    />
  )
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea {...props} rows={props.rows ?? 2}
      className="w-full border border-[#0F172A]/15 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#4F46E5] transition-colors resize-none"
    />
  )
}

function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props}
      className="w-full border border-[#0F172A]/15 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#4F46E5] transition-colors bg-white">
      {children}
    </select>
  )
}

function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <button type="button" onClick={() => onChange(!checked)}
        className={`relative flex-shrink-0 mt-0.5 w-10 h-6 rounded-full transition-colors ${checked ? 'bg-[#4F46E5]' : 'bg-[#0F172A]/20'}`}>
        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${checked ? 'left-5' : 'left-1'}`} />
      </button>
      <div>
        <span className="text-sm text-[#0F172A]/70 group-hover:text-[#0F172A] transition-colors">{label}</span>
        {hint && <p className="text-[11px] text-[#0F172A]/35 mt-0.5">{hint}</p>}
      </div>
    </label>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-[#0F172A]/08 p-6 space-y-5">
      <h3 className="text-xs font-semibold text-[#0F172A]/40 uppercase tracking-wider">{title}</h3>
      {children}
    </div>
  )
}

function MonoInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...props}
      className={`w-full border border-[#0F172A]/15 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-[#4F46E5] transition-colors ${props.className ?? ''}`}
    />
  )
}

// ── Composant principal ────────────────────────────────────────

export default function SettingsForm({ settings }: { settings: SiteSettings }) {
  const [tab, setTab] = useState('site')
  const [s, setS] = useState<SiteSettings>(settings)
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  function set<K extends keyof SiteSettings>(key: K, val: SiteSettings[K]) {
    setS(prev => ({ ...prev, [key]: val }))
  }

  function toggleArray(key: 'categories_actives' | 'types_actifs', value: string) {
    setS(prev => {
      const arr = prev[key] as string[]
      return { ...prev, [key]: arr.includes(value) ? arr.filter(x => x !== value) : [...arr, value] }
    })
  }

  function submit(tabId: string) {
    return (e: React.FormEvent) => {
      e.preventDefault()
      startTransition(async () => {
        try {
          await saveSettings(tabId, s)
          setSaved(prev => ({ ...prev, [tabId]: true }))
          setErrors(prev => ({ ...prev, [tabId]: '' }))
          setTimeout(() => setSaved(prev => ({ ...prev, [tabId]: false })), 3000)
        } catch (err: any) {
          setErrors(prev => ({ ...prev, [tabId]: err.message }))
        }
      })
    }
  }

  const ok  = (t: string) => !!saved[t]
  const err = (t: string) => errors[t] ?? ''

  return (
    <div>
      {/* ── Tab bar ── */}
      <div className="flex flex-wrap gap-1 mb-8 bg-white rounded-2xl border border-[#0F172A]/08 p-1.5">
        {TABS.map(t => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              tab === t.id ? 'bg-[#0F172A] text-white shadow-sm' : 'text-[#0F172A]/50 hover:text-[#0F172A] hover:bg-[#0F172A]/04'
            }`}>
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════
          Tab : Site & Légal
      ════════════════════════════════════════════════════════ */}
      {tab === 'site' && (
        <form onSubmit={submit('site')} className="space-y-4">
          <Section title="Identité">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Nom du site">
                <Input value={s.nom_site} onChange={e => set('nom_site', e.target.value)} />
              </Field>
              <Field label="Slogan / tagline">
                <Input value={s.slogan} onChange={e => set('slogan', e.target.value)} />
              </Field>
              <Field label="Email de contact" hint="Affiché dans les pages légales">
                <Input type="email" value={s.email_contact} onChange={e => set('email_contact', e.target.value)} />
              </Field>
              <Field label="Téléphone support" hint="Affiché dans les emails transactionnels si renseigné">
                <Input value={s.support_telephone} onChange={e => set('support_telephone', e.target.value)} placeholder="+33 1 23 45 67 89" />
              </Field>
            </div>
          </Section>

          <Section title="Mode maintenance">
            <Toggle checked={s.maintenance} onChange={v => set('maintenance', v)}
              label="Activer le mode maintenance"
              hint="Redirige tous les visiteurs non-admin vers un message d'indisponibilité" />
            {s.maintenance && (
              <>
                <Field label="Message affiché">
                  <Textarea value={s.maintenance_message} onChange={e => set('maintenance_message', e.target.value)} />
                </Field>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                  ⚠ Mode maintenance <strong>actif</strong> — le site est inaccessible aux visiteurs
                </div>
              </>
            )}
          </Section>

          <Section title="Informations légales">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Raison sociale">
                <Input value={s.legal_raison_sociale} onChange={e => set('legal_raison_sociale', e.target.value)} placeholder="SAS Terranova" />
              </Field>
              <Field label="SIRET">
                <Input value={s.legal_siret} onChange={e => set('legal_siret', e.target.value)} placeholder="123 456 789 00012" />
              </Field>
              <Field label="Adresse du siège" hint="Pour les mentions légales">
                <Input value={s.legal_adresse} onChange={e => set('legal_adresse', e.target.value)} placeholder="1 rue de la Paix, 75001 Paris" />
              </Field>
              <Field label="Email DPO" hint="Délégué à la Protection des Données (RGPD)">
                <Input type="email" value={s.legal_dpo_email} onChange={e => set('legal_dpo_email', e.target.value)} placeholder="dpo@terranova.fr" />
              </Field>
            </div>
          </Section>

          <Section title="RGPD & Cookies">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Durée de conservation des données (jours)" hint="1095 = 3 ans (recommandé CNIL)">
                <Input type="number" min={30} value={s.rgpd_conservation_jours} onChange={e => set('rgpd_conservation_jours', parseInt(e.target.value) || 1095)} />
              </Field>
            </div>
            <Toggle checked={s.cookies_banniere} onChange={v => set('cookies_banniere', v)}
              label="Afficher la bannière de consentement aux cookies" />
            {s.cookies_banniere && (
              <Field label="Texte de la bannière">
                <Textarea value={s.cookies_texte} onChange={e => set('cookies_texte', e.target.value)} />
              </Field>
            )}
          </Section>

          <SaveBar pending={pending} saved={ok('site')} error={err('site')} />
        </form>
      )}

      {/* ════════════════════════════════════════════════════════
          Tab : SEO & Tracking
      ════════════════════════════════════════════════════════ */}
      {tab === 'seo' && (
        <form onSubmit={submit('seo')} className="space-y-4">
          <Section title="Métadonnées par défaut">
            <Field label="Meta description" hint="Utilisée sur les pages sans description propre (max 160 car.)">
              <Textarea value={s.meta_description} onChange={e => set('meta_description', e.target.value)} />
            </Field>
            <Field label="Image Open Graph par défaut" hint="Affichée lors d'un partage sur réseaux sociaux si la page n'a pas de photo">
              <Input value={s.og_image_url} onChange={e => set('og_image_url', e.target.value)} placeholder="https://terranova.fr/og-default.jpg" />
            </Field>
          </Section>

          <Section title="Google">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Google Analytics 4 — Measurement ID" hint="Format : G-XXXXXXXXXX">
                <MonoInput value={s.ga4_id} onChange={e => set('ga4_id', e.target.value)} placeholder="G-XXXXXXXXXX" />
              </Field>
              <Field label="Google Tag Manager — Container ID" hint="Format : GTM-XXXXXXX">
                <MonoInput value={s.gtm_id} onChange={e => set('gtm_id', e.target.value)} placeholder="GTM-XXXXXXX" />
              </Field>
            </div>
            {s.ga4_id && s.gtm_id && (
              <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
                ⚠ GA4 et GTM sont tous les deux renseignés. Si GTM injecte déjà GA4, laissez le Measurement ID vide pour éviter le double comptage.
              </div>
            )}
          </Section>

          <Section title="Meta Pixel (Facebook / Instagram)">
            <Field label="Pixel ID" hint="Trouvez-le dans Meta Events Manager">
              <MonoInput value={s.pixel_meta_id} onChange={e => set('pixel_meta_id', e.target.value)} placeholder="1234567890123456" />
            </Field>
          </Section>

          <Section title="Matomo (analytics auto-hébergé)">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="URL de votre instance Matomo" hint="Ex : https://stats.terranova.fr">
                <Input value={s.matomo_url} onChange={e => set('matomo_url', e.target.value)} placeholder="https://analytics.votre-domaine.fr" />
              </Field>
              <Field label="Site ID">
                <MonoInput value={s.matomo_site_id} onChange={e => set('matomo_site_id', e.target.value)} placeholder="1" />
              </Field>
            </div>
          </Section>

          <SaveBar pending={pending} saved={ok('seo')} error={err('seo')} />
        </form>
      )}

      {/* ════════════════════════════════════════════════════════
          Tab : Carte & POI
      ════════════════════════════════════════════════════════ */}
      {tab === 'carte' && (
        <form onSubmit={submit('carte')} className="space-y-4">
          <Section title="Position d'ouverture par défaut">
            <div className="grid grid-cols-3 gap-4">
              <Field label="Latitude" hint="Ex : 46.8 (France)">
                <Input type="number" step="0.0001" value={s.carte_lat} onChange={e => set('carte_lat', parseFloat(e.target.value) || 0)} />
              </Field>
              <Field label="Longitude" hint="Ex : 2.3522">
                <Input type="number" step="0.0001" value={s.carte_lng} onChange={e => set('carte_lng', parseFloat(e.target.value) || 0)} />
              </Field>
              <Field label="Zoom initial" hint="1 = monde · 18 = bâtiment">
                <Input type="number" min={1} max={20} value={s.carte_zoom} onChange={e => set('carte_zoom', parseInt(e.target.value) || 5)} />
              </Field>
            </div>
          </Section>

          <Section title="Style de carte par défaut">
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: 'street',    label: 'Plan',          hint: 'OpenStreetMap', icon: '🗺️' },
                { key: 'satellite', label: 'Satellite',     hint: 'Esri World',    icon: '🛰️' },
                { key: 'topo',      label: 'Topographique', hint: 'OpenTopoMap',   icon: '⛰️' },
              ].map(style => (
                <button key={style.key} type="button"
                  onClick={() => set('carte_style', style.key as SiteSettings['carte_style'])}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${s.carte_style === style.key ? 'border-[#4F46E5] bg-[#4F46E5]/05' : 'border-[#0F172A]/10 hover:border-[#0F172A]/25'}`}>
                  <span className="text-2xl">{style.icon}</span>
                  <span className="text-sm font-medium text-[#0F172A]">{style.label}</span>
                  <span className="text-[11px] text-[#0F172A]/40">{style.hint}</span>
                </button>
              ))}
            </div>
          </Section>

          <Section title="Limites & comportement">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Field label="Zoom minimum" hint="3 = Europe visible">
                <Input type="number" min={1} max={20} value={s.carte_zoom_min} onChange={e => set('carte_zoom_min', parseInt(e.target.value) || 3)} />
              </Field>
              <Field label="Zoom maximum" hint="20 = bâtiment précis">
                <Input type="number" min={1} max={20} value={s.carte_zoom_max} onChange={e => set('carte_zoom_max', parseInt(e.target.value) || 20)} />
              </Field>
              <Field label="Seuil clustering" hint="Nbre de biens au même endroit avant regroupement">
                <Input type="number" min={2} max={50} value={s.clustering_seuil} onChange={e => set('clustering_seuil', parseInt(e.target.value) || 8)} />
              </Field>
              <Field label="Biens max chargés" hint="Limite la requête Supabase (perf)">
                <Input type="number" min={100} max={10000} step={100} value={s.carte_biens_max} onChange={e => set('carte_biens_max', parseInt(e.target.value) || 2000)} />
              </Field>
            </div>
            <Toggle checked={s.heatmap_defaut} onChange={v => set('heatmap_defaut', v)}
              label="Activer la heatmap des prix par défaut à l'ouverture" />
            <Field label={`Opacité de la heatmap : ${Math.round(s.heatmap_opacite * 100)}%`}>
              <input type="range" min={0.1} max={1} step={0.05}
                value={s.heatmap_opacite}
                onChange={e => set('heatmap_opacite', parseFloat(e.target.value))}
                className="w-full accent-[#4F46E5]" />
            </Field>
          </Section>

          <Section title="Score quartier — poids des catégories POI">
            <p className="text-xs text-[#0F172A]/40">
              Plus le poids est élevé, plus cette catégorie influence le score final (sur 10).
              Total max indicatif : {Object.keys(POI_CATEGORIES_WEIGHTS).length * 2.5}.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {POI_CATEGORIES_WEIGHTS.map(cat => (
                <Field key={cat.key} label={`${cat.icon} ${cat.label}`}>
                  <Input type="number" min={0} max={5} step={0.5}
                    value={s[cat.key as keyof SiteSettings] as number}
                    onChange={e => set(cat.key as keyof SiteSettings, parseFloat(e.target.value) || 0 as any)} />
                </Field>
              ))}
            </div>
          </Section>

          <Section title="Score quartier — seuils d'affichage">
            <div className="grid grid-cols-3 gap-4">
              <Field label="🟢 Excellent — à partir de" hint="Score ≥ ce seuil = Excellent">
                <Input type="number" min={1} max={10} value={s.score_seuil_excellent}
                  onChange={e => set('score_seuil_excellent', parseInt(e.target.value) || 8)} />
              </Field>
              <Field label="🔵 Bon — à partir de" hint="Score ≥ ce seuil = Bon">
                <Input type="number" min={1} max={10} value={s.score_seuil_bon}
                  onChange={e => set('score_seuil_bon', parseInt(e.target.value) || 6)} />
              </Field>
              <Field label="🟡 Moyen — à partir de" hint="En dessous = Faible">
                <Input type="number" min={1} max={10} value={s.score_seuil_moyen}
                  onChange={e => set('score_seuil_moyen', parseInt(e.target.value) || 4)} />
              </Field>
            </div>
            <Field label="Distance max d'affichage des POI (mètres)" hint="Au-delà, le POI n'est pas affiché sur la carte du bien">
              <Input type="number" min={100} max={5000} step={100} value={s.poi_distance_max_m}
                onChange={e => set('poi_distance_max_m', parseInt(e.target.value) || 1000)} />
            </Field>
          </Section>

          <SaveBar pending={pending} saved={ok('carte')} error={err('carte')} />
        </form>
      )}

      {/* ════════════════════════════════════════════════════════
          Tab : Annonces
      ════════════════════════════════════════════════════════ */}
      {tab === 'annonces' && (
        <form onSubmit={submit('annonces')} className="space-y-4">
          <Section title="Modération">
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'manuelle', label: 'Modération manuelle', hint: 'Chaque annonce passe en attente avant publication', icon: '👁' },
                { key: 'auto',     label: 'Publication auto',    hint: 'Les annonces sont publiées immédiatement',         icon: '⚡' },
              ].map(m => (
                <button key={m.key} type="button"
                  onClick={() => set('moderation', m.key as SiteSettings['moderation'])}
                  className={`text-left p-4 rounded-xl border-2 transition-all ${s.moderation === m.key ? 'border-[#4F46E5] bg-[#4F46E5]/05' : 'border-[#0F172A]/10 hover:border-[#0F172A]/25'}`}>
                  <div className="flex items-center gap-2 mb-1"><span>{m.icon}</span><span className="text-sm font-semibold text-[#0F172A]">{m.label}</span></div>
                  <p className="text-xs text-[#0F172A]/50">{m.hint}</p>
                </button>
              ))}
            </div>
          </Section>

          <Section title="Durée, photos & affichage">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Field label="Durée de visibilité par défaut (jours)">
                <Input type="number" min={1} max={3650} value={s.expiration_defaut_jours}
                  onChange={e => set('expiration_defaut_jours', parseInt(e.target.value) || 30)} />
              </Field>
              <Field label="Photos max par upload" hint="Par session d'ajout">
                <Input type="number" min={1} max={100} value={s.photos_max_upload}
                  onChange={e => set('photos_max_upload', parseInt(e.target.value) || 20)} />
              </Field>
              <Field label="Surface min pour €/m²" hint="En dessous, le prix au m² n'est pas calculé">
                <Input type="number" min={1} value={s.surface_min_prix_m2}
                  onChange={e => set('surface_min_prix_m2', parseInt(e.target.value) || 10)} />
              </Field>
              <Field label="Devise" hint="Symbole affiché après les prix">
                <Input value={s.marche_devise} onChange={e => set('marche_devise', e.target.value)} placeholder="€" maxLength={3} />
              </Field>
            </div>
            <Toggle checked={s.marche_active} onChange={v => set('marche_active', v)}
              label="Activer la page Marché (/marche)"
              hint="Affiche les analyses de prix par ville. Désactiver masque le lien dans la navigation." />
          </Section>

          <Section title="Types d'annonces actifs">
            <div className="flex gap-3">
              {[
                { key: 'vente',    label: 'Vente',    color: '#4F46E5' },
                { key: 'location', label: 'Location', color: '#0891B2' },
              ].map(t => {
                const active = s.types_actifs.includes(t.key)
                return (
                  <button key={t.key} type="button"
                    onClick={() => toggleArray('types_actifs', t.key)}
                    className={`flex-1 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${active ? 'text-white' : 'text-[#0F172A]/50 border-[#0F172A]/10 hover:border-[#0F172A]/25'}`}
                    style={active ? { background: t.color, borderColor: t.color } : {}}>
                    {t.label}
                  </button>
                )
              })}
            </div>
          </Section>

          <Section title="Catégories disponibles">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORIES.map(cat => {
                const active = s.categories_actives.includes(cat.key)
                return (
                  <button key={cat.key} type="button"
                    onClick={() => toggleArray('categories_actives', cat.key)}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${active ? 'border-[#4F46E5] bg-[#4F46E5]/05 text-[#0F172A]' : 'border-[#0F172A]/10 text-[#0F172A]/35'}`}>
                    <span>{cat.icon}</span>{cat.label}
                    {active && <svg className="ml-auto w-3.5 h-3.5 text-[#4F46E5]" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>}
                  </button>
                )
              })}
            </div>
          </Section>

          <Section title="Messages & Contacts">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Délai de réponse affiché" hint="Ex : 24h, 2 jours — affiché sur la fiche annonce">
                <Input value={s.contact_delai_reponse} onChange={e => set('contact_delai_reponse', e.target.value)} placeholder="24h" />
              </Field>
              <Field label="Anti-spam : délai minimum entre deux messages (minutes)" hint="Un même visiteur ne peut envoyer qu'un message par ce délai">
                <Input type="number" min={0} max={60} value={s.contact_antispam_minutes}
                  onChange={e => set('contact_antispam_minutes', parseInt(e.target.value) || 0)} />
              </Field>
            </div>
            <Toggle checked={s.contact_copie_admin} onChange={v => set('contact_copie_admin', v)}
              label="Envoyer une copie de chaque message à l'email admin"
              hint="Requiert que l'email admin soit renseigné dans l'onglet Emails & Notifs" />
          </Section>

          <SaveBar pending={pending} saved={ok('annonces')} error={err('annonces')} />
        </form>
      )}

      {/* ════════════════════════════════════════════════════════
          Tab : Emails & Notifs
      ════════════════════════════════════════════════════════ */}
      {tab === 'emails' && (
        <form onSubmit={submit('emails')} className="space-y-4">
          <Section title="Expéditeur des emails">
            <div className="grid grid-cols-2 gap-5">
              <Field label="Nom de l'expéditeur" hint="Affiché dans la boîte mail">
                <Input value={s.email_expediteur_nom} onChange={e => set('email_expediteur_nom', e.target.value)} />
              </Field>
              <Field label="Adresse email d'envoi" hint="Doit être vérifiée dans votre service d'envoi">
                <Input type="email" value={s.email_expediteur} onChange={e => set('email_expediteur', e.target.value)} />
              </Field>
            </div>
          </Section>

          <Section title="Alertes de recherche">
            <div className="grid grid-cols-2 gap-5">
              <Field label="Nombre max d'alertes par utilisateur">
                <Input type="number" min={1} max={50} value={s.alertes_max_par_user}
                  onChange={e => set('alertes_max_par_user', parseInt(e.target.value) || 5)} />
              </Field>
              <Field label="Fréquence d'envoi">
                <Select value={s.alertes_frequence}
                  onChange={e => set('alertes_frequence', e.target.value as SiteSettings['alertes_frequence'])}>
                  <option value="instantane">Instantané — dès qu'une annonce est publiée</option>
                  <option value="quotidien">Quotidien — digest chaque matin</option>
                  <option value="hebdomadaire">Hebdomadaire — récap du lundi</option>
                </Select>
              </Field>
            </div>
          </Section>

          <Section title="Notifications administrateur">
            <Field label="Email admin" hint="Toutes les notifications ci-dessous sont envoyées à cette adresse">
              <Input type="email" value={s.notif_admin_email}
                onChange={e => set('notif_admin_email', e.target.value)} placeholder="admin@terranova.fr" />
            </Field>
            <div className="space-y-3 pt-1">
              <Toggle checked={s.notif_nouvelle_annonce} onChange={v => set('notif_nouvelle_annonce', v)}
                label="Nouvelle annonce soumise" hint="Reçu dès qu'un utilisateur soumet une annonce (mode modération manuelle)" />
              <Toggle checked={s.notif_nouveau_message} onChange={v => set('notif_nouveau_message', v)}
                label="Nouveau message de contact" hint="Copie de chaque message envoyé via un formulaire de contact" />
              <Toggle checked={s.notif_nouvelle_inscription} onChange={v => set('notif_nouvelle_inscription', v)}
                label="Nouvelle inscription" hint="Notifié dès qu'un nouveau compte est créé" />
              <Toggle checked={s.notif_resume_hebdo} onChange={v => set('notif_resume_hebdo', v)}
                label="Résumé hebdomadaire des stats" hint="Envoi automatique chaque lundi matin : vues, favoris, messages, inscriptions" />
            </div>
          </Section>

          <SaveBar pending={pending} saved={ok('emails')} error={err('emails')} />
        </form>
      )}

      {/* ════════════════════════════════════════════════════════
          Tab : Sécurité & RGPD
      ════════════════════════════════════════════════════════ */}
      {tab === 'securite' && (
        <form onSubmit={submit('securite')} className="space-y-4">
          <Section title="Inscriptions & accès">
            <div className="space-y-3">
              <Toggle checked={s.inscription_ouverte} onChange={v => set('inscription_ouverte', v)}
                label="Inscriptions ouvertes"
                hint="Désactiver = site en accès sur invitation uniquement" />
              <Toggle checked={s.email_verification} onChange={v => set('email_verification', v)}
                label="Vérification email obligatoire à l'inscription" />
              <Toggle checked={s.pro_autorise} onChange={v => set('pro_autorise', v)}
                label="Autoriser les comptes professionnels & agences" />
              <Toggle checked={s.tfa_obligatoire_pro} onChange={v => set('tfa_obligatoire_pro', v)}
                label="2FA obligatoire pour les comptes professionnels"
                hint="Les agences et pros devront activer l'authentification à deux facteurs" />
            </div>
            {!s.inscription_ouverte && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                ⚠ Les inscriptions sont <strong>fermées</strong>. Les nouveaux visiteurs ne pourront pas créer de compte.
              </div>
            )}
          </Section>

          <Section title="Sessions & rate limiting">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Durée de session (jours)" hint="Après ce délai, l'utilisateur est déconnecté automatiquement">
                <Input type="number" min={1} max={365} value={s.session_duree_jours}
                  onChange={e => set('session_duree_jours', parseInt(e.target.value) || 30)} />
              </Field>
              <Field label="Tentatives de connexion max avant blocage" hint="Blocage temporaire de 15 minutes après ce nombre d'échecs">
                <Input type="number" min={3} max={20} value={s.login_max_tentatives}
                  onChange={e => set('login_max_tentatives', parseInt(e.target.value) || 5)} />
              </Field>
            </div>
          </Section>

          <Section title="Restriction IP (admin)">
            <Field label="IP autorisées pour /admin" hint="Une IP par ligne. Laisser vide = accès sans restriction géographique. Ex : 82.23.45.67">
              <textarea
                value={s.admin_ip_whitelist}
                onChange={e => set('admin_ip_whitelist', e.target.value)}
                rows={4}
                placeholder={"82.23.45.67\n10.0.0.0/24"}
                className="w-full border border-[#0F172A]/15 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-[#4F46E5] resize-none"
              />
            </Field>
            {s.admin_ip_whitelist.trim() && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800">
                ℹ La restriction IP nécessite d'être appliquée dans le middleware Next.js (<code>src/middleware.ts</code>). La valeur est stockée ici pour référence.
              </div>
            )}
          </Section>

          <SaveBar pending={pending} saved={ok('securite')} error={err('securite')} />
        </form>
      )}

      {/* ════════════════════════════════════════════════════════
          Tab : Intégrations
      ════════════════════════════════════════════════════════ */}
      {tab === 'integrations' && (
        <form onSubmit={submit('integrations')} className="space-y-4">
          <Section title="Envoi d'emails (Resend)">
            <Field label="Clé API Resend" hint="Utilisée pour les emails transactionnels (alertes, contacts, confirmations)">
              <MonoInput type="password" value={s.integration_resend_key}
                onChange={e => set('integration_resend_key', e.target.value)} placeholder="re_xxxxxxxxxxxxxxxxx" />
            </Field>
            <div className="bg-[#0F172A]/03 rounded-xl p-4 text-xs text-[#0F172A]/50 space-y-1">
              <p><strong className="text-[#0F172A]/70">Alternative :</strong> vous pouvez aussi configurer la clé via la variable d'environnement <code className="bg-[#0F172A]/08 px-1 rounded">RESEND_API_KEY</code> dans votre <code>.env.local</code>.</p>
            </div>
          </Section>

          <Section title="Webhook sortant">
            <Field label="URL du webhook" hint="Appelée (POST JSON) à chaque nouvelle annonce publiée. Utile pour Zapier, Make, CRM…">
              <Input type="url" value={s.integration_webhook_url}
                onChange={e => set('integration_webhook_url', e.target.value)} placeholder="https://hooks.zapier.com/hooks/catch/..." />
            </Field>
            {s.integration_webhook_url && (
              <div className="text-xs text-[#0F172A]/50 bg-[#0F172A]/03 rounded-xl p-3">
                <strong>Payload envoyé :</strong>
                <pre className="mt-1 font-mono text-[11px]">{`{ "id": "...", "titre": "...", "ville": "...", "prix": 0, "type": "vente", "publie_at": "..." }`}</pre>
              </div>
            )}
          </Section>

          <Section title="API Demandes de Valeurs Foncières (DVF)">
            <Field label="URL de l'API DVF" hint="Utilisée pour les estimations et la page Marché">
              <Input value={s.integration_dvf_url}
                onChange={e => set('integration_dvf_url', e.target.value)} placeholder="https://api.dvf.etalab.gouv.fr" />
            </Field>
          </Section>

          <div className="bg-[#0F172A]/03 border border-[#0F172A]/08 rounded-2xl p-5 text-xs text-[#0F172A]/50 space-y-2">
            <p className="font-semibold text-[#0F172A]/70">Variables d'environnement Stripe (non stockées ici)</p>
            <p>Les clés Stripe restent dans <code className="bg-[#0F172A]/08 px-1 rounded">.env.local</code> pour des raisons de sécurité :</p>
            <pre className="font-mono text-[11px] bg-[#0F172A] text-emerald-400 rounded-lg p-3 mt-2">{`STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...`}</pre>
          </div>

          <SaveBar pending={pending} saved={ok('integrations')} error={err('integrations')} />
        </form>
      )}
    </div>
  )
}
