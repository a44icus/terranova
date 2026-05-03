'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useMapStore } from '@/store/mapStore'
import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import MapSearchBarInline from '@/components/map/MapSearchBarInline'

const NAV_LINKS = [
  { href: '/annonces', label: 'Annonces' },
  { href: '/carte',    label: 'Carte' },
  { href: '/agences',  label: 'Agences' },
  { href: '/marche',   label: 'Marché' },
  { href: '/blog',     label: 'Blog' },
  { href: '/estimer',  label: 'Estimer' },
]

interface Props {
  user: User | null
  unreadCount?: number
}

export default function Header({ user, unreadCount = 0 }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const { favorites, setFavsPanelOpen } = useMapStore()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const favCount = favorites.size

  const isActive = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(href))

  async function handleLogout() {
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-20 bg-navy text-white h-14 flex items-center justify-between px-4 sm:px-6 lg:px-8 flex-shrink-0">

      {/* Logo */}
      <Link href="/" className="font-serif text-[22px] tracking-wide flex-shrink-0"
        style={{ fontFamily: "'DM Serif Display', serif" }}>
        Terra<span className="text-[#818CF8] italic">nova</span>
      </Link>

      {/* Nav centrale pill — desktop */}
      <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center px-3 py-1.5"
        style={{
          background: 'rgba(255,255,255,0.07)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 9999,
        }}>
        <nav className="flex items-center gap-0.5">
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href}
              className={`text-sm px-4 py-1.5 rounded-full transition-all ${
                isActive(href)
                  ? 'text-white font-medium'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
              style={isActive(href) ? {
                background: 'rgba(79,70,229,0.35)',
                border: '1px solid rgba(129,140,248,0.35)',
              } : {}}>
              {label}
            </Link>
          ))}
        </nav>
        <MapSearchBarInline />
      </div>

      {/* Actions droite */}
      <div className="flex items-center gap-1 lg:gap-2">

        {/* Favoris (carte uniquement) */}
        <button
          onClick={() => setFavsPanelOpen(true)}
          title="Mes favoris"
          className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
            className={`w-5 h-5 ${mounted && favCount > 0 ? 'text-white' : 'text-white/50'}`}>
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          {mounted && favCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-[#4F46E5] text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
              {favCount > 9 ? '9+' : favCount}
            </span>
          )}
        </button>

        {/* Messages */}
        <Link href="/compte/messages" title="Messages"
          className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
            className={`w-5 h-5 ${unreadCount > 0 ? 'text-white' : 'text-white/50'}`}>
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-[#e74c3c] text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {user ? (
          <>
            <Link href="/compte"
              className="hidden lg:flex items-center gap-1.5 text-white/70 hover:text-white text-sm px-3 py-1.5 rounded-full hover:bg-white/10 transition-all">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
              Mon compte
            </Link>
            <Link href="/compte"
              className="lg:hidden flex items-center justify-center w-9 h-9 rounded-full text-white/70 hover:text-white transition-all"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
            </Link>
            <button onClick={handleLogout}
              className="hidden lg:block text-white/40 hover:text-white text-sm px-2 py-1.5 rounded-full hover:bg-white/10 transition-all">
              Déco
            </button>
          </>
        ) : (
          <Link href="/auth/login"
            className="hidden lg:block text-white/70 hover:text-white text-sm px-3 py-1.5 rounded-full hover:bg-white/10 transition-all">
            Se connecter
          </Link>
        )}

        <Link href="/publier"
          className="bg-[#4F46E5] text-white text-xs lg:text-sm font-medium px-3 lg:px-4 py-1.5 rounded-full hover:bg-[#4338CA] transition-colors whitespace-nowrap">
          + Publier
        </Link>
      </div>

    </header>
  )
}
