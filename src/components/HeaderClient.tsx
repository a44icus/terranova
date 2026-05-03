'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import ThemeToggle from './ThemeToggle'

const NAV_LINKS = [
  { href: '/annonces', label: 'Annonces' },
  { href: '/carte',    label: 'Carte' },
  { href: '/agences',  label: 'Agences' },
  { href: '/marche',   label: 'Marché' },
  { href: '/blog',     label: 'Blog' },
  { href: '/estimer',  label: 'Estimer' },
]

interface Props {
  isLoggedIn: boolean
}

export default function HeaderClient({ isLoggedIn }: Props) {
  const pathname = usePathname()

  const isActive = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(href))

  return (
    <header className="sticky top-0 z-20 bg-navy text-white h-14 flex items-center justify-between px-4 sm:px-6 lg:px-8">

      {/* Logo */}
      <Link href="/" className="font-serif text-[22px] tracking-wide flex-shrink-0"
        style={{ fontFamily: "'DM Serif Display', serif" }}>
        Terra<span className="text-[#818CF8] italic">nova</span>
      </Link>

      {/* Nav centrale — desktop, pill glass */}
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
        <div className="w-px h-5 mx-3 bg-white/15 flex-shrink-0" />
        <form action="/annonces" method="get" className="flex items-center gap-2">
          <input
            name="ville"
            type="text"
            placeholder="Ville, département…"
            className="text-sm text-white placeholder:text-white/35 bg-transparent outline-none w-36"
          />
          <button type="submit"
            className="bg-[#4F46E5] hover:bg-[#4338CA] text-white px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap">
            Rechercher
          </button>
        </form>
      </div>

      {/* Actions droite */}
      <div className="flex items-center gap-2">
        {isLoggedIn ? (
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
          </>
        ) : (
          <Link href="/auth/login"
            className="hidden lg:block text-white/70 hover:text-white text-sm px-3 py-1.5 rounded-full hover:bg-white/10 transition-all">
            Se connecter
          </Link>
        )}
        <ThemeToggle variant="icon" />
        <Link href="/publier"
          className="bg-[#4F46E5] text-white text-xs lg:text-sm font-medium px-3 lg:px-4 py-1.5 rounded-full hover:bg-[#4338CA] transition-colors whitespace-nowrap">
          + Publier
        </Link>
      </div>

    </header>
  )
}
