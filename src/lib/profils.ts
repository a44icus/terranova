// ─── Moteur de matching profils acheteurs/locataires ─────────────────────────

export interface ProfilMatch {
  id: string
  label: string
  emoji: string
  score: number       // 0-100
  raisons: string[]   // pourquoi ce bien correspond
}

export interface BienRapport {
  profils: ProfilMatch[]        // triés par score desc
  pointsForts: string[]
  pointsAttention: string[]
  idealPour: string[]           // phrases "Idéal si vous..."
  budget: { label: string; color: string } | null
  rendementLocatif?: string     // si vente : estimation rendement brut
}

interface BienData {
  type: 'vente' | 'location'
  categorie: string
  prix: number
  surface?: number
  pieces?: number
  chambres?: number
  sdb?: number
  nb_wc?: number
  surface_terrain?: number
  etage?: number
  nb_etages?: number
  annee_construction?: number
  dpe?: string
  ges?: string
  conso_energie?: number
  depenses_energie_min?: number
  depenses_energie_max?: number
  fibre?: boolean
  meuble?: boolean
  neuf?: boolean
  coup_de_coeur?: boolean
  options: string[]
  ville: string
  code_postal?: string
  approx?: boolean
}

// ─── Profils disponibles ──────────────────────────────────────────────────────

