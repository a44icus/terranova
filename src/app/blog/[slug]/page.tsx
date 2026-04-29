import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://terranova.fr'

const CAT_LABELS: Record<string, string> = {
  guide:     'Guide',
  actualite: 'Actualité',
  conseil:   'Conseil',
  marche:    'Marché',
}
const CAT_COLORS: Record<string, string> = {
  guide:     '#4F46E5',
  actualite: '#0891B2',
  conseil:   '#059669',
  marche:    '#D97706',
}

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('articles')
    .select('titre, chapeau, photo_url, publie_at, auteur_nom')
    .eq('slug', slug)
    .eq('publie', true)
    .single()

  if (!data) return { title: 'Article introuvable – Terranova' }

  return {
    title: `${data.titre} | Terranova`,
    description: data.chapeau ?? `Article publié par ${data.auteur_nom} sur Terranova.`,
    openGraph: {
      title: data.titre,
      description: data.chapeau ?? '',
      url: `${BASE_URL}/blog/${slug}`,
      siteName: 'Terranova',
      locale: 'fr_FR',
      type: 'article',
      publishedTime: data.publie_at ?? undefined,
      authors: [data.auteur_nom],
      images: data.photo_url ? [{ url: data.photo_url }] : [],
    },
  }
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: article } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .eq('publie', true)
    .single()

  if (!article) notFound()

  // Articles connexes (même catégorie)
  const { data: connexes } = await supabase
    .from('articles')
    .select('slug, titre, chapeau, photo_url, categorie, publie_at')
    .eq('publie', true)
    .eq('categorie', article.categorie)
    .neq('slug', slug)
    .order('publie_at', { ascending: false })
    .limit(3)

  const dateFormatted = article.publie_at
    ? new Date(article.publie_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <SiteHeader />

      {/* Hero image */}
      {article.photo_url && (
        <div className="relative h-72 sm:h-96 overflow-hidden bg-navy/20">
          <img src={article.photo_url} alt={article.titre} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/60 to-transparent" />
        </div>
      )}

      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-10 w-full">
        {/* Breadcrumb */}
        <nav className="text-xs text-navy/40 mb-6 flex items-center gap-1.5 flex-wrap">
          <Link href="/" className="hover:text-primary transition-colors">Accueil</Link>
          <span>›</span>
          <Link href="/blog" className="hover:text-primary transition-colors">Blog</Link>
          <span>›</span>
          <span className="text-navy/70 truncate max-w-[200px]">{article.titre}</span>
        </nav>

        {/* Méta */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className="text-[11px] font-bold px-3 py-1 rounded-full text-white"
            style={{ background: CAT_COLORS[article.categorie] ?? '#4F46E5' }}>
            {CAT_LABELS[article.categorie] ?? article.categorie}
          </span>
          {dateFormatted && (
            <span className="text-xs text-navy/40">{dateFormatted}</span>
          )}
          <span className="text-xs text-navy/40">par {article.auteur_nom}</span>
        </div>

        {/* Titre */}
        <h1 className="font-serif text-3xl sm:text-4xl text-navy leading-tight mb-4">
          {article.titre}
        </h1>

        {/* Chapeau */}
        {article.chapeau && (
          <p className="text-lg text-navy/60 leading-relaxed mb-8 border-l-4 border-primary/30 pl-4 italic">
            {article.chapeau}
          </p>
        )}

        {/* Contenu HTML */}
        <div
          className="article-content"
          dangerouslySetInnerHTML={{ __html: article.contenu }}
        />

        {/* CTA */}
        <div className="mt-12 bg-gradient-to-br from-[#4F46E5]/08 to-[#818CF8]/05 rounded-2xl p-6 text-center border border-[#4F46E5]/10">
          <p className="font-serif text-xl text-navy mb-2">Vous cherchez un bien ?</p>
          <p className="text-sm text-navy/55 mb-4">Découvrez toutes nos annonces immobilières sur la carte interactive.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/carte" className="bg-primary text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors">
              🗺 Explorer la carte
            </Link>
            <Link href="/annonces" className="bg-white text-navy/70 text-sm font-semibold px-5 py-2.5 rounded-xl border border-navy/12 hover:border-navy/25 transition-colors">
              Voir les annonces
            </Link>
          </div>
        </div>

        {/* Articles connexes */}
        {connexes && connexes.length > 0 && (
          <section className="mt-14">
            <h2 className="font-serif text-2xl text-navy mb-6">Articles connexes</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {connexes.map((a: any) => (
                <Link key={a.slug} href={`/blog/${a.slug}`}
                  className="group bg-white rounded-2xl border border-navy/08 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                  <div className="h-32 relative overflow-hidden bg-navy/08">
                    {a.photo_url
                      ? <img src={a.photo_url} alt={a.titre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      : <div className="w-full h-full flex items-center justify-center text-3xl opacity-15">📰</div>
                    }
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-medium text-navy leading-snug group-hover:text-primary transition-colors line-clamp-2">
                      {a.titre}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}
