import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import ProfilForm from '@/components/compte/ProfilForm'
import { getViewUserId } from '@/lib/impersonation'
import PageHeader from '@/components/compte/ui/PageHeader'

export default async function ProfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const viewId = await getViewUserId() ?? user.id
  const admin = createAdminClient()

  const { data: profile } = await admin.from('profiles').select('*').eq('id', viewId).single()

  let viewEmail = user.email ?? ''
  if (viewId !== user.id) {
    const { data } = await admin.auth.admin.getUserById(viewId)
    viewEmail = data.user?.email ?? ''
  }

  return (
    <div className="p-4 sm:p-8 max-w-2xl">
      <PageHeader title="Mon profil" description="Gérez vos informations personnelles" />
      <ProfilForm profile={profile} userEmail={viewEmail} />
    </div>
  )
}