const PROFILS = [
  {
    id: 'famille',
    label: 'Famille avec enfants',
    emoji: '👨‍👩‍👧',
    score: (b: BienData) => {
      let s = 0
      const raisons: string[] = []
      const opts = b.options ?? []

      if ((b.pieces ?? 0) >= 4) { s += 30; raisons.push('Nombreuses pièces pour toute la famille') }
      else if ((b.pieces ?? 0) >= 3) { s += 15; raisons.push('Espace suffisant pour une petite famille') }

      if ((b.chambres ?? 0) >= 3) { s += 20; raisons.push(`${b.chambres} chambres`) }
      else if ((b.chambres ?? 0) >= 2) s += 10

      if (b.categorie === 'maison') { s += 20; raisons.push('Maison avec intimité') }
      if (b.surface_terrain && b.surface_terrain > 100) { s += 15; raisons.push(`Terrain de ${b.surface_terrain} m²`) }
      if (opts.includes('jardin')) { s += 15; raisons.push('Jardin') }
      if (opts.includes('parking') || opts.includes('garage')) { s += 8; raisons.push('Stationnement') }
      if (opts.includes('piscine')) { s += 5; raisons.push('Piscine') }
      if ((b.sdb ?? 0) >= 2) { s += 8; raisons.push('Deux salles de bain') }
      if (b.fibre) { s += 5; raisons.push('Fibre optique') }

      return { score: Math.min(s, 100), raisons: raisons.slice(0, 3) }
    },
  },
  {
    id: 'couple',
    label: 'Jeune couple',
    emoji: '💑',
    score: (b: BienData) => {
      let s = 0
      const raisons: string[] = []
      const opts = b.options ?? []

      const pieces = b.pieces ?? 0
      if (pieces === 2 || pieces === 3) { s += 30; raisons.push(`${pieces} pièces bien dimensionné`) }
      else if (pieces === 1) s += 10

      const surf = b.surface ?? 0
      if (surf >= 45 && surf <= 90) { s += 20; raisons.push(`Surface idéale (${surf} m²)`) }

      if (b.dpe && ['A','B','C'].includes(b.dpe)) { s += 15; raisons.push(`DPE ${b.dpe} — faibles charges`) }

      const prix = b.prix
      if (b.type === 'vente' && prix <= 250000) { s += 20; raisons.push('Budget accessible pour un premier achat') }
      else if (b.type === 'vente' && prix <= 400000) { s += 10 }

      if (opts.includes('terrasse') || opts.includes('balcon')) { s += 10; raisons.push('Espace extérieur') }
      if (b.neuf) { s += 8; raisons.push('Bien neuf, sans travaux') }
      if (b.meuble && b.type === 'location') { s += 10; raisons.push('Meublé, prêt à emménager') }

      return { score: Math.min(s, 100), raisons: raisons.slice(0, 3) }
    },
  },
  {
    id: 'investisseur',
    label: 'Investisseur locatif',
    emoji: '📈',
    score: (b: BienData) => {
      let s = 0
      const raisons: string[] = []

      if (b.type !== 'vente') return { score: 0, raisons: [] }

      // Rendement estimé : prix d'achat vs loyer moyen de la région
      const surf = b.surface ?? 0
      if (surf > 0) {
        const prixM2 = b.prix / surf
        if (prixM2 < 2500) { s += 30; raisons.push('Prix au m² attractif pour investissement') }
        else if (prixM2 < 4000) { s += 15; raisons.push('Prix du marché raisonnable') }
      }

      if (['appartement', 'studio'].includes(b.categorie)) { s += 20; raisons.push('Appartement : forte demande locative') }
      if (b.categorie === 'local') { s += 15; raisons.push('Local commercial — bail 3/6/9') }

      if (b.meuble) { s += 15; raisons.push('Meublé — rendement supérieur et fiscalité LMNP') }
      if (b.fibre) { s += 8; raisons.push('Fibre — attractif pour les locataires') }

      const dpe = b.dpe ?? 'G'
      if (['A','B','C'].includes(dpe)) { s += 15; raisons.push(`DPE ${dpe} — pas de restriction de location`) }
      else if (['F','G'].includes(dpe)) { s -= 20 }  // risque interdiction location

      if ((b.pieces ?? 0) === 1 || (b.pieces ?? 0) === 2) { s += 10; raisons.push('Petite surface — rotation locataire rapide') }

      return { score: Math.min(Math.max(s, 0), 100), raisons: raisons.slice(0, 3) }
    },
  },
  {
    id: 'retraite',
    label: 'Retraité / Sénior',
    emoji: '👴',
    score: (b: BienData) => {
      let s = 0
      const raisons: string[] = []
      const opts = b.options ?? []

      const etage = b.etage ?? 0
      if (etage === 0 || opts.includes('ascenseur')) {
        s += 25
        raisons.push(etage === 0 ? 'Rez-de-chaussée, plain-pied' : 'Ascenseur disponible')
      }

      const surf = b.surface ?? 0
      if (surf >= 50 && surf <= 100) { s += 20; raisons.push('Surface confortable sans excès') }

      if (b.categorie === 'maison' && surf < 120) { s += 15; raisons.push('Maison de plain-pied gérable') }

      if (b.dpe && ['A','B','C'].includes(b.dpe)) { s += 20; raisons.push(`DPE ${b.dpe} — faibles dépenses énergétiques`) }

      if (opts.includes('jardin') || opts.includes('terrasse')) { s += 10; raisons.push('Espace extérieur') }
      if (opts.includes('parking') || opts.includes('garage')) { s += 8; raisons.push('Stationnement') }

      const depMax = b.depenses_energie_max ?? 9999
      if (depMax < 1500) { s += 12; raisons.push('Dépenses énergétiques maîtrisées') }

      return { score: Math.min(s, 100), raisons: raisons.slice(0, 3) }
    },
  },
  {
    id: 'teletravail',
    label: 'Télétravailleurs',
    emoji: '💻',
    score: (b: BienData) => {
      let s = 0
      const raisons: string[] = []
      const opts = b.options ?? []

      if (b.fibre) { s += 30; raisons.push('Fibre optique déployée') }

      const pieces = b.pieces ?? 0
      if (pieces >= 3) { s += 25; raisons.push(`${pieces} pièces — place pour un bureau`) }
      else if (pieces >= 2) { s += 12 }

      if (b.surface_terrain || opts.includes('jardin') || opts.includes('terrasse')) {
        s += 15; raisons.push('Espace extérieur pour les pauses')
      }

      if (b.categorie === 'maison') { s += 15; raisons.push('Maison — calme et espace de travail dédié') }

      if (b.dpe && ['A','B','C','D'].includes(b.dpe)) { s += 10; raisons.push('Charges énergétiques raisonnables') }
      if (opts.includes('climatisation')) { s += 5; raisons.push('Climatisation pour les journées chaudes') }

      return { score: Math.min(s, 100), raisons: raisons.slice(0, 3) }
    },
  },
  {
    id: 'etudiant',
    label: 'Étudiant / Premier achat',
    emoji: '🎓',
    score: (b: BienData) => {
      let s = 0
      const raisons: string[] = []

      const surf = b.surface ?? 0
      const prix = b.prix

      if (surf > 0 && surf <= 40) { s += 25; raisons.push('Surface adaptée à un étudiant') }
      else if (surf <= 55) { s += 15 }

      if (b.type === 'location' && prix <= 600) { s += 30; raisons.push('Loyer accessible') }
      else if (b.type === 'location' && prix <= 900) { s += 15 }
      else if (b.type === 'vente' && prix <= 150000) { s += 30; raisons.push('Prix accessible pour un premier achat') }
      else if (b.type === 'vente' && prix <= 200000) { s += 15 }

      if (b.meuble && b.type === 'location') { s += 20; raisons.push('Meublé — pas besoin de meubles') }
      if (b.fibre) { s += 10; raisons.push('Fibre optique') }

      const dpe = b.dpe ?? 'G'
      if (['A','B','C','D'].includes(dpe)) { s += 10; raisons.push('Charges maîtrisées') }

      return { score: Math.min(s, 100), raisons: raisons.slice(0, 3) }
    },
  },
  {
    id: 'ecolo',
    label: 'Profil écologique',
    emoji: '🌱',
    score: (b: BienData) => {
      let s = 0
      const raisons: string[] = []
      const opts = b.options ?? []

      if (b.dpe === 'A') { s += 40; raisons.push('DPE A — performance énergétique maximale') }
      else if (b.dpe === 'B') { s += 30; raisons.push('DPE B — très bonne performance énergétique') }
      else if (b.dpe === 'C') { s += 20; raisons.push('DPE C — bonne performance énergétique') }
      else if (b.dpe && ['F','G'].includes(b.dpe)) s -= 10

      if (b.ges === 'A' || b.ges === 'B') { s += 20; raisons.push(`GES ${b.ges} — faibles émissions carbone`) }

      if (b.neuf) { s += 15; raisons.push('Bien neuf — normes RE2020') }
      if (opts.includes('double_vitrage')) { s += 8; raisons.push('Double vitrage') }
      if (opts.includes('cheminee')) { s -= 5 }

      const conso = b.conso_energie ?? 999
      if (conso < 100) { s += 15; raisons.push(`Consommation très faible (${conso} kWh/m²/an)`) }
      else if (conso < 150) { s += 8 }

      if (b.surface_terrain && b.surface_terrain > 200) { s += 5; raisons.push('Grand terrain — potentiel jardin / potager') }

      return { score: Math.min(Math.max(s, 0), 100), raisons: raisons.slice(0, 3) }
    },
  },
]

