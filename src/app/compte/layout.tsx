import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import CompteNav from '@/components/compte/CompteNav'
import FavorisSync from '@/components/FavorisSync'
import type { Profile, PlanType } from '@/lib/types'
import { isPlanExpired } from '@/lib/plan'

export default async function CompteLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirect=/compte')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Auto-dégrader le plan si expiré
  if (profile && isPlanExpired(profile.plan as PlanType, profile.plan_expire_at)) {
    const adminClient = createAdminClient()
    await adminClient
      .from('profiles')
      .update({ plan: 'gratuit', plan_expire_at: null })
      .eq('id', user.id)
    // Recharger le profil avec le plan dégradé
    profile.plan = 'gratuit'
    profile.plan_expire_at = null
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="bg-navy text-white px-6 h-14 flex items-center justify-between flex-shrink-0">
        <a href="/" className="font-serif text-[22px] tracking-wide">
          Terra<span className="text-primary italic">nova</span>
        </a>
        <a href="/carte" className="text-white/50 hover:text-white text-sm transition-colors">
          ← Retour à la carte
        </a>
      </header>

      <FavorisSync />
      <div className="flex min-h-[calc(100vh-56px)]">
        <CompteNav profile={profile} />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
