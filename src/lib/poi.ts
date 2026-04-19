export interface POICategory {
  key: string
  label: string
  color: string
  emoji: string
  scoreWeight: number
}

export const POI_CATEGORIES: POICategory[] = [
  { key: 'restauration', label: 'Restauration',       color: '#e74c3c', emoji: '🍽️', scoreWeight: 1.5 },
  { key: 'sante',        label: 'Santé',              color: '#3498db', emoji: '🏥', scoreWeight: 2   },
  { key: 'education',    label: 'Éducation',          color: '#27ae60', emoji: '🏫', scoreWeight: 2   },
  { key: 'transport',    label: 'Transports',         color: '#9b59b6', emoji: '🚇', scoreWeight: 2.5 },
  { key: 'commerce',     label: 'Commerce',           color: '#f39c12', emoji: '🛒', scoreWeight: 1.5 },
  { key: 'loisirs',      label: 'Loisirs',            color: '#1abc9c', emoji: '🌳', scoreWeight: 1   },
  { key: 'services',     label: 'Services',           color: '#7f8c8d', emoji: '🏦', scoreWeight: 1   },
  { key: 'beaute',       label: 'Beauté & Bien-être', color: '#e91e8c', emoji: '💆', scoreWeight: 0.5 },
]

type Tags = Record<string, string>

export function detectCategory(tags: Tags): string | null {
  const a = tags.amenity || ''
  const s = tags.shop || ''
  const r = tags.railway || ''
  const h = tags.highway || ''
  const l = tags.leisure || ''
  if (r === 'station' || r === 'subway_entrance' || r === 'tram_stop' || r === 'halt' ||
      h === 'bus_stop' || a === 'bus_stop' || a === 'taxi' || a === 'bicycle_rental' || a === 'car_sharing')
    return 'transport'
  if (s === 'supermarket' || s === 'convenience' || s === 'market' || s === 'mall' ||
      s === 'department_store' || s === 'bakery' || s === 'butcher' || s === 'greengrocer' ||
      s === 'clothes' || s === 'electronics' || s === 'hardware' || s === 'florist' ||
      s === 'books' || s === 'wine' || s === 'alcohol' || a === 'marketplace')
    return 'commerce'
  if (a === 'school' || a === 'college' || a === 'university' || a === 'kindergarten' ||
      a === 'library' || a === 'language_school' || a === 'music_school' || a === 'driving_school')
    return 'education'
  if (a === 'pharmacy' || a === 'hospital' || a === 'clinic' || a === 'doctors' ||
      a === 'dentist' || a === 'veterinary' || s === 'optician' || s === 'hearing_aids')
    return 'sante'
  if (a === 'restaurant' || a === 'cafe' || a === 'fast_food' || a === 'bar' ||
      a === 'bakery' || a === 'pub' || a === 'brasserie' || a === 'food_court' || a === 'ice_cream')
    return 'restauration'
  if (l === 'park' || l === 'sports_centre' || l === 'fitness_centre' || l === 'swimming_pool' ||
      l === 'playground' || l === 'garden' || l === 'pitch' || l === 'tennis' ||
      a === 'cinema' || a === 'theatre' || a === 'museum' || a === 'arts_centre' || a === 'nightclub')
    return 'loisirs'
  if (a === 'bank' || a === 'atm' || a === 'post_office' || a === 'police' ||
      a === 'fire_station' || a === 'townhall' || s === 'laundry' || s === 'dry_cleaning' ||
      s === 'travel_agency' || s === 'copyshop')
    return 'services'
  if (s === 'beauty' || s === 'hairdresser' || s === 'massage' || s === 'cosmetics' ||
      s === 'perfumery' || l === 'spa' || l === 'sauna' || a === 'spa')
    return 'beaute'
  return null
}

export function poiEmoji(tags: Tags): string {
  const a = tags.amenity || ''
  const s = tags.shop || ''
  const r = tags.railway || ''
  const l = tags.leisure || ''
  if (a === 'restaurant') return '🍴'
  if (a === 'cafe') return '☕'
  if (a === 'fast_food') return '🍔'
  if (a === 'bar' || a === 'pub') return '🍺'
  if (a === 'bakery' || s === 'bakery') return '🥖'
  if (a === 'pharmacy') return '💊'
  if (a === 'hospital') return '🏥'
  if (a === 'clinic' || a === 'doctors') return '🩺'
  if (a === 'dentist') return '🦷'
  if (a === 'veterinary') return '🐾'
  if (s === 'optician') return '👓'
  if (a === 'school') return '🏫'
  if (a === 'college' || a === 'university') return '🎓'
  if (a === 'kindergarten') return '🧸'
  if (a === 'library') return '📚'
  if (r === 'station') return '🚉'
  if (r === 'subway_entrance') return '🚇'
  if (r === 'tram_stop') return '🚊'
  if (a === 'bus_stop' || tags.highway === 'bus_stop') return '🚌'
  if (a === 'taxi') return '🚕'
  if (a === 'bicycle_rental') return '🚲'
  if (s === 'supermarket') return '🛒'
  if (s === 'convenience') return '🏪'
  if (s === 'mall' || s === 'department_store') return '🏬'
  if (l === 'park' || l === 'garden') return '🌳'
  if (l === 'sports_centre' || l === 'fitness_centre') return '💪'
  if (l === 'swimming_pool') return '🏊'
  if (a === 'cinema') return '🎬'
  if (a === 'theatre') return '🎭'
  if (a === 'museum') return '🏛️'
  if (a === 'bank') return '🏦'
  if (a === 'atm') return '💳'
  if (s === 'hairdresser') return '💇'
  if (s === 'beauty' || s === 'massage' || a === 'spa') return '💆'
  return '📍'
}

