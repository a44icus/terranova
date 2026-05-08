export type UserType = 'particulier' | 'pro'
export type TypeReseau = 'franchise' | 'mandataires' | 'groupement' | 'enseigne'

export interface Reseau {
  id: string
  nom: string
  slug: string
  logo_url?: string
  description?: string
  site_web?: string
  type_reseau: TypeReseau
  created_at: string
  updated_at: string
}
export type BienStatut = 'brouillon' | 'en_attente' | 'publie' | 'vendue' | 'archive' | 'refuse'
export type BienType = 'vente' | 'location'
export type BienCategorie =
  // Résidentiel
  | 'appartement' | 'maison' | 'studio' | 'villa' | 'chalet' | 'loft' | 'colocation'
  // Commercial / Pro
  | 'bureau' | 'local' | 'restaurant' | 'entrepot' | 'hotel' | 'fonds_commerce' | 'murs_commerciaux'
  // Foncier
  | 'terrain' | 'terrain_agricole' | 'terrain_constructible'
  // Autre
  | 'parking'
export type DpeClasse = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'
export type PlanType = 'gratuit' | 'pro_mensuel' | 'pro_annuel' | 'agence_mensuel' | 'agence_annuel'

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
  ville?: string
  adresse?: string
  lat?: number
  lng?: number
  reseau_id?: string
  reseau?: Reseau
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
  // Universal category fields
  type_chauffage?: string
  exposition?: string
  charges_copro?: number
  // Colocation
  loyer_par_chambre?: number
  charges_incluses?: boolean
  // Bureau / Local
  open_space?: boolean
  nb_postes_travail?: number
  bail_commercial?: boolean
  droit_au_bail?: number
  // Entrepôt
  hauteur_sous_plafond?: number
  quai_chargement?: boolean
  porte_sectionnelle?: boolean
  surface_bureau_incluse?: number
  // Fonds de commerce
  chiffre_affaires?: number
  loyer_annuel?: number
  duree_bail_restant?: number
  effectif?: number
  // Murs commerciaux
  bail_en_cours?: boolean
  rendement_locatif?: number
  // Terrains
  viabilise?: boolean
  nature_terrain?: string
  zone_plu?: string
  // Parking
  type_parking?: string
  acces_24h?: boolean
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
  score_quartier?: number | null
  // Champs spécifiques restaurant
  licence_restaurant?: string | null
  couverts?: number | null
  fonds_commerce?: boolean
  cuisine_pro?: boolean
  terrasse_ext?: boolean
  // Champs spécifiques hôtel
  nb_chambres_hotel?: number | null
  nb_etoiles?: number | null
  // Champs spécifiques colocation
  nb_colocataires?: number | null
  // Universal category fields
  type_chauffage?: string | null
  exposition?: string | null
  charges_copro?: number | null
  // Colocation
  loyer_par_chambre?: number | null
  charges_incluses?: boolean
  // Bureau / Local
  open_space?: boolean
  nb_postes_travail?: number | null
  bail_commercial?: boolean
  droit_au_bail?: number | null
  // Entrepôt
  hauteur_sous_plafond?: number | null
  quai_chargement?: boolean
  porte_sectionnelle?: boolean
  surface_bureau_incluse?: number | null
  // Fonds de commerce
  chiffre_affaires?: number | null
  loyer_annuel?: number | null
  duree_bail_restant?: number | null
  effectif?: number | null
  // Murs commerciaux
  bail_en_cours?: boolean
  rendement_locatif?: number | null
  // Terrains
  viabilise?: boolean
  nature_terrain?: string | null
  zone_plu?: string | null
  // Parking
  type_parking?: string | null
  acces_24h?: boolean
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

// Limites freemium (fallback statique — les valeurs réelles viennent de getPlanConfig())
export const LIMITES_PLAN: Record<PlanType, {
  annonces: number
  photos: number
  duree_jours: number
}> = {
  gratuit:        { annonces: 1,   photos: 10, duree_jours: 90  },
  pro_mensuel:    { annonces: 10,  photos: 20, duree_jours: 30  },
  pro_annuel:     { annonces: 10,  photos: 20, duree_jours: 365 },
  agence_mensuel: { annonces: 999, photos: 30, duree_jours: 30  },
  agence_annuel:  { annonces: 999, photos: 30, duree_jours: 365 },
}