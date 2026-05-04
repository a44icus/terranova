'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

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
  const [menuOpen, setMenuOpen] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (menuOpen) {
      setVisible(true)
    } else {
      const t = setTimeout(() => setVisible(false), 350)
      return () => clearTimeout(t)
    }
  }, [menuOpen])

  const isActive = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(href))

  return (
    <>
    <style>{`
      @keyframes hc-menuSlideIn  { from { opacity:0; transform:translateX(100%); } to { opacity:1; transform:translateX(0); } }
      @keyframes hc-menuSlideOut { from { opacity:1; transform:translateX(0); }   to { opacity:0; transform:translateX(100%); } }
      @keyframes hc-backdropIn   { from { opacity:0; } to { opacity:1; } }
      @keyframes hc-backdropOut  { from { opacity:1; } to { opacity:0; } }
      @keyframes hc-linkFadeUp   { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
      @keyframes hc-burgerSpin   { from { transform:rotate(-90deg); opacity:0; } to { transform:rotate(0deg); opacity:1; } }
    `}</style>
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
          <Link href="/compte"
            className="hidden lg:flex items-center gap-1.5 text-white/70 hover:text-white text-sm px-3 py-1.5 rounded-full hover:bg-white/10 transition-all">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
            Mon compte
          </Link>
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

        {/* Hamburger — mobile uniquement */}
        <button
          onClick={() => setMenuOpen(v => !v)}
          className="lg:hidden flex items-center justify-center w-9 h-9 rounded-full text-white/70 hover:text-white transition-all"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
          aria-label="Menu"
        >
          <span key={menuOpen ? 'close' : 'open'} style={{ animation: 'hc-burgerSpin 0.25s ease' }}>
            {menuOpen ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            )}
          </span>
        </button>
      </div>

    </header>

    {/* Menu mobile animé */}
    {visible && (
      <div className="lg:hidden fixed inset-0 z-[60]">

        {/* Backdrop */}
        <div
          className="absolute inset-0"
          style={{
            background: 'rgba(6,9,20,0.6)',
            backdropFilter: 'blur(4px)',
            animation: `${menuOpen ? 'hc-backdropIn' : 'hc-backdropOut'} 0.3s ease forwards`,
          }}
          onClick={() => setMenuOpen(false)}
        />

        {/* Panel latéral droit */}
        <div
          className="absolute top-0 right-0 h-full w-4/5 max-w-xs flex flex-col pt-20 pb-8 px-6"
          style={{
            background: 'linear-gradient(160deg, #0D1117 0%, #131929 100%)',
            borderLeft: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '-20px 0 60px rgba(0,0,0,0.5)',
            animation: `${menuOpen ? 'hc-menuSlideIn' : 'hc-menuSlideOut'} 0.35s cubic-bezier(0.4,0,0.2,1) forwards`,
          }}
        >
          {/* Bouton fermer */}
          <button
            onClick={() => setMenuOpen(false)}
            className="absolute top-5 right-5 flex items-center justify-center w-9 h-9 rounded-full text-white/50 hover:text-white transition-all"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>

          {/* Logo */}
          <div className="mb-8 font-serif text-xl text-white" style={{ fontFamily: "'DM Serif Display', serif" }}>
            Terra<span className="text-[#818CF8] italic">nova</span>
          </div>

          {/* Liens */}
          <nav className="flex flex-col gap-0.5 flex-1">
            {NAV_LINKS.map(({ href, label }, i) => (
              <Link key={href} href={href}
                onClick={() => setMenuOpen(false)}
                className={`text-base font-medium px-3 py-2.5 rounded-xl transition-all ${
                  isActive(href)
                    ? 'text-white bg-[#4F46E5]/30 border border-[#818CF8]/30'
                    : 'text-white/60 hover:text-white hover:bg-white/08'
                }`}
                style={{ animation: menuOpen ? `hc-linkFadeUp 0.35s ${0.05 + i * 0.05}s ease both` : 'none' }}>
                {label}
              </Link>
            ))}

            <div className="h-px bg-white/08 my-3" />

            {isLoggedIn ? (
              <Link href="/compte" onClick={() => setMenuOpen(false)}
                className="text-base font-medium px-3 py-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/08 transition-all"
                style={{ animation: menuOpen ? `hc-linkFadeUp 0.35s ${0.05 + NAV_LINKS.length * 0.05}s ease both` : 'none' }}>
                Mon compte
              </Link>
            ) : (
              <Link href="/auth/login" onClick={() => setMenuOpen(false)}
                className="text-base font-medium px-3 py-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/08 transition-all"
                style={{ animation: menuOpen ? `hc-linkFadeUp 0.35s ${0.05 + NAV_LINKS.length * 0.05}s ease both` : 'none' }}>
                Se connecter
              </Link>
            )}
          </nav>

          {/* CTA bas */}
          <Link href="/publier" onClick={() => setMenuOpen(false)}
            className="text-center bg-[#4F46E5] text-white text-sm font-semibold px-4 py-3 rounded-xl hover:bg-[#4338CA] transition-colors"
            style={{ animation: menuOpen ? 'hc-linkFadeUp 0.4s 0.3s ease both' : 'none' }}>
            + Publier une annonce
          </Link>
        </div>
      </div>
    )}
    </>
  )
}
