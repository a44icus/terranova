import Link from 'next/link'

export default function SiteFooter() {
  return (
    <footer className="bg-[#0F172A] border-t border-white/12 px-6 py-10 mt-auto">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        <Link href="/" className="font-serif text-xl text-white tracking-wide"
          style={{ fontFamily: "'DM Serif Display', serif" }}>
          Terra<span className="text-[#818CF8] italic">nova</span>
        </Link>
        <nav className="flex flex-wrap gap-6 text-xs text-white/35">
          <Link href="/annonces" className="hover:text-white transition-colors">Annonces</Link>
          <Link href="/agences" className="hover:text-white transition-colors">Agences</Link>
          <Link href="/carte" className="hover:text-white transition-colors">Carte interactive</Link>
          <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
          <Link href="/publier" className="hover:text-white transition-colors">Publier un bien</Link>
          <Link href="/publicite" className="hover:text-white transition-colors">Publicité</Link>
          <Link href="/auth/login" className="hover:text-white transition-colors">Connexion</Link>
          <Link href="/auth/register" className="hover:text-white transition-colors">Inscription</Link>
        </nav>
        <nav className="flex flex-wrap gap-4 text-xs text-white/25">
          <Link href="/legal/mentions-legales" className="hover:text-white transition-colors">Mentions légales</Link>
          <Link href="/legal/confidentialite" className="hover:text-white transition-colors">Confidentialité</Link>
          <Link href="/legal/cgu" className="hover:text-white transition-colors">CGU</Link>
        </nav>
        <p className="text-xs text-white/20">&copy; {new Date().getFullYear()} Terranova</p>
      </div>
    </footer>
  )
}
