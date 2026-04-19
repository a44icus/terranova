import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfilForm from '@/components/compte/ProfilForm'

export default async function ProfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="font-serif text-2xl text-navy mb-1">Mon profil</h1>
      <p className="text-sm text-navy/50 mb-6">Gérez vos informations personnelles</p>
      <ProfilForm profile={profile} userEmail={user.email ?? ''} />
    </div>
  )
}
