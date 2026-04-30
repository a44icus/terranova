'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'
import { LIMITES_PLAN } from '@/lib/types'

interface Props {
  profile: Profile
}

export const NAV = [
  { href: '/compte',               label: 'Tableau de bord', icon: '◈' },
  { href: '/compte/mes-annonces',  label: 'Mes annonces',    icon: '🏠' },
  { href: '/compte/statistiques',  label: 'Statistiques',    icon: '📊' },
  { href: '/compte/favoris',       label: 'Mes favoris',     icon: '♥' },
  { href: '/compte/messages',      label: 'Messages',        icon: '✉' },
  { href: '/compte/visites',       label: 'Visites',         icon: '📅' },
  { href: '/compte/alertes',       label: 'Mes alertes',     icon: '🔔' },
  { href: '/compte/chercheur',     label: 'Je cherche',      icon: '🔍' },
  { href: '/compte/plan',          label: 'Mon abonnement',  icon: '⭐' },
  { href: '/compte/profil',        label: 'Mon profil',      icon: '👤' },
]

const PLAN_LABEL: Record<string, { label: string; color: string }> = {
  gratuit:     { label: 'Gratuit',    color: '#7f8c8d' },
  pro_mensuel: { label: 'Pro',        color: '#4F46E5' },
  pro_annuel:  { label: 'Pro Annuel', color: '#4F46E5' },
}

export function isNavActive(pathname: string, href: string) {
  if (href === '/compte') return pathname === '/compte'
  return pathname.startsWith(href)
}

/** Sidebar desktop uniquement — cachée sur mobile via CSS */
export default function CompteNav({ profile }: Props) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

  const plan   = PLAN_LABEL[profile.plan] ?? PLAN_LABEL.gratuit
  const limite = LIMITES_PLAN[profile.plan]

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (!profile) return null

  return (
    <aside className="compte-sidebar flex flex-col w-64 flex-shrink-0 border-r border-navy/10 bg-white">
      {/* Profil */}
      <div className="p-5 border-b border-navy/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-medium text-base flex-shrink-0">
            {profile.prenom?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-navy truncate">{profile.prenom} {profile.nom}</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                style={{ background: plan.color + '20', color: plan.color }}>
                {plan.label}
              </span>
              {profile.type === 'pro' && profile.agence && (
                <span className="text-[10px] text-navy/40 truncate">{profile.agence}</span>
              )}
            </div>
          </div>
        </div>

        {profile.plan === 'gratuit' && (
          <div className="mt-2">
            <div className="flex justify-between text-[10px] text-navy/45 mb-1">
              <span>Annonces actives</span>
              <span>{profile.annonces_actives}/{limite.annonces}</span>
            </div>
            <div className="h-1.5 bg-navy/08 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{
                width: `${Math.min((profile.annonces_actives / limite.annonces) * 100, 100)}%`,
                background: profile.annonces_actives >= limite.annonces ? '#e74c3c' : '#4F46E5',
              }} />
            </div>
            <Link href="/compte/plan"
              className="block mt-2 text-center text-[11px] text-primary hover:underline font-medium">
              Passer Pro →
            </Link>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3">
        {NAV.map(item => (
          <Link key={item.href} href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-0.5 transition-all ${
              isNavActive(pathname, item.href)
                ? 'bg-navy text-white font-medium'
                : 'text-navy/60 hover:bg-navy/05 hover:text-navy'
            }`}>
            <span className="text-base w-5 text-center">{item.icon}</span>
            {item.label}
          </Link>
        ))}

        {profile.is_admin && (
          <div className="mt-3 pt-3 border-t border-navy/08">
            <p className="text-[10px] font-medium text-navy/30 uppercase tracking-wider px-3 mb-1">Admin</p>
            <Link href="/compte/admin/email"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-0.5 transition-all ${
                pathname.startsWith('/compte/admin')
                  ? 'bg-navy text-white font-medium'
                  : 'text-navy/60 hover:bg-navy/05 hover:text-navy'
              }`}>
              <span className="text-base w-5 text-center">⚙️</span>
              Config email
            </Link>
          </div>
        )}
      </nav>

      {/* Bas */}
      <div className="p-4 border-t border-navy/10 space-y-2">
        <Link href="/publier"
          className="block w-full text-center bg-primary text-white text-sm font-medium py-2.5 rounded-lg hover:bg-primary-dark transition-colors">
          + Publier un bien
        </Link>
        <button onClick={handleLogout}
          className="block w-full text-center text-xs text-navy/40 hover:text-navy/70 py-1.5 transition-colors">
          Déconnexion
        </button>
      </div>
    </aside>
  )
}
