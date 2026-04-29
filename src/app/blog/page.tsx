import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Metadata } from 'next'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: 'Blog immobilier – Guides, conseils et actualités | Terranova',
  description: 'Retrouvez nos guides pratiques, conseils d\'achat, de vente et de location immobilière, ainsi que les actualités du marché.',
}

const CAT_LABELS: Record<string, string> = {
  guide:      'Guide',
  actualite:  'Actualité',
  conseil:    'Conseil',
  marche:     'Marché',
}

const CAT_COLORS: Record<string, string> = {
  guide:      '#4F46E5',
  actualite:  '#0891B2',
  conseil:    '#059669',
  marche:     '#D97706',
}

export default async function BlogPage() {
  const supabase = await createClient()
  const { data: articles } = await supabase
    .from('articles')
    .select('id, slug, titre, chapeau, categorie, auteur_nom, photo_url, publie_at')
    .eq('publie', true)
    .order('publie_at', { ascending: false })
    .limit(50)

  const featured = articles?.[0]
  const rest = articles?.slice(1) ?? []

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <SiteHeader />

      {/* Hero navy */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse at 80% 30%, rgba(79,70,229,0.18) 0%, transparent 55%)',
        }} />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 text-center">
          <h1 className="font-serif text-4xl sm:text-5xl text-white mb-4 leading-tight">
            Le blog <span className="text-[#818CF8] italic">Terranova</span>
          </h1>
          <p className="text-white/55 text-lg max-w-xl mx-auto">
            Guides pratiques, conseils d'experts et actualités du marché immobilier
          </p>
        </div>
      </div>

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-12 w-full">

        {/* Filtre catégories */}
        <div className="flex flex-wrap gap-2 mb-10">
          <Link href="/blog" className="text-xs font-semibold px-4 py-1.5 rounded-full bg-navy text-white">
            Tous
          </Link>
          {Object.entries(CAT_LABELS).map(([cat, label]) => (
            <Link key={cat} href={`/blog?cat=${cat}`}
              className="text-xs font-semibold px-4 py-1.5 rounded-full bg-navy/08 text-navy/60 hover:bg-navy/15 transition-colors">
              {label}
            </Link>
          ))}
        </div>

        {!articles?.length ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">📝</div>
            <p className="text-navy/40">Aucun article publié pour le moment.</p>
            <p className="text-navy/30 text-sm mt-1">Revenez bientôt !</p>
          </div>
        ) : (
          <>
            {/* Article à la une */}
            {featured && (
              <Link href={`/blog/${featured.slug}`}
                className="group block bg-white rounded-3xl border border-navy/08 overflow-hidden mb-10 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                <div className="grid grid-cols-1 lg:grid-cols-2">
                  <div className="relative h-64 lg:h-auto bg-gradient-to-br from-[#4F46E5]/20 to-[#4F46E5]/05 overflow-hidden">
                    {featured.photo_url ? (
                      <img src={featured.photo_url} alt={featured.titre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-7xl opacity-20">📰</div>
                    )}
                    <span className="absolute top-4 left-4 text-[10px] font-bold px-2.5 py-1 rounded-full text-white"
                      style={{ background: CAT_COLORS[featured.categorie] ?? '#4F46E5' }}>
                      {CAT_LABELS[featured.categorie] ?? featured.categorie}
                    </span>
                    <span className="absolute top-4 right-4 text-[10px] font-bold px-2.5 py-1 rounded-full text-white bg-navy/70">
                      À la une
                    </span>
                  </div>
                  <div className="p-8 flex flex-col justify-center">
                    <h2 className="font-serif text-2xl text-navy leading-tight mb-3 group-hover:text-primary transition-colors">
                      {featured.titre}
                    </h2>
                    {featured.chapeau && (
                      <p className="text-navy/60 text-sm leading-relaxed mb-5">{featured.chapeau}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-navy/35">
                      <span>{featured.auteur_nom}</span>
                      <span>·</span>
                      <span>
                        {featured.publie_at
                          ? new Date(featured.publie_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                          : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Grille articles */}
            {rest.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {rest.map((article: any) => (
                  <Link key={article.id} href={`/blog/${article.slug}`}
                    className="group bg-white rounded-2xl border border-navy/08 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col">
                    <div className="relative h-48 overflow-hidden bg-gradient-to-br from-navy/10 to-navy/05">
                      {article.photo_url ? (
                        <img src={article.photo_url} alt={article.titre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl opacity-15">📰</div>
                      )}
                      <span className="absolute top-3 left-3 text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                        style={{ background: CAT_COLORS[article.categorie] ?? '#4F46E5' }}>
                        {CAT_LABELS[article.categorie] ?? article.categorie}
                      </span>
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="font-serif text-lg text-navy leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {article.titre}
                      </h3>
                      {article.chapeau && (
                        <p className="text-xs text-navy/55 leading-relaxed mb-4 line-clamp-3 flex-1">
                          {article.chapeau}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-[11px] text-navy/35 mt-auto pt-3 border-t border-navy/06">
                        <span>{article.auteur_nom}</span>
                        <span>
                          {article.publie_at
                            ? new Date(article.publie_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
                            : ''}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}
