import { createAdminClient } from './supabase/admin'

export interface SiteSettings {
  // ── Site général ─────────────────────────────────────────
  nom_site: string
  slogan: string
  email_contact: string
  maintenance: boolean
  maintenance_message: string

  // ── SEO & Tracking ────────────────────────────────────────
  meta_description: string
  og_image_url: string
  ga4_id: string
  gtm_id: string
  pixel_meta_id: string
  matomo_url: string
  matomo_site_id: string

  // ── Carte ─────────────────────────────────────────────────
  carte_lat: number
  carte_lng: number
  carte_zoom: number
  carte_style: 'street' | 'satellite' | 'topo'
  heatmap_defaut: boolean
  carte_zoom_min: number
  carte_zoom_max: number
  clustering_seuil: number
  heatmap_opacite: number
  carte_biens_max: number

  // ── Score quartier & POI ──────────────────────────────────
  poi_poids_transport: number
  poi_poids_sante: number
  poi_poids_education: number
  poi_poids_commerce: number
  poi_poids_restauration: number
  poi_poids_loisirs: number
  poi_poids_services: number
  poi_poids_beaute: number
  score_seuil_excellent: number
  score_seuil_bon: number
  score_seuil_moyen: number
  poi_distance_max_m: number

  // ── Annonces ──────────────────────────────────────────────
  moderation: 'auto' | 'manuelle'
  expiration_defaut_jours: number
  categories_actives: string[]
  types_actifs: string[]
  surface_min_prix_m2: number
  photos_max_upload: number
  marche_active: boolean
  marche_devise: string

  // ── Messages & Contacts ───────────────────────────────────
  contact_delai_reponse: string
  contact_copie_admin: boolean
  contact_antispam_minutes: number

  // ── Alertes & Emails ──────────────────────────────────────
  alertes_max_par_user: number
  alertes_frequence: 'instantane' | 'quotidien' | 'hebdomadaire'
  email_expediteur_nom: string
  email_expediteur: string

  // ── Notifications admin ───────────────────────────────────
  notif_admin_email: string
  notif_nouvelle_annonce: boolean
  notif_nouveau_message: boolean
  notif_nouvelle_inscription: boolean
  notif_resume_hebdo: boolean

  // ── Sécurité ──────────────────────────────────────────────
  session_duree_jours: number
  login_max_tentatives: number
  admin_ip_whitelist: string
  tfa_obligatoire_pro: boolean

  // ── Inscription ───────────────────────────────────────────
  inscription_ouverte: boolean
  email_verification: boolean
  pro_autorise: boolean

  // ── Légal & RGPD ──────────────────────────────────────────
  legal_raison_sociale: string
  legal_siret: string
  legal_adresse: string
  legal_dpo_email: string
  rgpd_conservation_jours: number
  cookies_banniere: boolean
  cookies_texte: string

  // ── Intégrations ──────────────────────────────────────────
  integration_resend_key: string
  integration_webhook_url: string
  integration_dvf_url: string
  support_telephone: string
}

export const DEFAULT_SETTINGS: SiteSettings = {
  nom_site:               'Terranova',
  slogan:                 'La plateforme immobilière de référence',
  email_contact:          'contact@terranova.fr',
  maintenance:            false,
  maintenance_message:    'Le site est en maintenance, revenez bientôt.',

  meta_description:       'Trouvez et publiez des biens immobiliers partout en France.',
  og_image_url:           '',
  ga4_id:                 '',
  gtm_id:                 '',
  pixel_meta_id:          '',
  matomo_url:             '',
  matomo_site_id:         '',

  carte_lat:              46.8,
  carte_lng:              2.3522,
  carte_zoom:             5,
  carte_style:            'street',
  heatmap_defaut:         false,
  carte_zoom_min:         3,
  carte_zoom_max:         20,
  clustering_seuil:       8,
  heatmap_opacite:        0.75,
  carte_biens_max:        2000,

  poi_poids_transport:    2.5,
  poi_poids_sante:        2.0,
  poi_poids_education:    2.0,
  poi_poids_commerce:     1.5,
  poi_poids_restauration: 1.5,
  poi_poids_loisirs:      1.0,
  poi_poids_services:     1.0,
  poi_poids_beaute:       0.5,
  score_seuil_excellent:  8,
  score_seuil_bon:        6,
  score_seuil_moyen:      4,
  poi_distance_max_m:     1000,

  moderation:             'manuelle',
  expiration_defaut_jours: 30,
  categories_actives:     ['appartement', 'maison', 'terrain', 'bureau', 'parking', 'local'],
  types_actifs:           ['vente', 'location'],
  surface_min_prix_m2:    10,
  photos_max_upload:      20,
  marche_active:          true,
  marche_devise:          '€',

  contact_delai_reponse:  '24h',
  contact_copie_admin:    false,
  contact_antispam_minutes: 5,

  alertes_max_par_user:   5,
  alertes_frequence:      'instantane',
  email_expediteur_nom:   'Terranova',
  email_expediteur:       'noreply@terranova.fr',

  notif_admin_email:      '',
  notif_nouvelle_annonce: false,
  notif_nouveau_message:  false,
  notif_nouvelle_inscription: false,
  notif_resume_hebdo:     false,

  session_duree_jours:    30,
  login_max_tentatives:   5,
  admin_ip_whitelist:     '',
  tfa_obligatoire_pro:    false,

  inscription_ouverte:    true,
  email_verification:     true,
  pro_autorise:           true,

  legal_raison_sociale:   '',
  legal_siret:            '',
  legal_adresse:          '',
  legal_dpo_email:        '',
  rgpd_conservation_jours: 1095,
  cookies_banniere:       true,
  cookies_texte:          'Nous utilisons des cookies pour améliorer votre expérience.',

  integration_resend_key:  '',
  integration_webhook_url: '',
  integration_dvf_url:     'https://api.dvf.etalab.gouv.fr',
  support_telephone:       '',
}

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('site_settings')
      .select('settings')
      .eq('id', 1)
      .single()
    if (error || !data) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...(data.settings as Partial<SiteSettings>) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

// Helper : récupère les poids POI depuis les settings
export function getPoiWeights(s: SiteSettings): Record<string, number> {
  return {
    transport:    s.poi_poids_transport,
    sante:        s.poi_poids_sante,
    education:    s.poi_poids_education,
    commerce:     s.poi_poids_commerce,
    restauration: s.poi_poids_restauration,
    loisirs:      s.poi_poids_loisirs,
    services:     s.poi_poids_services,
    beaute:       s.poi_poids_beaute,
  }
}

export function getScoreSeuils(s: SiteSettings) {
  return {
    excellent: s.score_seuil_excellent,
    bon:       s.score_seuil_bon,
    moyen:     s.score_seuil_moyen,
  }
}
