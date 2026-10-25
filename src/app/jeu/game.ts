/* ============================================================
   LE CARTOGRAPHE FANTÔME — Données & helpers du jeu
   ============================================================ */

export type View = { center: [number, number]; zoom: number; pitch: number; bearing: number }
export type PickMarker = { id: string; label: string; lngLat: [number, number]; correct: boolean }
export type PuzzleType = 'riddle' | 'caesar' | 'morse' | 'anagram' | 'sequence' | 'pick' | 'locate'

export type Step = {
  act: 1 | 2 | 3
  city: string
  loc: string
  type: PuzzleType
  title: string
  text: string
  // affichage selon le type
  cipher?: string
  morse?: string
  scramble?: string
  sequence?: string
  // validation
  accept?: string[]            // riddle / caesar / morse / anagram / sequence
  target?: [number, number]    // locate
  toleranceM?: number          // locate
  markers?: PickMarker[]       // pick
  hint: string
  digit: string
  lore: string
  reward: string
  view: View
  marker?: [number, number]    // pin doré de récompense
}

export type Act = { id: 1 | 2 | 3; title: string; subtitle: string; blurb: string }

export const ACTS: Act[] = [
  { id: 1, title: 'Acte I — L’Évasion', subtitle: 'Europe', blurb: 'La porte du bureau s’est verrouillée derrière vous. Le premier indice est déjà sous vos yeux.' },
  { id: 2, title: 'Acte II — La Poursuite', subtitle: 'Autour du monde', blurb: 'La piste du Cartographe traverse les continents. Suivez ses souvenirs.' },
  { id: 3, title: 'Acte III — L’Atelier', subtitle: 'Le repaire du Cartographe', blurb: 'Il ne reste qu’un lieu. Et un coffre à ouvrir.' },
]

export const GLOBE_VIEW: View = { center: [10, 30], zoom: 1.6, pitch: 0, bearing: 0 }

