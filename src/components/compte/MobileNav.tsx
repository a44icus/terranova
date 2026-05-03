'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'
import { LIMITES_PLAN } from '@/lib/types'
import { NAV, isNavActive } from './CompteNav'

interface NavCounts {
  messages: number
  visites:  number
}

interface Props {
  profile: Profile | null
  counts?: NavCounts
}

const BOTTOM_NAV = [
  { href: '/compte',              label: 'Accueil',  icon: '◈' },
  { href: '/compte/mes-annonces', label: 'Annonces', icon: '🏠' },
  { href: '/compte/messages',     label: 'Messages', icon: '✉' },
  { href: '/compte/visites',      label: 'Visites',  icon: '📅' },
]

const PLAN_LABEL: Record<string, { label: string; color: string }> = {
  gratuit:     { label: 'Gratuit',    color: '#94A3B8' },
  pro_mensuel: { label: 'Pro',        color: '#4F46E5' },
  pro_annuel:  { label: 'Pro Annuel', color: '#4F46E5' },
}

export default function MobileNav({ profile, counts }: Props) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)

  if (!profile) return null

  const plan   = PLAN_LABEL[profile.plan] ?? PLAN_LABEL.gratuit
  const limite = LIMITES_PLAN[profile.plan as keyof typeof LIMITES_PLAN] ?? { annonces: 3 }

  async function handleLogout() {
    setOpen(false)
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    /* compte-mobile-nav : classe CSS pure, cachée au-dessus de 768px */
    <div className="compte-mobile-nav">

      {/* Overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }}
        />
      )}

      {/* Tiroir slide-up — ancré en bas de l'écran, paddingBottom = hauteur barre */}
      <div style={{
        position: 'fixed',
        left: 0, right: 0,
        bottom: 0,
        zIndex: 50,
        background: 'white',
        borderRadius: '16px 16px 0 0',
        boxShadow: '0 -4px 24px rgba(15,23,42,0.12)',
        transform: open ? 'translateY(0)' : 'translateY(110%)',
        transition: 'transform 0.3s ease-out',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        paddingBottom: 56,   /* réserve l'espace de la barre fixe du bas */
      }}>
        {/* Poignée */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 99, background: 'rgba(15,23,42,0.15)' }} />
        </div>

        {/* Profil */}
        <div style={{ padding: '12px 20px 16px', borderBottom: '1px solid rgba(15,23,42,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: '#4F46E5', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 600, fontSize: 16, flexShrink: 0,
            }}>
              {profile.prenom?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profile.prenom} {profile.nom}
              </div>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                background: plan.color + '20', color: plan.color,
              }}>
                {plan.label}
              </span>
            </div>
          </div>

          {profile.plan === 'gratuit' && (
            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(15,23,42,0.45)', marginBottom: 4 }}>
                <span>Annonces actives</span>
                <span>{profile.annonces_actives}/{limite.annonces}</span>
              </div>
              <div style={{ height: 6, borderRadius: 99, background: 'rgba(15,23,42,0.08)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 99,
                  width: `${Math.min((profile.annonces_actives / limite.annonces) * 100, 100)}%`,
                  background: profile.annonces_actives >= limite.annonces ? '#DC2626' : '#4F46E5',
                }} />
              </div>
            </div>
          )}
        </div>

        {/* Liens nav */}
        <nav style={{ flex: 1, padding: '8px 12px', overflowY: 'auto' }}>
          {NAV.map(item => {
            const active = isNavActive(pathname, item.href)
            const badge  = item.href === '/compte/messages' ? counts?.messages
              : item.href === '/compte/visites'  ? counts?.visites
              : 0
            return (
              <Link key={item.href} href={item.href}
                onClick={() => setOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px', borderRadius: 10, marginBottom: 2,
                  fontSize: 14, fontWeight: active ? 600 : 400,
                  background: active ? '#0F172A' : 'transparent',
                  color: active ? 'white' : 'rgba(15,23,42,0.6)',
                  textDecoration: 'none',
                }}>
                <span style={{ width: 20, textAlign: 'center' }}>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {!!badge && (
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    padding: '2px 6px', borderRadius: 99,
                    background: '#DC2626', color: 'white',
                    minWidth: 18, textAlign: 'center',
                  }}>
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Actions */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(15,23,42,0.08)' }}>
          <Link href="/publier" onClick={() => setOpen(false)}
            style={{
              display: 'block', width: '100%', textAlign: 'center',
              background: '#4F46E5', color: 'white',
              fontSize: 14, fontWeight: 600, padding: '10px 0',
              borderRadius: 12, textDecoration: 'none',
            }}>
            + Publier un bien
          </Link>
          <button onClick={handleLogout}
            style={{
              display: 'block', width: '100%', textAlign: 'center',
              fontSize: 12, color: 'rgba(15,23,42,0.4)',
              padding: '8px 0', marginTop: 4,
              background: 'none', border: 'none', cursor: 'pointer',
            }}>
            Déconnexion
          </button>
        </div>
      </div>

      {/* Barre fixe en bas */}
      <nav style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        height: 56,
        background: 'white',
        borderTop: '1px solid rgba(15,23,42,0.1)',
        display: 'flex',
        zIndex: 40,
      }}>
        {BOTTOM_NAV.map(item => {
          const active = isNavActive(pathname, item.href)
          const badge  = item.href === '/compte/messages' ? counts?.messages
            : item.href === '/compte/visites'  ? counts?.visites
            : 0
          return (
            <Link key={item.href} href={item.href}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 2,
                fontSize: 10, fontWeight: 500, position: 'relative',
                color: active ? '#4F46E5' : 'rgba(15,23,42,0.4)',
                textDecoration: 'none',
              }}>
              <span style={{ fontSize: 20, lineHeight: 1, position: 'relative' }}>
                {item.icon}
                {!!badge && (
                  <span style={{
                    position: 'absolute', top: -4, right: -10,
                    fontSize: 9, fontWeight: 700,
                    padding: '1px 5px', borderRadius: 99,
                    background: '#DC2626', color: 'white',
                    minWidth: 16, textAlign: 'center', lineHeight: 1.2,
                    border: '1.5px solid white',
                  }}>
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </span>
              {item.label}
            </Link>
          )
        })}

        <button
          onClick={() => setOpen(v => !v)}
          style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 2,
            fontSize: 10, fontWeight: 500,
            color: open ? '#4F46E5' : 'rgba(15,23,42,0.4)',
            background: 'none', border: 'none', cursor: 'pointer',
          }}>
          <span style={{ fontSize: 20, lineHeight: 1 }}>{open ? '✕' : '☰'}</span>
          Menu
        </button>
      </nav>
    </div>
  )
}
