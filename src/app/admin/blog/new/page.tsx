import ArticleForm from '../ArticleForm'

export default function NewArticlePage() {
  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-[#0F172A]">Nouvel article</h1>
        <p className="text-sm text-[#0F172A]/50 mt-1">Créez un article pour le blog Terranova</p>
      </div>
      <div className="bg-white rounded-2xl border border-[#0F172A]/08 p-6">
        <ArticleForm />
      </div>
    </div>
  )
}
