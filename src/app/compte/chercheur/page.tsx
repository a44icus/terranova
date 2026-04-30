import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import ChercheurForm from '@/components/compte/ChercheurForm'
import { getViewUserId } from '@/lib/impersonation'

export default async function ChercheurPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirect=/compte/chercheur')

  const viewId = await getViewUserId() ?? user.id
  const admin = createAdminClient()

  const { data: recherche } = await admin
    .from('recherches')
    .select('*')
    .eq('user_id', viewId)
    .single()

  return (
    <div className="p-4 sm:p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-navy mb-1">Profil chercheur</h1>
        <p className="text-sm text-navy/50">
          Activez votre mode chercheur pour que les vendeurs puissent vous contacter directement.
        </p>
      </div>

      <ChercheurForm userId={viewId} initial={recherche ?? null} />
    </div>
  )
}
