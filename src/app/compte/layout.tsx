import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import CompteNav from '@/components/compte/CompteNav'
import MobileNav from '@/components/compte/MobileNav'
import FavorisSync from '@/components/FavorisSync'
import ImpersonationBanner from '@/components/ImpersonationBanner'
import type { Profile, PlanType } from '@/lib/types'
import { isPlanExpired } from '@/lib/plan'
import { getImpersonatedId } from '@/lib/impersonation'

export default async function CompteLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirect=/compte')

  const impersonatedId = await getImpersonatedId()
  const viewUserId = impersonatedId ?? user.id

  const adminClient = createAdminClient()
  const [{ data: profile }, { count: unreadMessages }, { count: pendingVisites }] = await Promise.all([
    adminClient.from('profiles').select('*').eq('id', viewUserId).single(),
    adminClient.from('contacts')
      .select('id', { count: 'exact', head: true })
      .eq('vendeur_id', viewUserId).eq('lu', false),
    adminClient.from('visites')
      .select('id', { count: 'exact', head: true })
      .eq('vendeur_id', viewUserId).eq('statut', 'en_attente'),
  ])

  const navCounts = {
    messages: unreadMessages ?? 0,
    visites:  pendingVisites ?? 0,
  }

  // Auto-dégrader le plan si expiré (only for real user)
  if (!impersonatedId && profile && isPlanExpired(profile.plan as PlanType, profile.plan_expire_at)) {
    await adminClient
      .from('profiles')
      .update({ plan: 'gratuit', plan_expire_at: null })
      .eq('id', user.id)
    profile.plan = 'gratuit'
    profile.plan_expire_at = null
  }

  const displayName = [profile?.prenom, profile?.nom].filter(Boolean).join(' ') || 'cet utilisateur'

  return (
    <div className="min-h-screen bg-surface">
      <style>{`
        @media (max-width: 767px) { .compte-sidebar { display: none !important; } }
        @media (min-width: 768px) { .compte-mobile-nav { display: none !important; } }
      `}</style>
      {/* Impersonation banner */}
      {impersonatedId && <ImpersonationBanner name={displayName} />}

      {/* Header */}
      <header className="bg-navy text-white px-6 h-14 flex items-center justify-between flex-shrink-0">
        <a href="/" className="font-serif text-[22px] tracking-wide">
          Terra<span className="text-primary italic">nova</span>
        </a>
        {impersonatedId ? (
          <a href="/admin/utilisateurs" className="text-white/50 hover:text-white text-sm transition-colors">
            ← Retour admin
          </a>
        ) : (
          <a href="/carte" className="text-white/50 hover:text-white text-sm transition-colors">
            ← Retour à la carte
          </a>
        )}
      </header>

      <FavorisSync />
      <div className="flex min-h-[calc(100vh-56px)]">
        <CompteNav profile={profile} counts={navCounts} />
        <main className="flex-1 overflow-auto pb-14 md:pb-0">
          {children}
        </main>
      </div>
      {/* Nav mobile — en dehors du flex, position:fixed indépendante */}
      <MobileNav profile={profile} counts={navCounts} />
    </div>
  )
}
