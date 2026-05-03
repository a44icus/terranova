import Link from 'next/link'

export default function SiteFooter() {
  return (
    <footer className="bg-[#0F172A] border-t border-white/10 mt-auto">
      {/* Main columns */}
      <div className="max-w-6xl mx-auto px-6 pt-12 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">

          {/* Col 1 — Brand */}
          <div className="col-span-2 md:col-span-1 flex flex-col gap-4">
            <Link href="/" className="font-serif text-xl text-white tracking-wide w-fit"
              style={{ fontFamily: "'DM Serif Display', serif" }}>
              Terra<span className="text-[#818CF8] italic">nova</span>
            </Link>
            <p className="text-xs text-white/40 leading-relaxed max-w-[180px]">
              La plateforme immobilière pensée pour le marché français.
            </p>
          </div>

          {/* Col 2 — Explorer */}
          <div className="flex flex-col gap-3">
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.15em] mb-1">Explorer</p>
            <Link href="/annonces" className="text-xs text-white/50 hover:text-white transition-colors">Annonces</Link>
            <Link href="/carte" className="text-xs text-white/50 hover:text-white transition-colors">Carte interactive</Link>
            <Link href="/agences" className="text-xs text-white/50 hover:text-white transition-colors">Agences</Link>
            <Link href="/blog" className="text-xs text-white/50 hover:text-white transition-colors">Blog</Link>
          </div>

          {/* Col 3 — Vendeurs & Compte */}
          <div className="flex flex-col gap-3">
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.15em] mb-1">Vendeurs & Pro</p>
            <Link href="/publier" className="text-xs text-white/50 hover:text-white transition-colors">Publier un bien</Link>
            <Link href="/publicite" className="text-xs text-white/50 hover:text-white transition-colors">Publicité</Link>
            <Link href="/auth/login" className="text-xs text-white/50 hover:text-white transition-colors">Connexion</Link>
            <Link href="/auth/register" className="text-xs text-white/50 hover:text-white transition-colors">Inscription</Link>
          </div>

          {/* Col 4 — Légal */}
          <div className="flex flex-col gap-3">
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.15em] mb-1">Informations légales</p>
            <Link href="/legal/mentions-legales" className="text-xs text-white/50 hover:text-white transition-colors">Mentions légales</Link>
            <Link href="/legal/confidentialite" className="text-xs text-white/50 hover:text-white transition-colors">Confidentialité</Link>
            <Link href="/legal/cookies" className="text-xs text-white/50 hover:text-white transition-colors">Cookies</Link>
            <Link href="/legal/cgu" className="text-xs text-white/50 hover:text-white transition-colors">CGU</Link>
            <Link href="/legal/cgv" className="text-xs text-white/50 hover:text-white transition-colors">CGV</Link>
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/8 max-w-6xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-white/20">&copy; {new Date().getFullYear()} Terranova — Tous droits réservés</p>
        <p className="text-xs text-white/15">Fait avec ♥ en France</p>
      </div>
    </footer>
  )
}