// ─── Analyse points forts / points d'attention ────────────────────────────────

function analyserPointsForts(b: BienData): string[] {
  const pts: string[] = []
  const opts = b.options ?? []

  if (b.dpe && ['A','B','C'].includes(b.dpe)) pts.push(`DPE ${b.dpe} — faibles charges énergétiques`)
  if (b.neuf) pts.push('Bien neuf — garanties constructeur')
  if (b.coup_de_coeur) pts.push('Sélectionné comme coup de cœur par notre équipe')
  if (b.fibre) pts.push('Fibre optique déployée')
  if (opts.includes('piscine')) pts.push('Piscine')
  if (opts.includes('jardin') || b.surface_terrain) pts.push('Espace extérieur privatif')
  if (opts.includes('terrasse') || opts.includes('balcon')) pts.push('Terrasse ou balcon')
  if ((b.sdb ?? 0) >= 2) pts.push('Deux salles de bain')
  if (b.annee_construction && b.annee_construction > 2010) pts.push('Construction récente (après 2010)')
  if (b.meuble && b.type === 'location') pts.push('Meublé — prêt à emménager')
  if (b.surface && b.surface > 100) pts.push(`Grande surface (${b.surface} m²)`)
  if (opts.includes('ascenseur')) pts.push('Ascenseur')
  if (opts.includes('parking') || opts.includes('garage')) pts.push('Stationnement inclus')
  if (b.type === 'vente' && b.surface) {
    const prixM2 = b.prix / b.surface
    if (prixM2 < 2000) pts.push('Prix au m² très compétitif')
  }

  return pts.slice(0, 5)
}

