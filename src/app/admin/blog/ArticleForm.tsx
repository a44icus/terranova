'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Article {
  id?:         string
  slug?:       string
  titre?:      string
  chapeau?:    string
  contenu?:    string
  categorie?:  string
  auteur_nom?: string
  photo_url?:  string
  publie?:     boolean
  publie_at?:  string | null
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export default function ArticleForm({ article }: { article?: Article }) {
  const isEdit = !!article?.id
  const router = useRouter()
  const supabase = createClient()

  const [titre,     setTitre]     = useState(article?.titre      ?? '')
  const [slug,      setSlug]      = useState(article?.slug       ?? '')
  const [chapeau,   setChapeau]   = useState(article?.chapeau    ?? '')
  const [contenu,   setContenu]   = useState(article?.contenu    ?? '')
  const [categorie, setCategorie] = useState(article?.categorie  ?? 'guide')
  const [auteur,    setAuteur]    = useState(article?.auteur_nom ?? 'Terranova')
  const [photoUrl,  setPhotoUrl]  = useState(article?.photo_url  ?? '')
  const [publie,    setPublie]    = useState(article?.publie     ?? false)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [saved,     setSaved]     = useState(false)

  function handleTitreChange(v: string) {
    setTitre(v)
    if (!isEdit) setSlug(slugify(v))
  }

  async function handleSubmit(e: React.FormEvent, publishNow = false) {
    e.preventDefault()
    if (!titre.trim() || !slug.trim() || !contenu.trim()) {
      setError('Titre, slug et contenu sont requis.')
      return
    }
    setLoading(true)
    setError('')

    const payload: any = {
      titre:      titre.trim(),
      slug:       slug.trim(),
      chapeau:    chapeau.trim() || null,
      contenu:    contenu.trim(),
      categorie,
      auteur_nom: auteur.trim() || 'Terranova',
      photo_url:  photoUrl.trim() || null,
      publie:     publishNow ? true : publie,
      publie_at:  (publishNow || publie) ? (article?.publie_at ?? new Date().toISOString()) : null,
    }

    let error: any
    if (isEdit) {
      const { error: e } = await supabase.from('articles').update(payload).eq('id', article.id!)
      error = e
    } else {
      const { error: e } = await supabase.from('articles').insert(payload)
      error = e
    }

    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    setSaved(true)
    setTimeout(() => {
      router.push('/admin/blog')
      router.refresh()
    }, 800)
  }

  return (
    <form onSubmit={e => handleSubmit(e)} className="space-y-6">
      {/* Titre */}
      <div>
        <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Titre *</label>
        <input
          value={titre} onChange={e => handleTitreChange(e.target.value)}
          required maxLength={200}
          className="w-full text-base border border-[#0F172A]/15 rounded-xl px-4 py-3 focus:outline-none focus:border-[#4F46E5] font-serif"
          placeholder="Titre de l'article..."
        />
      </div>

      {/* Slug */}
      <div>
        <label className="block text-sm font-medium text-[#0F172A] mb-1.5">
          Slug (URL) *
          <span className="ml-2 font-normal text-[#0F172A]/40 text-xs">terranova.fr/blog/<strong>{slug || 'mon-article'}</strong></span>
        </label>
        <input
          value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
          required maxLength={100}
          className="w-full text-sm border border-[#0F172A]/15 rounded-xl px-4 py-3 focus:outline-none focus:border-[#4F46E5] font-mono"
          placeholder="mon-article-seo"
        />
      </div>

      {/* Chapeau */}
      <div>
        <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Chapeau (sous-titre)</label>
        <textarea
          value={chapeau} onChange={e => setChapeau(e.target.value)}
          rows={2} maxLength={300}
          className="w-full text-sm border border-[#0F172A]/15 rounded-xl px-4 py-3 focus:outline-none focus:border-[#4F46E5] resize-none"
          placeholder="Courte description visible en aperçu et pour le SEO..."
        />
      </div>

      {/* Contenu */}
      <div>
        <label className="block text-sm font-medium text-[#0F172A] mb-1.5">
          Contenu * <span className="font-normal text-[#0F172A]/40 text-xs">(HTML autorisé : &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;strong&gt;, &lt;a&gt;, &lt;img&gt;...)</span>
        </label>
        <textarea
          value={contenu} onChange={e => setContenu(e.target.value)}
          required rows={20}
          className="w-full text-sm border border-[#0F172A]/15 rounded-xl px-4 py-3 focus:outline-none focus:border-[#4F46E5] resize-y font-mono"
          placeholder="<h2>Introduction</h2><p>Votre contenu ici...</p>"
        />
        <div className="text-[11px] text-[#0F172A]/35 mt-1">{contenu.length} caractères</div>
      </div>

      {/* Ligne Catégorie + Auteur */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Catégorie</label>
          <select
            value={categorie} onChange={e => setCategorie(e.target.value)}
            className="w-full text-sm border border-[#0F172A]/15 rounded-xl px-4 py-3 focus:outline-none focus:border-[#4F46E5] bg-white"
          >
            <option value="guide">Guide pratique</option>
            <option value="actualite">Actualité</option>
            <option value="conseil">Conseil</option>
            <option value="marche">Marché immobilier</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Nom de l'auteur</label>
          <input
            value={auteur} onChange={e => setAuteur(e.target.value)}
            maxLength={100}
            className="w-full text-sm border border-[#0F172A]/15 rounded-xl px-4 py-3 focus:outline-none focus:border-[#4F46E5]"
            placeholder="Terranova"
          />
        </div>
      </div>

      {/* Photo URL */}
      <div>
        <label className="block text-sm font-medium text-[#0F172A] mb-1.5">URL de la photo de couverture</label>
        <input
          value={photoUrl} onChange={e => setPhotoUrl(e.target.value)}
          type="url"
          className="w-full text-sm border border-[#0F172A]/15 rounded-xl px-4 py-3 focus:outline-none focus:border-[#4F46E5]"
          placeholder="https://images.unsplash.com/..."
        />
        {photoUrl && (
          <div className="mt-2 h-32 rounded-xl overflow-hidden border border-[#0F172A]/10">
            <img src={photoUrl} alt="Aperçu" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
          </div>
        )}
      </div>

      {/* Statut publication */}
      <div className="flex items-center gap-3 p-4 bg-[#0F172A]/03 rounded-xl">
        <input
          type="checkbox" id="publie" checked={publie} onChange={e => setPublie(e.target.checked)}
          className="w-4 h-4 rounded accent-[#4F46E5]"
        />
        <label htmlFor="publie" className="text-sm font-medium text-[#0F172A] cursor-pointer">
          Article publié (visible sur le blog)
        </label>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {saved && (
        <div className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
          ✅ Enregistré ! Redirection...
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit" disabled={loading || saved}
          className="flex-1 bg-[#4F46E5] text-white text-sm font-semibold py-3 rounded-xl hover:bg-[#4338CA] disabled:opacity-60 transition-all"
        >
          {loading ? 'Enregistrement...' : isEdit ? 'Enregistrer les modifications' : 'Créer l\'article'}
        </button>

        {!publie && !isEdit && (
          <button
            type="button"
            onClick={e => handleSubmit(e as any, true)}
            disabled={loading || saved}
            className="px-6 bg-green-600 text-white text-sm font-semibold py-3 rounded-xl hover:bg-green-700 disabled:opacity-60 transition-all"
          >
            Publier maintenant
          </button>
        )}

        <a href="/admin/blog"
          className="px-6 flex items-center text-sm text-[#0F172A]/50 hover:text-[#0F172A] transition-colors">
          Annuler
        </a>
      </div>
    </form>
  )
}
