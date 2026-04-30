import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import EditAnnonceForm from '@/components/compte/EditAnnonceForm'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ModifierAnnoncePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: bien }, { data: photos }, { data: profile }] = await Promise.all([
    supabase.from('biens').select('*').eq('id', id).eq('user_id', user.id).single(),
    supabase.from('photos').select('*').eq('bien_id', id).order('ordre'),
    supabase.from('profiles').select('*').eq('id', user.id).single(),
  ])

  if (!bien) notFound()

  return (
    <div className="p-4 sm:p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="font-serif text-2xl text-navy">Modifier l'annonce</h1>
        <p className="text-sm text-navy/50 mt-0.5 truncate">{bien.titre}</p>
      </div>
      <EditAnnonceForm bien={bien} photos={photos ?? []} profile={profile} />
    </div>
  )
}
