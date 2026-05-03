import Link from 'next/link'

export default function SiteFooterSlim() {
  return (
    <footer className="bg-[#0F172A] border-t border-white/10 flex-shrink-0 h-9 flex items-center px-6">
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between gap-4">

        <Link href="/" className="font-serif text-sm text-white tracking-wide"
          style={{ fontFamily: "'DM Serif Display', serif" }}>
          Terra<span className="text-[#818CF8] italic">nova</span>
        </Link>

        <nav className="flex items-center gap-4 text-[11px] text-white/35">
          <Link href="/annonces" className="hover:text-white transition-colors">Annonces</Link>
          <Link href="/agences" className="hover:text-white transition-colors">Agences</Link>
          <Link href="/publier" className="hover:text-white transition-colors">Publier</Link>
          <Link href="/legal/mentions-legales" className="hover:text-white transition-colors">Mentions légales</Link>
          <Link href="/legal/confidentialite" className="hover:text-white transition-colors">Confidentialité</Link>
          <Link href="/legal/cgu" className="hover:text-white transition-colors">CGU</Link>
        </nav>

        <p className="text-[11px] text-white/20 whitespace-nowrap">&copy; {new Date().getFullYear()} Terranova</p>

      </div>
    </footer>
  )
}
