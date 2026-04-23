import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ChercheurForm from '@/components/compte/ChercheurForm'

export default async function ChercheurPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirect=/compte/chercheur')

  const { data: recherche } = await supabase
    .from('recherches')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-navy mb-1">Profil chercheur</h1>
        <p className="text-sm text-navy/50">
          Activez votre mode chercheur pour que les vendeurs puissent vous contacter directement.
        </p>
      </div>

      <ChercheurForm userId={user.id} initial={recherche ?? null} />
    </div>
  )
}
