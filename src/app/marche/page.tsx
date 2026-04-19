import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Metadata } from 'next'
import MarcheVilles from './MarcheVilles'

export const metadata: Metadata = {
  title: 'Marché immobilier par ville – Terranova',
  description: 'Découvrez les prix de l\'immobilier par ville : prix au m², évolution du marché, nombre de biens disponibles.',
}

function slugify(ville: string) {
  return ville.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default async function MarchePage() {
  const supabase = await createClient()

  const { data: raw } = await supabase
    .from('biens_publics')
    .select('ville, prix, surface, type, categorie')
    .not('ville', 'is', null)
    .not('prix', 'is', null)

  const villeMap: Record<string, {
    ville: string
    vente: number[]; location: number[]
    total: number
    categories: Record<string, number>
  }> = {}

  for (const b of raw ?? []) {
    const key = b.ville.trim()
    if (!villeMap[key]) villeMap[key] = { ville: key, vente: [], location: [], total: 0, categories: {} }
    const v = villeMap[key]
    v.total++
    v.categories[b.categorie] = (v.categories[b.categorie] ?? 0) + 1
    if (b.surface && b.surface > 5 && b.prix > 0) {
      const pm2 = b.prix / b.surface
      if (b.type === 'vente') v.vente.push(pm2)
      else v.location.push(pm2)
    }
  }

  const villes = Object.values(villeMap)
    .filter(v => v.total >= 1)
    .map(v => {
      const avgVente = v.vente.length ? Math.round(v.vente.reduce((s, x) => s + x, 0) / v.vente.length) : null
      const avgLoc   = v.location.length ? Math.round(v.location.reduce((s, x) => s + x, 0) / v.location.length) : null
      const topCat   = Object.entries(v.categories).sort((a, b) => b[1] - a[1])[0]?.[0] ?? ''
      const slug     = slugify(v.ville)
      return { ville: v.ville, slug, total: v.total, avgVente, avgLoc, topCat }
    })
    .sort((a, b) => b.total - a.total)

  const prixMoyenNational = (() => {
    const all = (raw ?? []).filter(b => b.surface && b.surface > 5 && b.type === 'vente').map(b => b.prix / b.surface!)
    return all.length ? Math.round(all.reduce((s, x) => s + x, 0) / all.length).toLocaleString('fr-FR') + ' €/m²' : '—'
  })()

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)' }} className="px-6 py-16 text-white">
        <div className="max-w-5xl mx-auto">
          <Link href="/" className="font-serif text-[22px] tracking-wide block mb-8">
            Terra<span className="text-primary italic">nova</span>
          </Link>
          <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-primary flex items-center gap-2 mb-4">
            <span className="w-6 h-px bg-primary" /> Données de marché
          </span>
          <h1 className="font-serif text-4xl xl:text-5xl leading-tight mb-4">
            Le marché immobilier<br />par ville
          </h1>
          <p className="text-white/50 text-lg max-w-xl">
            Prix au m², tendances et volume de biens disponibles dans chaque commune.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Stats globales */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          {[
            { label: 'Villes couvertes',   value: villes.length,           icon: '📍' },
            { label: 'Annonces analysées', value: (raw ?? []).length,       icon: '🏠' },
            { label: 'Prix moyen national', value: prixMoyenNational,       icon: '📊' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-5 border border-navy/08 text-center">
              <div className="text-3xl mb-2">{s.icon}</div>
              <div className="font-serif text-2xl text-navy">
                {typeof s.value === 'number' ? s.value.toLocaleString('fr-FR') : s.value}
              </div>
              <div className="text-xs text-navy/40 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Grille des villes — composant client avec géolocalisation */}
        <h2 className="font-serif text-2xl text-navy mb-6">Toutes les villes</h2>

        {villes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-navy/08 py-16 text-center text-navy/40">
            Aucune donnée disponible
          </div>
        ) : (
          <MarcheVilles villes={villes} />
        )}
      </div>
    </div>
  )
}
