import { createClient } from '@/lib/supabase/server'
import MapApp from '@/components/map/MapApp'
import Header from '@/components/Header'

interface Props {
  searchParams: Promise<{ bien?: string }>
}

export default async function CartePage({ searchParams }: Props) {
  const supabase = await createClient()
  const { bien: initialBienId } = await searchParams

  const [{ data: { user } }, { data: biens }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('biens_publics').select('*')
      .order('featured', { ascending: false })
      .order('publie_at', { ascending: false }),
  ])

  let unreadCount = 0
  if (user) {
    const { count } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('vendeur_id', user.id)
      .eq('lu', false)
    unreadCount = count ?? 0
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header user={user} unreadCount={unreadCount} />
      <MapApp biens={biens ?? []} user={user} initialBienId={initialBienId} />
    </div>
  )
}
