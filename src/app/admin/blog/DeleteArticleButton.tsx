'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function DeleteArticleButton({ articleId, titre }: { articleId: string; titre: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleDelete() {
    if (!confirm(`Supprimer l'article "${titre}" ? Cette action est irréversible.`)) return
    setLoading(true)
    await supabase.from('articles').delete().eq('id', articleId)
    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-xs text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
    >
      {loading ? '...' : 'Supprimer'}
    </button>
  )
}
