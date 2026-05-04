import Image from 'next/image'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Metadata } from 'next'
import HeroBubbles from '@/components/hero/HeroBubbles'
import SiteFooter from '@/components/SiteFooter'
import LatestBiens from '@/components/home/LatestBiens'
import FeaturesShowcase from '@/components/home/FeaturesShowcase'
import VendeurSection from '@/components/home/VendeurSection'
import HomeHamburger from '@/components/HomeHamburger'

export const metadata: Metadata = {
  title: "Terranova \u2013 L'immobilier autrement",
  description: 'Carte interactive, filtres avanc\u00e9s, contact direct. Trouvez ou vendez votre bien sans interm\u00e9diaire.',
}

// ── Palette ──────────────────────────────────────────────────────
// Dark  : #0F172A  (slate-900)
// Accent: #4F46E5  (indigo-600)
// Hover : #4338CA  (indigo-700)
// Light : #EEF2FF  (indigo-50)
// Bg    : #F8FAFC  (slate-50)

const MARQUEE_ITEMS = [
  'Carte interactive', 'Sans commission', 'Contact direct',
  'Filtres avanc\u00e9s', 'Comparateur de biens', 'Score de quartier',
  'DPE & GES', 'S\u00e9lection au lasso', 'Annonce gratuite',
]

