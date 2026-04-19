import Link from 'next/link'
import type { ReactNode } from 'react'

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* Header simple */}
      <header className="bg-[#0F172A] text-white px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="text-xl font-semibold tracking-wide"
          style={{ fontFamily: "'DM Serif Display', serif" }}
        >
          Terra<span className="text-[#818CF8] italic">nova</span>
        </Link>
        <nav className="flex gap-4 text-xs text-white/50">
          <Link href="/annonces" className="hover:text-white transition-colors">Annonces</Link>
          <Link href="/auth/login" className="hover:text-white transition-colors">Connexion</Link>
        </nav>
      </header>

      {/* Contenu */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer minimal légal */}
      <footer className="bg-[#0F172A] border-t border-white/10 px-6 py-6">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            href="/"
            className="text-sm font-semibold text-white"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            Terra<span className="text-[#818CF8] italic">nova</span>
          </Link>
          <nav className="flex flex-wrap gap-5 text-xs text-white/40">
            <Link href="/legal/mentions-legales" className="hover:text-white transition-colors">Mentions légales</Link>
            <Link href="/legal/confidentialite" className="hover:text-white transition-colors">Confidentialité</Link>
            <Link href="/legal/cgu" className="hover:text-white transition-colors">CGU</Link>
          </nav>
          <p className="text-xs text-white/20">&copy; {new Date().getFullYear()} Terranova</p>
        </div>
      </footer>
    </div>
  )
}
