import { describe, it, expect } from 'vitest'
import { DEFAULT_PLAN_CONFIG, featuresVendables, getEffectivePlan, ALL_FEATURES } from '@/lib/plan'
import { droitsDepuis } from '@/lib/droits'
import { getBiensProches } from '@/lib/biensProches'
import type { SupabaseClient } from '@supabase/supabase-js'

const configs = DEFAULT_PLAN_CONFIG
const hier    = new Date(Date.now() - 86_400_000).toISOString()
const demain  = new Date(Date.now() + 86_400_000).toISOString()

describe('plan effectif', () => {
  it('un plan payant expiré redevient gratuit', () => {
    expect(getEffectivePlan('pro_mensuel', hier)).toBe('gratuit')
    expect(getEffectivePlan('pro_mensuel', demain)).toBe('pro_mensuel')
    expect(getEffectivePlan('agence_annuel', null)).toBe('agence_annuel')
  })
})

describe('droits', () => {
  it('suivent les features du plan', () => {
    const gratuit = droitsDepuis('gratuit', null, configs)
    const pro     = droitsDepuis('pro_mensuel', demain, configs)
    expect(gratuit.a('stats_avancees')).toBe(false)
    expect(pro.a('stats_avancees')).toBe(true)
    expect(gratuit.a('messagerie')).toBe(true)
  })

  it('perdent les avantages payants à expiration', () => {
    expect(droitsDepuis('pro_mensuel', hier, configs).a('photos_360')).toBe(false)
  })

  it('accordent toujours les features publiques', () => {
    expect(droitsDepuis('gratuit', null, configs).a('estimation')).toBe(true)
  })
})

describe('offres affichées', () => {
  it("ne présentent ni les features à venir ni celles offertes à tous", () => {
    const labels = featuresVendables(configs.agence_mensuel).map(f => f.key)
    expect(labels).not.toContain('multi_utilisateurs')
    expect(labels).not.toContain('api_acces')
    expect(labels).not.toContain('estimation')
    expect(labels).toContain('support_prioritaire')
  })

  it('chaque feature a un statut', () => {
    for (const f of ALL_FEATURES) expect(['controle', 'service', 'public', 'a_venir']).toContain(f.statut)
  })
})

describe('getBiensProches', () => {
  // Faux client : renvoie les biens du carré demandé, comme le ferait PostgREST
  function fauxClient(biens: { id: string; lat: number; lng: number }[]) {
    const appels: number[] = []
    const client = {
      from: () => {
        const f: Record<string, number> = {}
        const q = {
          select: () => q,
          gte: (c: string, v: number) => { f[`${c}>`] = v; return q },
          lte: (c: string, v: number) => { f[`${c}<`] = v; return q },
          order: () => q,
          limit: () => {
            appels.push(1)
            return Promise.resolve({ data: biens.filter(b =>
              b.lat >= f['lat>'] && b.lat <= f['lat<'] && b.lng >= f['lng>'] && b.lng <= f['lng<']) })
          },
        }
        return q
      },
    }
    return { client: client as unknown as SupabaseClient, appels }
  }

  type Bien = { id: string; lat: number | null; lng: number | null }
  const jonchery = { lat: 49.2889, lng: 3.8139 }

  it('trie par distance réelle', async () => {
    const { client } = fauxClient([
      { id: 'reims',  lat: 49.2583, lng: 4.0317 },
      { id: 'fismes', lat: 49.3083, lng: 3.6853 },
      { id: 'local',  lat: 49.2890, lng: 3.8140 },
    ])
    const r = await getBiensProches<Bien>(client, jonchery.lat, jonchery.lng, 2)
    expect(r.map(b => b.id)).toEqual(['local', 'fismes'])
    expect(r[0].distance_km).toBeLessThan(1)
  })

  it("élargit le rayon tant qu'il n'y a pas assez de biens", async () => {
    const { client, appels } = fauxClient([{ id: 'lille', lat: 50.6292, lng: 3.0573 }])
    const r = await getBiensProches<Bien>(client, jonchery.lat, jonchery.lng, 1)
    expect(r.map(b => b.id)).toEqual(['lille'])
    expect(appels.length).toBe(3) // 25 km, 75 km, puis 200 km
  })
})