export default async function LandingPage() {
  const supabase = await createClient()

  // ── Géoloc du visiteur via headers Vercel / Cloudflare (pas d'appel externe) ──
  const h = await headers()
  const visitorLat = parseFloat(h.get('x-vercel-ip-latitude') || h.get('cf-iplatitude') || '')
  const visitorLng = parseFloat(h.get('x-vercel-ip-longitude') || h.get('cf-iplongitude') || '')
  const rawCity   = h.get('x-vercel-ip-city') || h.get('cf-ipcity') || ''
  const visitorCity = rawCity ? decodeURIComponent(rawCity) : null
  const hasGeo = Number.isFinite(visitorLat) && Number.isFinite(visitorLng)

  // Si géoloc dispo : on récupère 30 biens récents pour pouvoir trier par distance
  const fetchLimit = hasGeo ? 30 : 6

  const [
    { data: { user } },
    { data: latestBiens },
    { count: totalBiens },
    { count: totalVilles },
    { count: totalAnnonceurs },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('biens_publics').select('*')
      .order('featured', { ascending: false })
      .order('publie_at', { ascending: false })
      .limit(fetchLimit),
    supabase.from('biens_publics').select('*', { count: 'exact', head: true }),
    supabase.from('biens').select('ville', { count: 'exact', head: true }).eq('statut', 'publie'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
  ])

  // Tri par proximité si géoloc disponible (distance euclidienne — assez précis à l'échelle ville)
  const biens = hasGeo
    ? (latestBiens ?? [])
        .filter(b => b.lat != null && b.lng != null)
        .map(b => ({ ...b, _dist: Math.pow(b.lat - visitorLat, 2) + Math.pow(b.lng - visitorLng, 2) }))
        .sort((a, b) => a._dist - b._dist)
        .slice(0, 6)
    : (latestBiens ?? []).slice(0, 6)

  return (
    <div className="min-h-screen bg-[#F8FAFC]" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .marquee-track { animation: marquee 30s linear infinite; }
        .marquee-track:hover { animation-play-state: paused; }
      `}</style>

      {/* ── Nav ──────────────────────────────────────────────────── */}
      <header className="absolute top-5 lg:top-8 left-0 right-0 z-50 px-5 lg:px-16 xl:px-20 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="font-serif text-[22px] lg:text-[28px] tracking-wide text-white flex-shrink-0"
          style={{ fontFamily: "'DM Serif Display', serif" }}>
          Terra<span className="text-[#818CF8] italic">nova</span>
        </Link>

        {/* Navbar glass — centrée, desktop uniquement */}
        <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center px-3 py-2"
          style={{
            background: 'rgba(255,255,255,0.07)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 9999,
          }}>
          <nav className="flex items-center gap-0.5">
            <Link href="/annonces"
              className="text-white/70 hover:text-white text-sm px-4 py-1.5 rounded-full hover:bg-white/10 transition-all">
              Annonces
            </Link>
            <Link href="/carte"
              className="text-white text-sm px-4 py-1.5 rounded-full transition-all font-medium"
              style={{ background: 'rgba(79,70,229,0.35)', border: '1px solid rgba(129,140,248,0.35)' }}>
              Carte
            </Link>
            <Link href="/agences"
              className="text-white/70 hover:text-white text-sm px-4 py-1.5 rounded-full hover:bg-white/10 transition-all">
              Agences
            </Link>
            <Link href="/marche"
              className="text-white/70 hover:text-white text-sm px-4 py-1.5 rounded-full hover:bg-white/10 transition-all">
              Marché
            </Link>
            <Link href="/estimer"
              className="text-white/70 hover:text-white text-sm px-4 py-1.5 rounded-full hover:bg-white/10 transition-all">
              Estimer
            </Link>
          </nav>
          <div className="w-px h-5 mx-3 bg-white/15 flex-shrink-0" />
          <form action="/annonces" method="get" className="flex items-center gap-2">
            <input
              name="ville"
              type="text"
              placeholder="Ville, département…"
              className="text-sm text-white placeholder:text-white/35 bg-transparent outline-none w-44"
            />
            <button type="submit"
              className="bg-[#4F46E5] hover:bg-[#4338CA] text-white px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap">
              Rechercher
            </button>
          </form>
        </div>

        {/* Actions droite */}
        <div className="flex items-center gap-2">
          {user ? (
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
          <HomeHamburger isLoggedIn={!!user} />
        </div>

      </header>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="min-h-[78vh] lg:min-h-[82vh] flex overflow-hidden relative bg-[#0F172A]">

        {/* Photo plein écran */}
        <Image
          src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=90&auto=format&fit=crop"
          alt=""
          fill
          className="object-cover object-center"
          sizes="100vw"
          quality={90}
          priority
        />

        {/* Gradient mobile : overlay sombre uniforme */}
        <div className="absolute inset-0 pointer-events-none lg:hidden" style={{
          background: 'rgba(9,9,35,0.78)',
        }} />
        {/* Gradient desktop : gauche → droite */}
        <div className="absolute inset-0 pointer-events-none hidden lg:block" style={{
          background: 'linear-gradient(to right, rgba(9,9,35,0.88) 0%, rgba(9,9,35,0.75) 35%, rgba(9,9,35,0.3) 60%, rgba(9,9,35,0.05) 100%)',
        }} />
        {/* Vignette haut & bas */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'linear-gradient(to bottom, rgba(9,9,35,0.5) 0%, transparent 25%, transparent 75%, rgba(9,9,35,0.6) 100%)',
        }} />

        {/* ── Colonne texte ── */}
        <div className="relative flex flex-col justify-center px-6 lg:px-16 xl:px-20 w-full lg:w-[52%] lg:flex-shrink-0 z-10 pt-24 pb-12 lg:pt-0 lg:pb-0">
          <div className="relative z-10 max-w-lg lg:max-w-none mx-auto lg:mx-0">

            <div className="flex items-center gap-3 text-[#818CF8] text-[11px] font-semibold tracking-[0.18em] uppercase mb-4">
              <span className="w-8 h-px bg-[#4F46E5]" />
              Immobilier &middot; France
            </div>

            <h1 className="font-serif text-white leading-[0.95] mb-4"
              style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(2.2rem, 6vw, 4.2rem)' }}>
              {"L'immobilier"}<br />
              <em className="text-[#818CF8]">autrement.</em>
            </h1>

            <p className="text-white/50 text-sm lg:text-base leading-relaxed mb-6 max-w-sm">
              Carte interactive, filtres intelligents,<br className="hidden sm:block" />contact direct. Sans interm&eacute;diaire.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 mb-7">
              <Link href="/carte"
                className="inline-flex items-center justify-center gap-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all shadow-xl shadow-[#4F46E5]/30 hover:-translate-y-0.5">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
                  <line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>
                </svg>
                Voir la carte
              </Link>
              <Link href="/publier"
                className="inline-flex items-center justify-center gap-2 border-2 border-white/20 hover:border-[#4F46E5] hover:bg-[#4F46E5]/10 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all hover:-translate-y-0.5">
                + Publier une annonce
              </Link>
              <Link href="/estimer"
                className="inline-flex items-center justify-center gap-2 text-white/70 hover:text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-all hover:-translate-y-0.5 sm:hidden lg:inline-flex"
                style={{ border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)' }}>
                Estimer mon bien →
              </Link>
            </div>

            {/* Stats */}
            <div className="flex gap-8 lg:gap-10 pt-5 border-t border-white/10">
              {[
                { val: (totalBiens ?? 0).toLocaleString('fr-FR'), label: 'biens' },
                { val: (totalVilles ?? 0).toLocaleString('fr-FR'), label: 'villes' },
              ].map(s => (
                <div key={s.label}>
                  <div className="font-serif text-2xl lg:text-3xl text-white" style={{ fontFamily: "'DM Serif Display', serif" }}>{s.val}</div>
                  <div className="text-xs text-white/30 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Colonne droite — bulles (desktop only) ── */}
        <div className="relative flex-1 z-10 hidden lg:block">
          <HeroBubbles fallback={biens.slice(1, 5)} />
        </div>

      </section>

      {/* ── Marquee ──────────────────────────────────────────────── */}
      <div className="bg-[#06090F] overflow-hidden py-3.5 select-none">
        <div className="marquee-track flex whitespace-nowrap">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} className="inline-flex items-center gap-5 px-5 text-white/90 text-sm font-medium">
              <span>{item}</span>
              <span className="w-1 h-1 rounded-full bg-white/35 flex-shrink-0" />
            </span>
          ))}
        </div>
      </div>

      {/* ── Sélection magazine (composant client : filtres + cartes animées) ── */}
      <LatestBiens biens={biens} nearbyCity={hasGeo ? visitorCity : null} />


      {/* ── Features ─────────────────────────────────────────────── */}
      <FeaturesShowcase />

      {/* ── Vendeurs & Tarifs ────────────────────────────────────── */}
      <VendeurSection totalAnnonceurs={totalAnnonceurs ?? 0} />

      <SiteFooter />

    </div>
  )
}
