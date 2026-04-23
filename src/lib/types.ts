export type UserType = 'particulier' | 'pro'
export type BienStatut = 'brouillon' | 'en_attente' | 'publie' | 'archive' | 'refuse'
export type BienType = 'vente' | 'location'
export type BienCategorie = 'appartement' | 'maison' | 'bureau' | 'terrain' | 'parking' | 'local'
export type DpeClasse = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'
export type PlanType = 'gratuit' | 'pro_mensuel' | 'pro_annuel'

export interface Profile {
  id: string
  type: UserType
  nom: string
  prenom: string
  telephone?: string
  agence?: string
  siret?: string
  site_web?: string
  avatar_url?: string
  logo_url?: string
  bio?: string
  plan: PlanType
  plan_expire_at?: string
  stripe_customer_id?: string
  annonces_actives: number
  is_admin?: boolean
  created_at: string
  updated_at: string
}

export interface Bien {
  id: string
  user_id: string
  statut: BienStatut
  featured: boolean
  expire_at?: string
  type: BienType
  categorie: BienCategorie
  titre: string
  description?: string
  prix: number
  surface?: number
  pieces?: number
  sdb?: number
  chambres?: number
  nb_wc?: number
  surface_terrain?: number
  fibre?: boolean
  conso_energie?: number
  emissions_co2?: number
  depenses_energie_min?: number
  depenses_energie_max?: number
  etage?: number
  nb_etages?: number
  annee_construction?: number
  dpe?: DpeClasse
  ges?: DpeClasse
  options: string[]
  meuble: boolean
  adresse?: string
  complement?: string
  ville: string
  code_postal: string
  departement?: string
  region?: string
  lat: number
  lng: number
  approx: boolean
  approx_radius: number
  pro: boolean
  exclusif: boolean
  neuf: boolean
  coup_de_coeur: boolean
  vues: number
  contacts: number
  favoris_count: number
  ref_agence?: string
  created_at: string
  updated_at: string
  publie_at?: string
}

export interface Photo {
  id: string
  bien_id: string
  url: string
  storage_path: string
  ordre: number
  principale: boolean
  is_360: boolean
  created_at: string
}

export interface Favori {
  user_id: string
  bien_id: string
  created_at: string
}

export interface Contact {
  id: string
  bien_id: string
  vendeur_id: string
  acheteur_id?: string
  nom: string
  email: string
  telephone?: string
  message: string
  lu: boolean
  created_at: string
}

// Vue publique (pour la carte)
export interface BienPublic {
  id: string
  type: BienType
  categorie: BienCategorie
  titre: string
  prix: number
  surface?: number
  pieces?: number
  sdb?: number
  chambres?: number
  nb_wc?: number
  surface_terrain?: number
  fibre?: boolean
  conso_energie?: number
  emissions_co2?: number
  depenses_energie_min?: number
  depenses_energie_max?: number
  dpe?: DpeClasse
  options: string[]
  meuble: boolean
  ville: string
  code_postal: string
  lat: number
  lng: number
  approx: boolean
  approx_radius: number
  pro: boolean
  featured: boolean
  neuf: boolean
  coup_de_coeur: boolean
  vues: number
  favoris_count: number
  publie_at?: string
  expire_at?: string
  photo_url?: string
  vendeur_type: UserType
  vendeur_agence?: string
  vendeur_avatar?: string
  vendeur_logo?: string
}

// Filtres de recherche
export interface FiltresRecherche {
  type?: BienType
  categorie?: BienCategorie
  prix_max?: number
  surface_min?: number
  surface_max?: number
  pieces?: number
  options?: string[]
  dpe?: DpeClasse[]
  ville?: string
  code_postal?: string
  lat_min?: number
  lat_max?: number
  lng_min?: number
  lng_max?: number
}

// Limites freemium
export const LIMITES_PLAN: Record<PlanType, {
  annonces: number
  photos: number
  duree_jours: number
}> = {
  gratuit:     { annonces: 3,   photos: 5,  duree_jours: 30  },
  pro_mensuel: { annonces: 50,  photos: 20, duree_jours: 90  },
  pro_annuel:  { annonces: 999, photos: 20, duree_jours: 180 },
}