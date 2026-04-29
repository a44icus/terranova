import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import ArticleForm from '../ArticleForm'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditArticlePage({ params }: Props) {
  const { id } = await params
  const admin = createAdminClient()

  const { data: article } = await admin
    .from('articles')
    .select('*')
    .eq('id', id)
    .single()

  if (!article) notFound()

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-[#0F172A]">Modifier l'article</h1>
        <p className="text-sm text-[#0F172A]/50 mt-1 truncate">{article.titre}</p>
      </div>
      <div className="bg-white rounded-2xl border border-[#0F172A]/08 p-6">
        <ArticleForm article={article} />
      </div>
    </div>
  )
}
