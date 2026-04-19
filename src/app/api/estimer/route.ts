import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface EstimationRequest {
  ville: string
  surface: number
  pieces: number
  categorie: string
  type: 'vente' | 'location'
  etat: 'neuf' | 'bon' | 'travaux'
}

// ─── Prix de référence réalistes par département (€/m² vente & €/m²/mois location) ───
const PRIX_DEPT: Record<string, { vente: Record<string, number>; location: Record<string, number> }> = {
  '75': { vente: { appartement: 10200, maison: 11000, bureau: 8500, terrain: 4000, local: 6000 }, location: { appartement: 32, maison: 28, bureau: 30, terrain: 4, local: 22 } },
  '92': { vente: { appartement: 7200, maison: 7800, bureau: 6000, terrain: 2500, local: 5000 }, location: { appartement: 24, maison: 20, bureau: 22, terrain: 3, local: 16 } },
  '94': { vente: { appartement: 5600, maison: 5800, bureau: 4500, terrain: 1800, local: 3500 }, location: { appartement: 19, maison: 16, bureau: 18, terrain: 2, local: 12 } },
  '93': { vente: { appartement: 3800, maison: 3600, bureau: 3000, terrain: 800,  local: 2500 }, location: { appartement: 14, maison: 12, bureau: 13, terrain: 1, local: 9  } },
  '77': { vente: { appartement: 3000, maison: 2900, bureau: 2500, terrain: 250,  local: 2000 }, location: { appartement: 12, maison: 10, bureau: 12, terrain: 1, local: 8  } },
  '78': { vente: { appartement: 3600, maison: 3800, bureau: 3000, terrain: 350,  local: 2500 }, location: { appartement: 14, maison: 13, bureau: 14, terrain: 1, local: 9  } },
  '91': { vente: { appartement: 2900, maison: 2800, bureau: 2400, terrain: 200,  local: 1900 }, location: { appartement: 12, maison: 10, bureau: 11, terrain: 1, local: 7  } },
  '95': { vente: { appartement: 2900, maison: 2800, bureau: 2400, terrain: 200,  local: 1900 }, location: { appartement: 12, maison: 10, bureau: 11, terrain: 1, local: 7  } },
  '06': { vente: { appartement: 4800, maison: 5200, bureau: 4000, terrain: 600,  local: 3500 }, location: { appartement: 17, maison: 15, bureau: 18, terrain: 2, local: 12 } },
  '13': { vente: { appartement: 3600, maison: 3800, bureau: 3000, terrain: 300,  local: 2500 }, location: { appartement: 14, maison: 12, bureau: 14, terrain: 1, local: 9  } },
  '69': { vente: { appartement: 4200, maison: 4400, bureau: 3500, terrain: 400,  local: 3000 }, location: { appartement: 15, maison: 14, bureau: 16, terrain: 2, local: 11 } },
  '31': { vente: { appartement: 3400, maison: 3300, bureau: 2800, terrain: 250,  local: 2500 }, location: { appartement: 13, maison: 11, bureau: 13, terrain: 1, local: 9  } },
  '33': { vente: { appartement: 3800, maison: 3600, bureau: 3000, terrain: 350,  local: 2800 }, location: { appartement: 14, maison: 12, bureau: 14, terrain: 1, local: 10 } },
  '44': { vente: { appartement: 3500, maison: 3300, bureau: 2800, terrain: 280,  local: 2500 }, location: { appartement: 13, maison: 11, bureau: 13, terrain: 1, local: 9  } },
  '35': { vente: { appartement: 3000, maison: 2900, bureau: 2400, terrain: 200,  local: 2000 }, location: { appartement: 12, maison: 10, bureau: 12, terrain: 1, local: 8  } },
  '34': { vente: { appartement: 3200, maison: 3000, bureau: 2600, terrain: 250,  local: 2400 }, location: { appartement: 13, maison: 11, bureau: 13, terrain: 1, local: 9  } },
  '67': { vente: { appartement: 3100, maison: 3000, bureau: 2600, terrain: 250,  local: 2200 }, location: { appartement: 12, maison: 11, bureau: 13, terrain: 1, local: 8  } },
  '59': { vente: { appartement: 2200, maison: 2100, bureau: 1800, terrain: 120,  local: 1500 }, location: { appartement: 10, maison: 9,  bureau: 10, terrain: 1, local: 7  } },
  '76': { vente: { appartement: 2400, maison: 2200, bureau: 1900, terrain: 150,  local: 1600 }, location: { appartement: 11, maison: 9,  bureau: 10, terrain: 1, local: 7  } },
  '57': { vente: { appartement: 1900, maison: 1800, bureau: 1600, terrain: 100,  local: 1300 }, location: { appartement: 9,  maison: 8,  bureau: 9,  terrain: 1, local: 6  } },
  '54': { vente: { appartement: 1900, maison: 1800, bureau: 1600, terrain: 100,  local: 1300 }, location: { appartement: 9,  maison: 8,  bureau: 9,  terrain: 1, local: 6  } },
  '63': { vente: { appartement: 2200, maison: 2000, bureau: 1800, terrain: 120,  local: 1500 }, location: { appartement: 10, maison: 8,  bureau: 10, terrain: 1, local: 7  } },
  '38': { vente: { appartement: 2800, maison: 2900, bureau: 2400, terrain: 200,  local: 2000 }, location: { appartement: 12, maison: 11, bureau: 12, terrain: 1, local: 8  } },
  '74': { vente: { appartement: 4500, maison: 4800, bureau: 3800, terrain: 500,  local: 3000 }, location: { appartement: 16, maison: 15, bureau: 17, terrain: 2, local: 11 } },
  '73': { vente: { appartement: 3500, maison: 3200, bureau: 2800, terrain: 300,  local: 2200 }, location: { appartement: 13, maison: 11, bureau: 13, terrain: 1, local: 8  } },
  '83': { vente: { appartement: 4000, maison: 4200, bureau: 3300, terrain: 450,  local: 2800 }, location: { appartement: 15, maison: 13, bureau: 15, terrain: 2, local: 10 } },
  '84': { vente: { appartement: 2800, maison: 3000, bureau: 2300, terrain: 280,  local: 2000 }, location: { appartement: 12, maison: 11, bureau: 12, terrain: 1, local: 8  } },
  '30': { vente: { appartement: 2400, maison: 2200, bureau: 1900, terrain: 160,  local: 1700 }, location: { appartement: 11, maison: 9,  bureau: 10, terrain: 1, local: 7  } },
  '11': { vente: { appartement: 1800, maison: 1700, bureau: 1500, terrain: 90,   local: 1200 }, location: { appartement: 9,  maison: 8,  bureau: 9,  terrain: 1, local: 6  } },
  '66': { vente: { appartement: 2400, maison: 2300, bureau: 1900, terrain: 150,  local: 1700 }, location: { appartement: 11, maison: 9,  bureau: 10, terrain: 1, local: 7  } },
  '64': { vente: { appartement: 3200, maison: 3400, bureau: 2700, terrain: 280,  local: 2300 }, location: { appartement: 13, maison: 12, bureau: 13, terrain: 1, local: 9  } },
  '40': { vente: { appartement: 3000, maison: 3200, bureau: 2500, terrain: 250,  local: 2200 }, location: { appartement: 12, maison: 11, bureau: 12, terrain: 1, local: 8  } },
  '47': { vente: { appartement: 1800, maison: 1700, bureau: 1500, terrain: 90,   local: 1200 }, location: { appartement: 9,  maison: 8,  bureau: 8,  terrain: 1, local: 6  } },
  '24': { vente: { appartement: 1700, maison: 1600, bureau: 1400, terrain: 80,   local: 1100 }, location: { appartement: 8,  maison: 7,  bureau: 8,  terrain: 1, local: 5  } },
  '87': { vente: { appartement: 1800, maison: 1700, bureau: 1500, terrain: 90,   local: 1200 }, location: { appartement: 9,  maison: 8,  bureau: 8,  terrain: 1, local: 6  } },
  '86': { vente: { appartement: 1900, maison: 1800, bureau: 1600, terrain: 100,  local: 1300 }, location: { appartement: 9,  maison: 8,  bureau: 9,  terrain: 1, local: 6  } },
  '79': { vente: { appartement: 1800, maison: 1700, bureau: 1500, terrain: 90,   local: 1200 }, location: { appartement: 8,  maison: 7,  bureau: 8,  terrain: 1, local: 5  } },
  '37': { vente: { appartement: 2600, maison: 2500, bureau: 2100, terrain: 170,  local: 1800 }, location: { appartement: 11, maison: 10, bureau: 11, terrain: 1, local: 7  } },
  '49': { vente: { appartement: 2400, maison: 2300, bureau: 1900, terrain: 150,  local: 1700 }, location: { appartement: 11, maison: 9,  bureau: 10, terrain: 1, local: 7  } },
  '72': { vente: { appartement: 2000, maison: 1900, bureau: 1600, terrain: 110,  local: 1400 }, location: { appartement: 9,  maison: 8,  bureau: 9,  terrain: 1, local: 6  } },
  '53': { vente: { appartement: 1700, maison: 1600, bureau: 1400, terrain: 80,   local: 1100 }, location: { appartement: 8,  maison: 7,  bureau: 8,  terrain: 1, local: 5  } },
  '61': { vente: { appartement: 1600, maison: 1500, bureau: 1300, terrain: 70,   local: 1000 }, location: { appartement: 8,  maison: 7,  bureau: 7,  terrain: 1, local: 5  } },
  '14': { vente: { appartement: 2800, maison: 2600, bureau: 2200, terrain: 180,  local: 1900 }, location: { appartement: 12, maison: 10, bureau: 11, terrain: 1, local: 8  } },
  '50': { vente: { appartement: 1900, maison: 1800, bureau: 1500, terrain: 100,  local: 1300 }, location: { appartement: 9,  maison: 8,  bureau: 8,  terrain: 1, local: 6  } },
  '22': { vente: { appartement: 2200, maison: 2100, bureau: 1800, terrain: 130,  local: 1500 }, location: { appartement: 10, maison: 9,  bureau: 9,  terrain: 1, local: 6  } },
  '29': { vente: { appartement: 2100, maison: 2000, bureau: 1700, terrain: 120,  local: 1400 }, location: { appartement: 10, maison: 8,  bureau: 9,  terrain: 1, local: 6  } },
  '56': { vente: { appartement: 2600, maison: 2700, bureau: 2100, terrain: 200,  local: 1800 }, location: { appartement: 11, maison: 10, bureau: 11, terrain: 1, local: 7  } },
  '21': { vente: { appartement: 2400, maison: 2200, bureau: 1900, terrain: 150,  local: 1700 }, location: { appartement: 11, maison: 9,  bureau: 10, terrain: 1, local: 7  } },
  '51': { vente: { appartement: 2100, maison: 2000, bureau: 1700, terrain: 120,  local: 1400 }, location: { appartement: 10, maison: 8,  bureau: 9,  terrain: 1, local: 6  } },
  '08': { vente: { appartement: 1200, maison: 1100, bureau: 1000, terrain: 50,   local: 800  }, location: { appartement: 7,  maison: 6,  bureau: 7,  terrain: 1, local: 4  } },
  '68': { vente: { appartement: 2600, maison: 2500, bureau: 2100, terrain: 180,  local: 1900 }, location: { appartement: 11, maison: 10, bureau: 11, terrain: 1, local: 7  } },
  '25': { vente: { appartement: 2300, maison: 2200, bureau: 1900, terrain: 150,  local: 1600 }, location: { appartement: 11, maison: 9,  bureau: 10, terrain: 1, local: 7  } },
  '39': { vente: { appartement: 1800, maison: 1700, bureau: 1500, terrain: 100,  local: 1200 }, location: { appartement: 9,  maison: 8,  bureau: 8,  terrain: 1, local: 6  } },
  '70': { vente: { appartement: 1500, maison: 1400, bureau: 1200, terrain: 65,   local: 1000 }, location: { appartement: 8,  maison: 7,  bureau: 7,  terrain: 1, local: 5  } },
  '90': { vente: { appartement: 1900, maison: 1800, bureau: 1600, terrain: 110,  local: 1300 }, location: { appartement: 9,  maison: 8,  bureau: 9,  terrain: 1, local: 6  } },
  '01': { vente: { appartement: 2600, maison: 2800, bureau: 2200, terrain: 200,  local: 1900 }, location: { appartement: 11, maison: 10, bureau: 12, terrain: 1, local: 8  } },
  '26': { vente: { appartement: 2200, maison: 2100, bureau: 1800, terrain: 130,  local: 1600 }, location: { appartement: 10, maison: 9,  bureau: 10, terrain: 1, local: 7  } },
  '07': { vente: { appartement: 1900, maison: 2000, bureau: 1600, terrain: 120,  local: 1400 }, location: { appartement: 9,  maison: 8,  bureau: 9,  terrain: 1, local: 6  } },
  '42': { vente: { appartement: 2000, maison: 1900, bureau: 1700, terrain: 110,  local: 1400 }, location: { appartement: 10, maison: 8,  bureau: 9,  terrain: 1, local: 6  } },
  '43': { vente: { appartement: 1800, maison: 1700, bureau: 1500, terrain: 95,   local: 1200 }, location: { appartement: 9,  maison: 7,  bureau: 8,  terrain: 1, local: 6  } },
  '15': { vente: { appartement: 1500, maison: 1400, bureau: 1200, terrain: 65,   local: 1000 }, location: { appartement: 8,  maison: 7,  bureau: 7,  terrain: 1, local: 5  } },
  '03': { vente: { appartement: 1400, maison: 1300, bureau: 1100, terrain: 60,   local: 900  }, location: { appartement: 7,  maison: 6,  bureau: 7,  terrain: 1, local: 5  } },
  '18': { vente: { appartement: 1600, maison: 1500, bureau: 1300, terrain: 75,   local: 1100 }, location: { appartement: 8,  maison: 7,  bureau: 8,  terrain: 1, local: 5  } },
  '45': { vente: { appartement: 2000, maison: 1900, bureau: 1600, terrain: 115,  local: 1400 }, location: { appartement: 9,  maison: 8,  bureau: 9,  terrain: 1, local: 6  } },
  '28': { vente: { appartement: 2200, maison: 2100, bureau: 1800, terrain: 140,  local: 1500 }, location: { appartement: 10, maison: 9,  bureau: 10, terrain: 1, local: 7  } },
  '41': { vente: { appartement: 1900, maison: 1800, bureau: 1500, terrain: 100,  local: 1300 }, location: { appartement: 9,  maison: 8,  bureau: 8,  terrain: 1, local: 6  } },
  '71': { vente: { appartement: 1800, maison: 1700, bureau: 1500, terrain: 90,   local: 1200 }, location: { appartement: 9,  maison: 8,  bureau: 8,  terrain: 1, local: 6  } },
  '58': { vente: { appartement: 1400, maison: 1300, bureau: 1100, terrain: 60,   local: 900  }, location: { appartement: 7,  maison: 6,  bureau: 7,  terrain: 1, local: 5  } },
  '89': { vente: { appartement: 1600, maison: 1500, bureau: 1300, terrain: 75,   local: 1100 }, location: { appartement: 8,  maison: 7,  bureau: 7,  terrain: 1, local: 5  } },
  '36': { vente: { appartement: 1200, maison: 1100, bureau: 1000, terrain: 50,   local: 800  }, location: { appartement: 7,  maison: 6,  bureau: 6,  terrain: 1, local: 4  } },
  '23': { vente: { appartement: 1100, maison: 1000, bureau: 900,  terrain: 40,   local: 700  }, location: { appartement: 6,  maison: 5,  bureau: 6,  terrain: 1, local: 4  } },
  '19': { vente: { appartement: 1500, maison: 1400, bureau: 1200, terrain: 70,   local: 1000 }, location: { appartement: 8,  maison: 7,  bureau: 7,  terrain: 1, local: 5  } },
  '46': { vente: { appartement: 1600, maison: 1600, bureau: 1300, terrain: 80,   local: 1100 }, location: { appartement: 8,  maison: 7,  bureau: 8,  terrain: 1, local: 5  } },
  '12': { vente: { appartement: 1600, maison: 1500, bureau: 1300, terrain: 75,   local: 1100 }, location: { appartement: 8,  maison: 7,  bureau: 8,  terrain: 1, local: 5  } },
  '48': { vente: { appartement: 1400, maison: 1400, bureau: 1200, terrain: 65,   local: 1000 }, location: { appartement: 7,  maison: 7,  bureau: 7,  terrain: 1, local: 5  } },
  '81': { vente: { appartement: 1900, maison: 1800, bureau: 1600, terrain: 100,  local: 1300 }, location: { appartement: 9,  maison: 8,  bureau: 8,  terrain: 1, local: 6  } },
  '82': { vente: { appartement: 1800, maison: 1700, bureau: 1500, terrain: 90,   local: 1200 }, location: { appartement: 9,  maison: 7,  bureau: 8,  terrain: 1, local: 6  } },
  '32': { vente: { appartement: 1700, maison: 1700, bureau: 1400, terrain: 90,   local: 1200 }, location: { appartement: 8,  maison: 7,  bureau: 8,  terrain: 1, local: 5  } },
  '65': { vente: { appartement: 1800, maison: 1700, bureau: 1500, terrain: 95,   local: 1200 }, location: { appartement: 9,  maison: 7,  bureau: 8,  terrain: 1, local: 6  } },
  '09': { vente: { appartement: 1300, maison: 1200, bureau: 1100, terrain: 55,   local: 900  }, location: { appartement: 7,  maison: 6,  bureau: 7,  terrain: 1, local: 4  } },
  '02': { vente: { appartement: 1600, maison: 1500, bureau: 1300, terrain: 75,   local: 1100 }, location: { appartement: 8,  maison: 7,  bureau: 8,  terrain: 1, local: 5  } },
  '60': { vente: { appartement: 2200, maison: 2200, bureau: 1800, terrain: 140,  local: 1600 }, location: { appartement: 10, maison: 9,  bureau: 10, terrain: 1, local: 7  } },
  '80': { vente: { appartement: 1900, maison: 1800, bureau: 1600, terrain: 100,  local: 1300 }, location: { appartement: 9,  maison: 8,  bureau: 9,  terrain: 1, local: 6  } },
  '62': { vente: { appartement: 1800, maison: 1700, bureau: 1500, terrain: 90,   local: 1200 }, location: { appartement: 9,  maison: 8,  bureau: 8,  terrain: 1, local: 6  } },
  '10': { vente: { appartement: 1800, maison: 1700, bureau: 1500, terrain: 90,   local: 1200 }, location: { appartement: 9,  maison: 8,  bureau: 8,  terrain: 1, local: 6  } },
  '52': { vente: { appartement: 1200, maison: 1100, bureau: 1000, terrain: 50,   local: 800  }, location: { appartement: 7,  maison: 6,  bureau: 6,  terrain: 1, local: 4  } },
  '55': { vente: { appartement: 1200, maison: 1100, bureau: 1000, terrain: 50,   local: 800  }, location: { appartement: 7,  maison: 6,  bureau: 6,  terrain: 1, local: 4  } },
  '88': { vente: { appartement: 1400, maison: 1300, bureau: 1100, terrain: 60,   local: 900  }, location: { appartement: 7,  maison: 6,  bureau: 7,  terrain: 1, local: 5  } },
  '04': { vente: { appartement: 2200, maison: 2300, bureau: 1800, terrain: 150,  local: 1600 }, location: { appartement: 10, maison: 9,  bureau: 10, terrain: 1, local: 7  } },
  '05': { vente: { appartement: 2800, maison: 2900, bureau: 2300, terrain: 220,  local: 2000 }, location: { appartement: 12, maison: 11, bureau: 11, terrain: 1, local: 8  } },
  '2A': { vente: { appartement: 3200, maison: 3400, bureau: 2700, terrain: 280,  local: 2300 }, location: { appartement: 13, maison: 12, bureau: 13, terrain: 1, local: 9  } },
  '2B': { vente: { appartement: 2800, maison: 3000, bureau: 2400, terrain: 220,  local: 2000 }, location: { appartement: 12, maison: 11, bureau: 12, terrain: 1, local: 8  } },
  '971': { vente: { appartement: 2600, maison: 2800, bureau: 2200, terrain: 200, local: 1900 }, location: { appartement: 11, maison: 10, bureau: 11, terrain: 1, local: 8  } },
  '972': { vente: { appartement: 2500, maison: 2700, bureau: 2100, terrain: 190, local: 1800 }, location: { appartement: 11, maison: 10, bureau: 11, terrain: 1, local: 7  } },
  '973': { vente: { appartement: 2000, maison: 2200, bureau: 1700, terrain: 130, local: 1500 }, location: { appartement: 9,  maison: 9,  bureau: 9,  terrain: 1, local: 6  } },
  '974': { vente: { appartement: 2800, maison: 3000, bureau: 2400, terrain: 220, local: 2000 }, location: { appartement: 12, maison: 11, bureau: 12, terrain: 1, local: 8  } },
  '976': { vente: { appartement: 1800, maison: 1900, bureau: 1500, terrain: 100, local: 1300 }, location: { appartement: 9,  maison: 8,  bureau: 8,  terrain: 1, local: 6  } },
}