export const STEPS: Step[] = [
  // ─────────────── ACTE I ───────────────
  {
    act: 1, city: 'Paris', loc: 'Paris, France', type: 'riddle',
    title: 'La Dame de Fer',
    text: 'Née en 1889 pour une Exposition Universelle, toute de fer vêtue, je culmine à plus de 300 mètres au-dessus de la capitale française. Nommez-moi.',
    accept: ['tour eiffel', 'la tour eiffel', 'eiffel', 'tour effeil'],
    hint: 'Le monument le plus visité de Paris.',
    digit: '7',
    lore: 'Le Cartographe était mon maître. Sa dernière lettre disait : « Tout commence là où le fer touche le ciel. »',
    reward: 'Sous le pilier nord, gravé dans une plaque de bronze : un premier chiffre.',
    view: { center: [2.2945, 48.8584], zoom: 16, pitch: 62, bearing: 25 },
    marker: [2.2945, 48.8584],
  },
  {
    act: 1, city: 'Rome', loc: 'Rome, Italie', type: 'caesar',
    title: 'Le message de César',
    text: 'À Rome, l’empereur chiffrait ses ordres en décalant chaque lettre de 3 rangs. Déchiffrez ce mot pour nommer le lieu :',
    cipher: 'FROLVHH',
    accept: ['colisee', 'le colisee', 'colosseum', 'colisée', 'le colisée'],
    hint: 'Reculez chaque lettre de 3 rangs : F→C, R→O, O→L…',
    digit: '3',
    lore: 'Le Cartographe adorait les codes anciens. « Un secret bien chiffré, disait-il, voyage plus loin qu’une armée. »',
    reward: 'Le mot déchiffré s’illumine sur les gradins de pierre.',
    view: { center: [12.4924, 41.8902], zoom: 16.2, pitch: 60, bearing: -12 },
    marker: [12.4924, 41.8902],
  },
  {
    act: 1, city: 'Londres', loc: 'Londres, Royaume-Uni', type: 'morse',
    title: 'Le carillon codé',
    text: 'Au bord de la Tamise, une horloge sonne en morse. Traduisez le signal (barre / = séparation de mots) :',
    morse: '-... .. --.  /  -... . -.',
    accept: ['big ben', 'bigben'],
    hint: 'Ouvrez la table Morse. Le premier mot fait 3 lettres : -... .. --.',
    digit: '1',
    lore: 'Une carte postale de Londres traînait sur son bureau. Au dos, trois mots : « Le temps nous rattrape. »',
    reward: 'La grande cloche résonne — et livre son chiffre.',
    view: { center: [-0.1246, 51.4994], zoom: 16.4, pitch: 60, bearing: 30 },
    marker: [-0.1246, 51.5007],
  },
  // ─────────────── ACTE II ───────────────
  {
    act: 2, city: 'New York', loc: 'New York, USA', type: 'pick',
    title: 'Le bon repère',
    text: 'Trois balises clignotent sur Manhattan. Cliquez celle qui se dresse tout au sud de l’île, au plus près de l’eau et du port.',
    markers: [
      { id: 'nyc-a', label: 'A', lngLat: [-73.9857, 40.7484], correct: false },
      { id: 'nyc-b', label: 'B', lngLat: [-74.0134, 40.7127], correct: true },
      { id: 'nyc-c', label: 'C', lngLat: [-73.968, 40.7829], correct: false },
    ],
    hint: 'La pointe sud de Manhattan, là où accostaient les ferries.',
    digit: '9',
    lore: 'Le Cartographe a vécu ici, tout en haut d’une tour. « D’ici, on voit la courbure de la Terre », prétendait-il.',
    reward: 'La balise du sud s’ouvre dans un déclic métallique.',
    view: { center: [-74.007, 40.72], zoom: 13.4, pitch: 55, bearing: 12 },
  },
  {
    act: 2, city: 'Gizeh', loc: 'Gizeh, Égypte', type: 'sequence',
    title: 'La suite du bâtisseur',
    text: 'Gravée sur le flanc d’une pyramide, une suite de nombres. Quel nombre vient ensuite ?',
    sequence: '2 · 3 · 5 · 8 · 12 · 17 · ?',
    accept: ['23'],
    hint: 'Regardez l’écart entre les nombres : +1, +2, +3, +4, +5…',
    digit: '4',
    lore: 'Les bâtisseurs cachaient des nombres dans la pierre. Le Cartographe y voyait « la signature des géomètres oubliés ».',
    reward: 'Un bloc de calcaire pivote et révèle un chiffre.',
    view: { center: [31.1342, 29.9792], zoom: 15.4, pitch: 62, bearing: 300 },
    marker: [31.1342, 29.9792],
  },
  {
    act: 2, city: 'Tokyo', loc: 'Tokyo, Japon', type: 'anagram',
    title: 'Le carrefour brouillé',
    text: 'Le nom du quartier le plus fréquenté de Tokyo a été mélangé. Remettez les lettres dans l’ordre :',
    scramble: 'A · H · U · B · Y · S · I',
    accept: ['shibuya'],
    hint: 'Le plus célèbre carrefour piéton du monde s’y trouve.',
    digit: '2',
    lore: 'Une photo du carrefour, punaisée au mur. Dessous, une note : « Dans la foule, on disparaît. C’est ce que j’ai fait. »',
    reward: 'Les néons du carrefour clignotent et composent un chiffre.',
    view: { center: [139.7005, 35.6595], zoom: 16, pitch: 60, bearing: -20 },
    marker: [139.7005, 35.6595],
  },
  // ─────────────── ACTE III ───────────────
  {
    act: 3, city: 'Reykjavik', loc: 'Reykjavik, Islande', type: 'locate',
    title: 'L’atelier secret',
    text: 'Le repaire du Cartographe se trouve sur le petit aéroport au sud du centre de Reykjavik. Déplacez la carte et cliquez pour poser votre marqueur dessus.',
    target: [-21.9406, 64.1300],
    toleranceM: 1300,
    hint: 'Juste au sud du centre-ville, au bord de l’eau : la piste et les hangars de l’aéroport domestique.',
    digit: '6',
    lore: 'La dernière ligne de sa lettre : « Quand tu liras ceci, je serai déjà une légende. L’atelier t’attend, au bout du monde. »',
    reward: 'La porte d’un hangar s’entrouvre sur un vieux coffre de laiton.',
    view: { center: [-21.94, 64.14], zoom: 12, pitch: 30, bearing: 0 },
  },
]

export const FINAL_CODE = STEPS.map((s) => s.digit).join('') // "7319426"

/* ── Table Morse (référence affichable) ── */
export const MORSE_TABLE: Record<string, string> = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....',
  I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.',
  Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-',
  Y: '-.--', Z: '--..',
}

/* ── Helpers ── */
export function normalize(s: string): string {
  return (s || '').toLowerCase().trim().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ')
}

export function haversineM(a: [number, number], b: [number, number]): number {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b[1] - a[1])
  const dLng = toRad(b[0] - a[0])
  const la1 = toRad(a[1]), la2 = toRad(b[1])
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export function fmtDist(m: number): string {
  return m >= 1000 ? (m / 1000).toFixed(1) + ' km' : Math.round(m) + ' m'
}

export type SaveData = { stepIndex: number; earned: string[]; elapsed: number; hintsUsed: number }
export const SAVE_KEY = 'jeu_cartographe_save_v1'
