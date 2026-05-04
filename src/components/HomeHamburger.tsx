'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const NAV_LINKS = [
  { href: '/annonces', label: 'Annonces' },
  { href: '/carte',    label: 'Carte' },
  { href: '/agences',  label: 'Agences' },
  { href: '/marche',   label: 'Marché' },
  { href: '/blog',     label: 'Blog' },
  { href: '/estimer',  label: 'Estimer' },
]

export default function HomeHamburger({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [open, setOpen] = useState(false)
  const [visible, setVisible] = useState(false)

  // Gère le montage/démontage avec animation
  useEffect(() => {
    if (open) {
      setVisible(true)
    } else {
      // Laisse le temps à l'animation de fermeture de se jouer
      const t = setTimeout(() => setVisible(false), 350)
      return () => clearTimeout(t)
    }
  }, [open])

  return (
    <>
      <style>{`
        @keyframes menuSlideIn {
          from { opacity: 0; transform: translateX(100%); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes menuSlideOut {
          from { opacity: 1; transform: translateX(0); }
          to   { opacity: 0; transform: translateX(100%); }
        }
        @keyframes backdropIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes backdropOut {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
        @keyframes linkFadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes burgerSpin {
          from { transform: rotate(-90deg); opacity: 0; }
          to   { transform: rotate(0deg);   opacity: 1; }
        }
      `}</style>

      {/* Bouton hamburger */}
      <button
        onClick={() => setOpen(v => !v)}
        className="lg:hidden flex items-center justify-center w-9 h-9 rounded-full text-white/70 hover:text-white transition-all"
        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
        aria-label="Menu"
      >
        <span key={open ? 'close' : 'open'} style={{ animation: 'burgerSpin 0.25s ease' }}>
          {open ? (
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

      {visible && (
        <div className="lg:hidden fixed inset-0 z-[60]">

          {/* Backdrop flouté */}
          <div
            className="absolute inset-0"
            style={{
              background: 'rgba(6,9,20,0.6)',
              backdropFilter: 'blur(4px)',
              animation: `${open ? 'backdropIn' : 'backdropOut'} 0.3s ease forwards`,
            }}
            onClick={() => setOpen(false)}
          />

          {/* Panel latéral droit */}
          <div
            className="absolute top-0 right-0 h-full w-4/5 max-w-xs flex flex-col pt-20 pb-8 px-6"
            style={{
              background: 'linear-gradient(160deg, #0D1117 0%, #131929 100%)',
              borderLeft: '1px solid rgba(255,255,255,0.07)',
              boxShadow: '-20px 0 60px rgba(0,0,0,0.5)',
              animation: `${open ? 'menuSlideIn' : 'menuSlideOut'} 0.35s cubic-bezier(0.4,0,0.2,1) forwards`,
            }}
          >
            {/* Bouton fermer */}
            <button
              onClick={() => setOpen(false)}
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
                  onClick={() => setOpen(false)}
                  className="text-base font-medium px-3 py-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/08 transition-all"
                  style={{ animation: open ? `linkFadeUp 0.35s ${0.05 + i * 0.05}s ease both` : 'none' }}>
                  {label}
                </Link>
              ))}

              <div className="h-px bg-white/08 my-3" />

              {isLoggedIn ? (
                <Link href="/compte" onClick={() => setOpen(false)}
                  className="text-base font-medium px-3 py-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/08 transition-all"
                  style={{ animation: open ? `linkFadeUp 0.35s ${0.05 + NAV_LINKS.length * 0.05}s ease both` : 'none' }}>
                  Mon compte
                </Link>
              ) : (
                <Link href="/auth/login" onClick={() => setOpen(false)}
                  className="text-base font-medium px-3 py-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/08 transition-all"
                  style={{ animation: open ? `linkFadeUp 0.35s ${0.05 + NAV_LINKS.length * 0.05}s ease both` : 'none' }}>
                  Se connecter
                </Link>
              )}
            </nav>

            {/* CTA bas */}
            <Link href="/publier" onClick={() => setOpen(false)}
              className="text-center bg-[#4F46E5] text-white text-sm font-semibold px-4 py-3 rounded-xl hover:bg-[#4338CA] transition-colors"
              style={{ animation: open ? 'linkFadeUp 0.4s 0.3s ease both' : 'none' }}>
              + Publier une annonce
            </Link>
          </div>
        </div>
      )}
    </>
  )
}