// Prix overrides pour les grandes villes (plus précis)
const PRIX_VILLE: Record<string, { vente: Record<string, number>; location: Record<string, number> }> = {
  'paris':        { vente: { appartement: 10200, maison: 12000, bureau: 9000, terrain: 5000, local: 6500 }, location: { appartement: 33, maison: 30, bureau: 32, terrain: 5, local: 24 } },
  'lyon':         { vente: { appartement: 4400, maison: 4600, bureau: 3600, terrain: 450,  local: 3100 }, location: { appartement: 15, maison: 14, bureau: 16, terrain: 2, local: 11 } },
  'marseille':    { vente: { appartement: 3500, maison: 3700, bureau: 2900, terrain: 320,  local: 2500 }, location: { appartement: 13, maison: 12, bureau: 13, terrain: 1, local: 9  } },
  'toulouse':     { vente: { appartement: 3500, maison: 3400, bureau: 2800, terrain: 280,  local: 2500 }, location: { appartement: 14, maison: 12, bureau: 13, terrain: 1, local: 9  } },
  'bordeaux':     { vente: { appartement: 4000, maison: 4100, bureau: 3300, terrain: 400,  local: 2900 }, location: { appartement: 15, maison: 13, bureau: 14, terrain: 1, local: 10 } },
  'nantes':       { vente: { appartement: 3700, maison: 3500, bureau: 2900, terrain: 310,  local: 2600 }, location: { appartement: 14, maison: 12, bureau: 13, terrain: 1, local: 9  } },
  'strasbourg':   { vente: { appartement: 3300, maison: 3200, bureau: 2700, terrain: 270,  local: 2300 }, location: { appartement: 13, maison: 11, bureau: 13, terrain: 1, local: 9  } },
  'montpellier':  { vente: { appartement: 3300, maison: 3100, bureau: 2700, terrain: 260,  local: 2400 }, location: { appartement: 13, maison: 11, bureau: 13, terrain: 1, local: 9  } },
  'rennes':       { vente: { appartement: 3400, maison: 3200, bureau: 2700, terrain: 270,  local: 2400 }, location: { appartement: 13, maison: 11, bureau: 13, terrain: 1, local: 9  } },
  'lille':        { vente: { appartement: 3100, maison: 2900, bureau: 2500, terrain: 230,  local: 2100 }, location: { appartement: 13, maison: 11, bureau: 12, terrain: 1, local: 8  } },
  'nice':         { vente: { appartement: 5200, maison: 5600, bureau: 4200, terrain: 700,  local: 3800 }, location: { appartement: 18, maison: 16, bureau: 19, terrain: 2, local: 13 } },
  'grenoble':     { vente: { appartement: 2900, maison: 3000, bureau: 2400, terrain: 210,  local: 2000 }, location: { appartement: 12, maison: 11, bureau: 12, terrain: 1, local: 8  } },
  'reims':        { vente: { appartement: 2200, maison: 2100, bureau: 1800, terrain: 130,  local: 1500 }, location: { appartement: 10, maison: 9,  bureau: 10, terrain: 1, local: 7  } },
  'dijon':        { vente: { appartement: 2600, maison: 2400, bureau: 2100, terrain: 170,  local: 1800 }, location: { appartement: 11, maison: 9,  bureau: 10, terrain: 1, local: 7  } },
  'angers':       { vente: { appartement: 2700, maison: 2600, bureau: 2200, terrain: 190,  local: 1900 }, location: { appartement: 12, maison: 10, bureau: 11, terrain: 1, local: 8  } },
  'tours':        { vente: { appartement: 2700, maison: 2600, bureau: 2200, terrain: 185,  local: 1900 }, location: { appartement: 11, maison: 10, bureau: 11, terrain: 1, local: 7  } },
  'clermont-ferrand': { vente: { appartement: 2200, maison: 2100, bureau: 1800, terrain: 130, local: 1500 }, location: { appartement: 10, maison: 8, bureau: 10, terrain: 1, local: 7 } },
  'le mans':      { vente: { appartement: 2100, maison: 2000, bureau: 1700, terrain: 115,  local: 1400 }, location: { appartement: 9,  maison: 8,  bureau: 9,  terrain: 1, local: 6  } },
  'caen':         { vente: { appartement: 2900, maison: 2700, bureau: 2300, terrain: 200,  local: 2000 }, location: { appartement: 12, maison: 10, bureau: 11, terrain: 1, local: 8  } },
  'rouen':        { vente: { appartement: 2600, maison: 2400, bureau: 2100, terrain: 165,  local: 1800 }, location: { appartement: 11, maison: 9,  bureau: 10, terrain: 1, local: 7  } },
  'metz':         { vente: { appartement: 2100, maison: 2000, bureau: 1700, terrain: 115,  local: 1400 }, location: { appartement: 10, maison: 8,  bureau: 9,  terrain: 1, local: 6  } },
  'nancy':        { vente: { appartement: 2000, maison: 1900, bureau: 1600, terrain: 110,  local: 1400 }, location: { appartement: 10, maison: 8,  bureau: 9,  terrain: 1, local: 6  } },
  'mulhouse':     { vente: { appartement: 1800, maison: 1700, bureau: 1500, terrain: 90,   local: 1200 }, location: { appartement: 9,  maison: 8,  bureau: 8,  terrain: 1, local: 6  } },
  'brest':        { vente: { appartement: 2200, maison: 2100, bureau: 1800, terrain: 130,  local: 1500 }, location: { appartement: 10, maison: 8,  bureau: 9,  terrain: 1, local: 6  } },
  'le havre':     { vente: { appartement: 2100, maison: 2000, bureau: 1700, terrain: 115,  local: 1400 }, location: { appartement: 10, maison: 8,  bureau: 9,  terrain: 1, local: 6  } },
  'toulon':       { vente: { appartement: 3200, maison: 3400, bureau: 2700, terrain: 280,  local: 2300 }, location: { appartement: 13, maison: 12, bureau: 13, terrain: 1, local: 9  } },
  'aix-en-provence': { vente: { appartement: 4500, maison: 5000, bureau: 3800, terrain: 600, local: 3300 }, location: { appartement: 16, maison: 14, bureau: 16, terrain: 2, local: 11 } },
  'saint-etienne': { vente: { appartement: 1500, maison: 1400, bureau: 1200, terrain: 65,  local: 1000 }, location: { appartement: 8,  maison: 7,  bureau: 7,  terrain: 1, local: 5  } },
  'pau':          { vente: { appartement: 2200, maison: 2300, bureau: 1900, terrain: 145,  local: 1600 }, location: { appartement: 10, maison: 9,  bureau: 10, terrain: 1, local: 7  } },
  'perpignan':    { vente: { appartement: 2100, maison: 2000, bureau: 1700, terrain: 120,  local: 1500 }, location: { appartement: 10, maison: 8,  bureau: 9,  terrain: 1, local: 6  } },
  'besancon':     { vente: { appartement: 2400, maison: 2300, bureau: 1900, terrain: 155,  local: 1700 }, location: { appartement: 11, maison: 9,  bureau: 10, terrain: 1, local: 7  } },
  'avignon':      { vente: { appartement: 2700, maison: 2900, bureau: 2200, terrain: 210,  local: 1900 }, location: { appartement: 12, maison: 10, bureau: 11, terrain: 1, local: 8  } },
  'limoges':      { vente: { appartement: 1800, maison: 1700, bureau: 1500, terrain: 90,   local: 1200 }, location: { appartement: 9,  maison: 8,  bureau: 8,  terrain: 1, local: 6  } },
  'poitiers':     { vente: { appartement: 2000, maison: 1900, bureau: 1600, terrain: 110,  local: 1400 }, location: { appartement: 9,  maison: 8,  bureau: 9,  terrain: 1, local: 6  } },
  'amiens':       { vente: { appartement: 2000, maison: 1900, bureau: 1600, terrain: 110,  local: 1400 }, location: { appartement: 9,  maison: 8,  bureau: 9,  terrain: 1, local: 6  } },
  'villeurbanne': { vente: { appartement: 3800, maison: 3900, bureau: 3100, terrain: 380,  local: 2700 }, location: { appartement: 14, maison: 13, bureau: 14, terrain: 1, local: 10 } },
  'nimes':        { vente: { appartement: 2300, maison: 2200, bureau: 1900, terrain: 145,  local: 1700 }, location: { appartement: 11, maison: 9,  bureau: 10, terrain: 1, local: 7  } },
  'annecy':       { vente: { appartement: 5000, maison: 5200, bureau: 4100, terrain: 650,  local: 3500 }, location: { appartement: 17, maison: 16, bureau: 18, terrain: 2, local: 12 } },
  'chambery':     { vente: { appartement: 3200, maison: 3000, bureau: 2600, terrain: 260,  local: 2300 }, location: { appartement: 13, maison: 11, bureau: 12, terrain: 1, local: 8  } },
  'bayonne':      { vente: { appartement: 4000, maison: 4200, bureau: 3300, terrain: 430,  local: 2900 }, location: { appartement: 15, maison: 14, bureau: 15, terrain: 2, local: 10 } },
  'biarritz':     { vente: { appartement: 6000, maison: 6500, bureau: 5000, terrain: 900,  local: 4500 }, location: { appartement: 22, maison: 20, bureau: 22, terrain: 3, local: 15 } },
  'saint-malo':   { vente: { appartement: 4500, maison: 4800, bureau: 3600, terrain: 550,  local: 3200 }, location: { appartement: 16, maison: 15, bureau: 16, terrain: 2, local: 11 } },
  'la rochelle':  { vente: { appartement: 3800, maison: 4000, bureau: 3100, terrain: 390,  local: 2700 }, location: { appartement: 14, maison: 13, bureau: 14, terrain: 1, local: 10 } },
  'antibes':      { vente: { appartement: 5500, maison: 6000, bureau: 4500, terrain: 800,  local: 4000 }, location: { appartement: 19, maison: 18, bureau: 20, terrain: 2, local: 14 } },
  'cannes':       { vente: { appartement: 6500, maison: 7500, bureau: 5500, terrain: 1000, local: 5000 }, location: { appartement: 24, maison: 22, bureau: 25, terrain: 3, local: 17 } },
  'monaco':       { vente: { appartement: 50000, maison: 60000, bureau: 40000, terrain: 20000, local: 30000 }, location: { appartement: 120, maison: 100, bureau: 100, terrain: 10, local: 80 } },
}

