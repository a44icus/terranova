import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import ChercheurForm from '@/components/compte/ChercheurForm'
import { getViewUserId } from '@/lib/impersonation'
import PageHeader from '@/components/compte/ui/PageHeader'

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
      <PageHeader
        title="Profil chercheur"
        description="Activez votre mode chercheur pour que les vendeurs puissent vous contacter directement."
      />
      <ChercheurForm userId={viewId} initial={recherche ?? null} />
    </div>
  )
}
