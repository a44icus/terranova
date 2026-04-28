import { createClient } from '@/lib/supabase/server'
import HeaderClient from './HeaderClient'

export default async function SiteHeader() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return <HeaderClient isLoggedIn={!!user} />
}