// Fallback national
const FALLBACK_NATIONAL = {
  vente:    { appartement: 2800, maison: 2600, bureau: 2300, terrain: 120, local: 1900, parking: 15000 },
  location: { appartement: 11,   maison: 9,    bureau: 10,   terrain: 1,   local: 7,    parking: 80    },
}

async function getVillePriceRef(ville: string, categorie: string, type: 'vente' | 'location'): Promise<{ pricePerM2: number; source: string }> {
  const villeNorm = ville.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '').trim()

  // 1. Chercher dans les overrides par ville
  for (const [key, data] of Object.entries(PRIX_VILLE)) {
    if (villeNorm.includes(key) || key.includes(villeNorm)) {
      const prix = data[type][categorie]
      if (prix) return { pricePerM2: prix, source: 'ville' }
    }
  }

  // 2. Géocoder la ville pour obtenir le département
  try {
    const geoRes = await fetch(
      `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(ville)}&fields=codeDepartement&boost=population&limit=1`,
      { signal: AbortSignal.timeout(3000) }
    )
    if (geoRes.ok) {
      const geoData = await geoRes.json()
      if (geoData.length > 0) {
        const dept = geoData[0].codeDepartement as string
        const deptData = PRIX_DEPT[dept]
        if (deptData) {
          const prix = deptData[type][categorie]
          if (prix) return { pricePerM2: prix, source: `dept-${dept}` }
        }
      }
    }
  } catch {
    // silently ignore timeout/network errors
  }

  // 3. Fallback national
  const cat = categorie as keyof typeof FALLBACK_NATIONAL.vente
  const prix = FALLBACK_NATIONAL[type][cat] ?? (type === 'location' ? 11 : 2800)
  return { pricePerM2: prix, source: 'national' }
}

