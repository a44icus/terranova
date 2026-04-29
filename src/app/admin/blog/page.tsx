import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import DeleteArticleButton from './DeleteArticleButton'

const CAT_LABELS: Record<string, string> = {
  guide:     'Guide',
  actualite: 'Actualité',
  conseil:   'Conseil',
  marche:    'Marché',
}

export default async function AdminBlogPage() {
  const admin = createAdminClient()
  const { data: articles } = await admin
    .from('articles')
    .select('id, slug, titre, categorie, auteur_nom, publie, publie_at, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-[#0F172A]">Blog</h1>
          <p className="text-sm text-[#0F172A]/50 mt-1">{articles?.length ?? 0} article{(articles?.length ?? 0) > 1 ? 's' : ''}</p>
        </div>
        <Link
          href="/admin/blog/new"
          className="bg-[#4F46E5] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#4338CA] transition-colors"
        >
          + Nouvel article
        </Link>
      </div>

      {!articles?.length ? (
        <div className="bg-white rounded-2xl border border-[#0F172A]/08 py-16 text-center">
          <div className="text-4xl mb-3">📝</div>
          <p className="text-[#0F172A]/40 text-sm">Aucun article pour le moment</p>
          <Link href="/admin/blog/new" className="mt-4 inline-block text-sm text-[#4F46E5] hover:underline">
            Créer le premier article →
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#0F172A]/08 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#0F172A]/06">
                <th className="text-left px-5 py-3 text-xs font-medium text-[#0F172A]/40 uppercase tracking-wider">Titre</th>
                <th className="text-left px-3 py-3 text-xs font-medium text-[#0F172A]/40 uppercase tracking-wider hidden sm:table-cell">Catégorie</th>
                <th className="text-left px-3 py-3 text-xs font-medium text-[#0F172A]/40 uppercase tracking-wider hidden md:table-cell">Auteur</th>
                <th className="text-left px-3 py-3 text-xs font-medium text-[#0F172A]/40 uppercase tracking-wider">Statut</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {articles.map((a: any) => (
                <tr key={a.id} className="border-b border-[#0F172A]/04 last:border-0 hover:bg-[#0F172A]/01 transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-medium text-[#0F172A] truncate max-w-xs">{a.titre}</div>
                    <div className="text-[11px] text-[#0F172A]/35 mt-0.5">/blog/{a.slug}</div>
                  </td>
                  <td className="px-3 py-4 hidden sm:table-cell">
                    <span className="text-xs text-[#0F172A]/60">{CAT_LABELS[a.categorie] ?? a.categorie}</span>
                  </td>
                  <td className="px-3 py-4 hidden md:table-cell">
                    <span className="text-xs text-[#0F172A]/60">{a.auteur_nom}</span>
                  </td>
                  <td className="px-3 py-4">
                    {a.publie ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                        ● Publié
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                        ○ Brouillon
                      </span>
                    )}
                    {a.publie_at && (
                      <div className="text-[10px] text-[#0F172A]/30 mt-0.5">
                        {new Date(a.publie_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      {a.publie && (
                        <a href={`/blog/${a.slug}`} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-[#0F172A]/40 hover:text-[#4F46E5] transition-colors">
                          ↗
                        </a>
                      )}
                      <Link href={`/admin/blog/${a.id}`}
                        className="text-xs font-medium text-[#4F46E5] hover:underline">
                        Modifier
                      </Link>
                      <DeleteArticleButton articleId={a.id} titre={a.titre} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