export function poiSubtype(tags: Tags): string | null {
  const a = tags.amenity || ''
  const s = tags.shop || ''
  const r = tags.railway || ''
  const l = tags.leisure || ''
  const amenityMap: Record<string, string> = {
    pharmacy: 'Pharmacie', hospital: 'Hôpital', clinic: 'Clinique',
    doctors: 'Médecin', dentist: 'Dentiste', veterinary: 'Vétérinaire',
    restaurant: 'Restaurant', cafe: 'Café', fast_food: 'Restauration rapide',
    bar: 'Bar', bakery: 'Boulangerie', pub: 'Pub', brasserie: 'Brasserie',
    school: 'École', college: 'Lycée', university: 'Université',
    kindergarten: 'Crèche', library: 'Bibliothèque',
    language_school: 'École de langues', music_school: 'École de musique',
    driving_school: 'Auto-école', bus_stop: 'Arrêt de bus', taxi: 'Station taxi',
    bicycle_rental: 'Location vélo', car_sharing: 'Auto-partage',
    bank: 'Banque', atm: 'Distributeur', post_office: 'Bureau de poste',
    police: 'Commissariat', cinema: 'Cinéma', theatre: 'Théâtre',
    museum: 'Musée', nightclub: 'Discothèque', spa: 'Spa',
  }
  const shopMap: Record<string, string> = {
    supermarket: 'Supermarché', convenience: 'Supérette', mall: 'Centre commercial',
    bakery: 'Boulangerie', butcher: 'Boucherie', greengrocer: 'Primeur',
    clothes: 'Vêtements', electronics: 'Électronique', hardware: 'Bricolage',
    florist: 'Fleuriste', books: 'Librairie', wine: 'Cave à vins',
    optician: 'Opticien', hairdresser: 'Coiffeur', beauty: 'Institut de beauté',
    massage: 'Massage', laundry: 'Laverie', dry_cleaning: 'Pressing',
  }
  const leisureMap: Record<string, string> = {
    park: 'Parc', garden: 'Jardin', sports_centre: 'Centre sportif',
    fitness_centre: 'Salle de sport', swimming_pool: 'Piscine',
    playground: 'Aire de jeux', tennis: 'Court de tennis',
  }
  const railMap: Record<string, string> = {
    station: 'Gare', subway_entrance: 'Métro', tram_stop: 'Tramway',
  }
  if (a && amenityMap[a]) return amenityMap[a]
  if (s && shopMap[s]) return shopMap[s]
  if (l && leisureMap[l]) return leisureMap[l]
  if (r && railMap[r]) return railMap[r]
  if (tags.highway === 'bus_stop') return 'Arrêt de bus'
  return null
}

export function computeNeighborhoodScore(bestByCategory: Record<string, any>): number {
  let score = 0
  for (const [key, poi] of Object.entries(bestByCategory)) {
    const cat = POI_CATEGORIES.find(c => c.key === key)
    if (!cat) continue
    const boost = poi.distance < 250 ? 1.5 : poi.distance < 500 ? 1.2 : 1.0
    score += cat.scoreWeight * boost
  }
  return Math.min(Math.round(score), 10)
}

export const OVERPASS_QUERY = (bbox: string) => `
  [out:json][timeout:10][maxsize:524288];
  (
    node["amenity"~"restaurant|cafe|fast_food|bar|bakery|pub|brasserie|food_court|ice_cream|pharmacy|hospital|clinic|doctors|dentist|veterinary|school|college|university|kindergarten|library|language_school|music_school|driving_school|bus_stop|taxi|bicycle_rental|car_sharing|marketplace|bank|atm|post_office|police|fire_station|townhall|cinema|theatre|museum|arts_centre|nightclub|spa"](${bbox});
    node["shop"~"supermarket|convenience|market|mall|department_store|bakery|butcher|greengrocer|clothes|electronics|hardware|florist|books|wine|alcohol|optician|hearing_aids|laundry|dry_cleaning|travel_agency|copyshop|beauty|hairdresser|massage|cosmetics|perfumery"](${bbox});
    node["railway"~"station|subway_entrance|tram_stop|halt"](${bbox});
    node["highway"="bus_stop"](${bbox});
    node["leisure"~"park|sports_centre|fitness_centre|swimming_pool|playground|garden|pitch|tennis|spa|sauna"](${bbox});
  );
  out qt;
`

export const MAX_POI_DISTANCE = 1000
export const OVERPASS_SERVERS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.openstreetmap.ru/api/interpreter',
]