export async function POST(req: NextRequest) {
  try {
    const body: EstimationRequest = await req.json()
    const { ville, surface, pieces, categorie, type, etat } = body

    if (!ville || !surface || surface <= 0) {
      return NextResponse.json({ error: 'Données insuffisantes' }, { status: 400 })
    }

    const supabase = await createClient()

    // ─── 1. Biens comparables sur Terranova ───────────────────────────
    const { data: comparablesVille } = await supabase
      .from('biens_publics')
      .select('prix, surface, categorie, type, ville')
      .ilike('ville', `%${ville}%`)
      .eq('type', type)
      .not('surface', 'is', null)
      .gt('surface', 0)
      .limit(80)

    let priceFromDB: number | null = null
    let nbComparables = 0

    if (comparablesVille && comparablesVille.length > 0) {
      let filtered = comparablesVille
      const catFiltered = comparablesVille.filter(b => b.categorie === categorie)
      if (catFiltered.length >= 3) filtered = catFiltered

      const prices = filtered
        .filter(b => b.surface && b.prix && b.surface > 5)
        .map(b => b.prix / b.surface!)
        .sort((a, b) => a - b)

      if (prices.length >= 2) {
        const start = Math.floor(prices.length * 0.1)
        const end = Math.ceil(prices.length * 0.9)
        const trimmed = prices.slice(start, end)
        priceFromDB = trimmed.reduce((s, p) => s + p, 0) / trimmed.length
        nbComparables = filtered.length
      }
    }

    // ─── 2. Prix de référence (ville → dept → national) ───────────────
    const { pricePerM2: refPrice, source: refSource } = await getVillePriceRef(ville, categorie, type)

    // ─── 3. Fusion : les données Terranova pondèrent la référence ──────
    let pricePerM2: number
    let dataSource: string

    if (priceFromDB !== null && nbComparables >= 10) {
      // Beaucoup de données locales → on leur fait confiance
      pricePerM2 = priceFromDB
      dataSource = 'terranova'
    } else if (priceFromDB !== null && nbComparables >= 3) {
      // Quelques données : on blende 40% Terranova + 60% référence
      pricePerM2 = priceFromDB * 0.40 + refPrice * 0.60
      dataSource = 'blend'
    } else {
      // Pas assez de données locales → référence marché
      pricePerM2 = refPrice
      dataSource = refSource
    }

    // Parking : prix total, pas au m²
    let basePrice: number
    if (categorie === 'parking') {
      basePrice = type === 'location' ? 120 : 18000
      if (ville) {
        const { pricePerM2: parkRef } = await getVillePriceRef(ville, 'parking', type)
        basePrice = parkRef
      }
    } else {
      basePrice = pricePerM2 * surface
    }

    // ─── 4. Ajustements qualitatifs ───────────────────────────────────
    const etatMultiplier: Record<string, number> = { neuf: 1.15, bon: 1.0, travaux: 0.82 }
    basePrice *= etatMultiplier[etat] ?? 1.0

    // Bonus/malus pièces
    if (pieces > 0 && !['terrain', 'parking', 'bureau', 'local'].includes(categorie)) {
      const piecesRef = categorie === 'appartement' ? 2.5 : 4
      const delta = (pieces - piecesRef) * 0.015
      basePrice *= (1 + Math.max(-0.10, Math.min(0.10, delta)))
    }

    // ─── 5. Fourchette & confiance ────────────────────────────────────
    const confidence = nbComparables >= 10 ? 'high' : nbComparables >= 3 ? 'medium' : 'low'
    const margin = confidence === 'high' ? 0.06 : confidence === 'medium' ? 0.10 : 0.15

    const low      = Math.round(basePrice * (1 - margin) / 1000) * 1000
    const high     = Math.round(basePrice * (1 + margin) / 1000) * 1000
    const estimate = Math.round(basePrice / 1000) * 1000

    return NextResponse.json({
      estimate,
      low,
      high,
      pricePerM2: Math.round(pricePerM2),
      nbComparables,
      confidence,
      dataSource,
      ville,
      surface,
      type,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
