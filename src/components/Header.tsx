'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useMapStore } from '@/store/mapStore'
import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'

interface Props {
  user: User | null
  unreadCount?: number
}

export default function Header({ user, unreadCount = 0 }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const { favorites, setFavsPanelOpen } = useMapStore()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const favCount = favorites.size

  async function handleLogout() {
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <header className="flex items-center justify-between px-4 lg:px-6 h-14 bg-navy text-white flex-shrink-0 z-10">

      {/* Logo */}
      <Link href="/" className="font-serif text-[20px] lg:text-[22px] tracking-wide flex-shrink-0">
        Terra<span className="text-primary italic">nova</span>
      </Link>

      {/* Nav desktop uniquement */}
      <nav className="hidden md:flex items-center gap-1">
        <Link href="/annonces" className="text-white/50 hover:text-white text-sm px-3 py-1.5 rounded-md hover:bg-white/10 transition-all">
          Annonces
        </Link>
        <Link href="/agences" className="text-white/50 hover:text-white text-sm px-3 py-1.5 rounded-md hover:bg-white/10 transition-all">
          Agences
        </Link>
        <Link href="/marche" className="text-white/50 hover:text-white text-sm px-3 py-1.5 rounded-md hover:bg-white/10 transition-all">
          Marché
        </Link>
        <Link href="/estimer" className="text-white/50 hover:text-white text-sm px-3 py-1.5 rounded-md hover:bg-white/10 transition-all">
          Estimer
        </Link>
      </nav>

      {/* Actions */}
      <div className="flex items-center gap-1 lg:gap-2">
        {user ? (
          <>
            {/* Favoris */}
            <button
              onClick={() => setFavsPanelOpen(true)}
              title="Mes favoris"
              className="relative w-9 h-9 flex items-center justify-center rounded-md hover:bg-white/10 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                className={`w-5 h-5 ${mounted && favCount > 0 ? 'text-white' : 'text-white/50'}`}>
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {mounted && favCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
                  {favCount > 9 ? '9+' : favCount}
                </span>
              )}
            </button>

            {/* Messages */}
            <Link href="/compte/messages" title="Messages"
              className="relative w-9 h-9 flex items-center justify-center rounded-md hover:bg-white/10 transition-all">
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

            {/* Mon compte — desktop uniquement */}
            <Link href="/compte"
              className="hidden md:block text-white/60 hover:text-white text-sm px-3 py-1.5 rounded-md hover:bg-white/10 transition-all whitespace-nowrap">
              Mon compte
            </Link>

            {/* Publier */}
            <Link href="/publier"
              className="bg-primary text-white text-xs lg:text-sm font-medium px-3 lg:px-4 py-1.5 rounded-md hover:bg-primary-dark transition-colors whitespace-nowrap">
              <span className="md:hidden">+ Publier</span>
              <span className="hidden md:inline">+ Publier un bien</span>
            </Link>

            {/* Déconnexion — desktop uniquement */}
            <button onClick={handleLogout}
              className="hidden md:block text-white/40 hover:text-white text-sm px-2 py-1.5 rounded-md hover:bg-white/10 transition-all whitespace-nowrap">
              Déconnexion
            </button>
          </>
        ) : (
          <>
            <Link href="/auth/login"
              className="hidden md:block text-white/60 hover:text-white text-sm px-3 py-1.5 rounded-md hover:bg-white/10 transition-all whitespace-nowrap">
              Se connecter
            </Link>
            <Link href="/publier"
              className="bg-primary text-white text-xs lg:text-sm font-medium px-3 lg:px-4 py-1.5 rounded-md hover:bg-primary-dark transition-colors whitespace-nowrap">
              <span className="md:hidden">+ Publier</span>
              <span className="hidden md:inline">+ Publier un bien</span>
            </Link>
          </>
        )}
      </div>

    </header>
  )
}
