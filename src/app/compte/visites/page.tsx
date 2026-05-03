import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { getViewUserId } from '@/lib/impersonation'
import VisitesClient from './VisitesClient'
import PageHeader from '@/components/compte/ui/PageHeader'

export default async function VisitesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirect=/compte/visites')

  const viewId = await getViewUserId() ?? user.id
  const admin  = createAdminClient()

  const { data: visites } = await admin
    .from('visites')
    .select('*, biens(titre, ville, id)')
    .eq('vendeur_id', viewId)
    .order('date_souhaitee', { ascending: true })

  const counts = {
    total:      visites?.length ?? 0,
    en_attente: visites?.filter(v => v.statut === 'en_attente').length ?? 0,
    confirme:   visites?.filter(v => v.statut === 'confirme').length ?? 0,
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl">
      <PageHeader
        title="Visites"
        description="Planifiez et gérez les demandes de visite reçues pour vos annonces"
      />
      <VisitesClient visites={visites ?? []} counts={counts} />
    </div>
  )
}