function analyserPointsAttention(b: BienData): string[] {
  const pts: string[] = []
  const opts = b.options ?? []

  if (b.dpe && ['F','G'].includes(b.dpe)) pts.push(`DPE ${b.dpe} — travaux de rénovation énergétique recommandés`)
  if (b.annee_construction && b.annee_construction < 1975) pts.push('Construction avant 1975 — vérifier isolation et plomberie')
  if (b.etage && b.etage > 3 && !opts.includes('ascenseur')) pts.push(`Étage ${b.etage} sans ascenseur`)
  if (b.depenses_energie_max && b.depenses_energie_max > 2500) pts.push(`Dépenses énergétiques élevées (jusqu'à ${b.depenses_energie_max.toLocaleString('fr-FR')} €/an)`)
  if (!b.fibre) pts.push('Fibre non confirmée — se renseigner sur la connexion internet')
  if (b.type === 'vente' && b.dpe && ['F','G'].includes(b.dpe)) pts.push('Biens DPE F/G bientôt soumis à restrictions de location')
  if (b.approx) pts.push('Localisation approximative — adresse exacte disponible sur demande')

  return pts.slice(0, 4)
}

function genererIdealPour(b: BienData, profils: ProfilMatch[]): string[] {
  const phrases: string[] = []
  const top = profils.filter(p => p.score >= 50)

  if (top.some(p => p.id === 'famille')) phrases.push("Vous recherchez de l'espace pour toute la famille")
  if (top.some(p => p.id === 'couple')) phrases.push("Vous envisagez de vous installer à deux dans un cadre agréable")
  if (top.some(p => p.id === 'investisseur')) phrases.push("Vous envisagez un investissement locatif")
  if (top.some(p => p.id === 'teletravail')) phrases.push("Vous travaillez depuis chez vous et avez besoin d'espace et de connectivité")
  if (top.some(p => p.id === 'retraite')) phrases.push("Vous recherchez un logement confortable et facile à entretenir")
  if (top.some(p => p.id === 'etudiant')) phrases.push("Vous recherchez un premier logement avec un budget maîtrisé")
  if (top.some(p => p.id === 'ecolo')) phrases.push("La performance énergétique est une priorité dans votre recherche")

  return phrases.slice(0, 3)
}

// ─── Export principal ─────────────────────────────────────────────────────────

export function genererRapport(b: BienData): BienRapport {
  const profils: ProfilMatch[] = PROFILS
    .map(p => {
      const { score, raisons } = p.score(b)
      return { id: p.id, label: p.label, emoji: p.emoji, score, raisons }
    })
    .filter(p => p.score > 0)
    .sort((a, z) => z.score - a.score)
    .slice(0, 4)

  const pointsForts = analyserPointsForts(b)
  const pointsAttention = analyserPointsAttention(b)
  const idealPour = genererIdealPour(b, profils)

  // Budget
  let budget: BienRapport['budget'] = null
  if (b.type === 'vente') {
    if (b.prix < 150000) budget = { label: 'Budget accessible', color: '#16A34A' }
    else if (b.prix < 350000) budget = { label: 'Budget intermédiaire', color: '#D97706' }
    else if (b.prix < 700000) budget = { label: 'Budget haut de gamme', color: '#9333EA' }
    else budget = { label: 'Bien de prestige', color: '#B45309' }
  } else {
    if (b.prix < 600) budget = { label: 'Loyer accessible', color: '#16A34A' }
    else if (b.prix < 1200) budget = { label: 'Loyer intermédiaire', color: '#D97706' }
    else budget = { label: 'Loyer premium', color: '#9333EA' }
  }

  // Rendement locatif estimé (si vente)
  let rendementLocatif: string | undefined
  if (b.type === 'vente' && b.surface && b.surface > 0) {
    const dept = (b.code_postal ?? '').slice(0, 2)
    const loyerEstimeM2: Record<string, number> = {
      '75': 32, '92': 24, '69': 15, '13': 14, '33': 14,
      '44': 13, '31': 13, '06': 17, '59': 10, '67': 12,
    }
    const loyerM2 = loyerEstimeM2[dept] ?? 11
    const loyerAnnuel = loyerM2 * b.surface * 12
    const rendement = (loyerAnnuel / b.prix) * 100
    rendementLocatif = `${rendement.toFixed(1)}% brut/an estimé`
  }

  return { profils, pointsForts, pointsAttention, idealPour, budget, rendementLocatif }
}
