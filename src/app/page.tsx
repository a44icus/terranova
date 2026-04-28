import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatPrix } from '@/lib/geo'
import type { Metadata } from 'next'
import HeroBubbles from '@/components/hero/HeroBubbles'
import SiteFooter from '@/components/SiteFooter'

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

const DPE_COLORS: Record<string, string> = {
  A: '#2E7D32', B: '#558B2F', C: '#9E9D24',
  D: '#F9A825', E: '#EF6C00', F: '#D84315', G: '#B71C1C',
}

const CAT_ICON: Record<string, string> = {
  appartement: '\uD83C\uDFDB\uFE0F', maison: '\uD83C\uDF3F', bureau: '\uD83C\uDFE2',
  terrain: '\uD83C\uDF31', parking: '\uD83C\uDD7F\uFE0F', local: '\uD83C\uDFAA',
}

const MARQUEE_ITEMS = [
  'Carte interactive', 'Sans commission', 'Contact direct',
  'Filtres avanc\u00e9s', 'Comparateur de biens', 'Score de quartier',
  'DPE & GES', 'S\u00e9lection au lasso', 'Annonce gratuite',
]

const PLANS = [
  {
    name: 'Gratuit',
    price: '0',
    period: 'pour toujours',
    desc: 'Parfait pour publier un bien en particulier.',
    cta: 'Commencer gratuitement',
    href: '/auth/register',
    featured: false,
    features: [
      '1 annonce active',
      "Jusqu'\u00e0 5 photos",
      'Contact direct acheteurs',
      'Statistiques basiques',
      'Fiche bien compl\u00e8te',
    ],
    missing: [
      'Mise en avant sur la carte',
      'Page agence d\u00e9di\u00e9e',
      'Badge PRO',
      'Support prioritaire',
    ],
  },
  {
    name: 'Essentiel',
    price: '19',
    period: 'par mois',
    desc: 'Pour les vendeurs r\u00e9guliers qui veulent plus de visibilit\u00e9.',
    cta: 'Choisir Essentiel',
    href: '/auth/register?plan=essentiel',
    featured: true,
    features: [
      '5 annonces actives',
      "Jusqu'\u00e0 20 photos par bien",
      'Mise en avant sur la carte',
      'Statistiques avanc\u00e9es',
      'Fiche bien compl\u00e8te',
      'Support par e-mail',
    ],
    missing: [
      'Page agence d\u00e9di\u00e9e',
      'Badge PRO',
      'Support prioritaire',
    ],
  },
  {
    name: 'Agence',
    price: '49',
    period: 'par mois',
    desc: 'La solution compl\u00e8te pour les professionnels de l\u2019immobilier.',
    cta: 'Choisir Agence',
    href: '/auth/register?plan=agence',
    featured: false,
    features: [
      'Annonces illimit\u00e9es',
      'Photos illimit\u00e9es',
      'Mise en avant prioritaire',
      'Statistiques compl\u00e8tes + export',
      'Page agence d\u00e9di\u00e9e',
      'Badge PRO visible',
      'Support t\u00e9l\u00e9phonique d\u00e9di\u00e9',
    ],
    missing: [],
  },
]

export default async function LandingPage() {
  const supabase = await createClient()

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
      .limit(6),
    supabase.from('biens_publics').select('*', { count: 'exact', head: true }),
    supabase.from('biens').select('ville', { count: 'exact', head: true }).eq('statut', 'publie'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
  ])

  const biens = latestBiens ?? []

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
            <>
              {/* Desktop : Mon compte */}
              <Link href="/compte"
                className="hidden lg:flex items-center gap-1.5 text-white/70 hover:text-white text-sm px-3 py-1.5 rounded-full hover:bg-white/10 transition-all">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                </svg>
                Mon compte
              </Link>
              {/* Mobile : icône seule */}
              <Link href="/compte"
                className="lg:hidden flex items-center justify-center w-9 h-9 rounded-full text-white/70 hover:text-white transition-all"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                </svg>
              </Link>
              <Link href="/publier"
                className="bg-[#4F46E5] text-white text-xs lg:text-sm font-medium px-3 lg:px-4 py-1.5 rounded-full hover:bg-[#4338CA] transition-colors whitespace-nowrap">
                + Publier
              </Link>
            </>
          ) : (
            <>
              <Link href="/auth/login"
                className="hidden lg:block text-white/70 hover:text-white text-sm px-3 py-1.5 rounded-full hover:bg-white/10 transition-all">
                Se connecter
              </Link>
              <Link href="/publier"
                className="bg-[#4F46E5] text-white text-xs lg:text-sm font-medium px-3 lg:px-4 py-1.5 rounded-full hover:bg-[#4338CA] transition-colors whitespace-nowrap">
                + Publier
              </Link>
            </>
          )}
        </div>

      </header>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="min-h-screen flex overflow-hidden relative bg-[#0F172A]">

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
        <div className="relative flex flex-col justify-center px-6 lg:px-16 xl:px-20 w-full lg:w-[52%] lg:flex-shrink-0 z-10 pt-28 pb-16 lg:pt-0 lg:pb-0">
          <div className="relative z-10 max-w-lg lg:max-w-none mx-auto lg:mx-0">

            <div className="flex items-center gap-3 text-[#818CF8] text-[11px] font-semibold tracking-[0.18em] uppercase mb-6">
              <span className="w-8 h-px bg-[#4F46E5]" />
              Immobilier &middot; France
            </div>

            <h1 className="font-serif text-white leading-[0.95] mb-6"
              style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(2.8rem, 8vw, 5.5rem)' }}>
              {"L'immobilier"}<br />
              <em className="text-[#818CF8]">autrement.</em>
            </h1>

            <p className="text-white/50 text-sm lg:text-base leading-relaxed mb-8 max-w-sm">
              Carte interactive, filtres intelligents,<br className="hidden sm:block" />contact direct. Sans interm&eacute;diaire.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 mb-10">
              <Link href="/carte"
                className="inline-flex items-center justify-center gap-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold px-6 py-3.5 rounded-xl text-sm transition-all shadow-xl shadow-[#4F46E5]/30 hover:-translate-y-0.5">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
                  <line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>
                </svg>
                Voir la carte
              </Link>
              <Link href="/publier"
                className="inline-flex items-center justify-center gap-2 border-2 border-white/20 hover:border-[#4F46E5] hover:bg-[#4F46E5]/10 text-white font-semibold px-6 py-3.5 rounded-xl text-sm transition-all hover:-translate-y-0.5">
                + Publier une annonce
              </Link>
              <Link href="/estimer"
                className="inline-flex items-center justify-center gap-2 text-white/70 hover:text-white text-sm font-medium px-5 py-3.5 rounded-xl transition-all hover:-translate-y-0.5 sm:hidden lg:inline-flex"
                style={{ border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)' }}>
                Estimer mon bien →
              </Link>
            </div>

            {/* Stats */}
            <div className="flex gap-8 lg:gap-10 pt-6 border-t border-white/10">
              {[
                { val: (totalBiens ?? 0).toLocaleString('fr-FR'), label: 'biens' },
                { val: (totalVilles ?? 0).toLocaleString('fr-FR'), label: 'villes' },
              ].map(s => (
                <div key={s.label}>
                  <div className="font-serif text-3xl lg:text-4xl text-white" style={{ fontFamily: "'DM Serif Display', serif" }}>{s.val}</div>
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
      <div className="bg-[#4F46E5] overflow-hidden py-3.5 select-none">
        <div className="marquee-track flex whitespace-nowrap">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} className="inline-flex items-center gap-5 px-5 text-white/90 text-sm font-medium">
              <span>{item}</span>
              <span className="w-1 h-1 rounded-full bg-white/35 flex-shrink-0" />
            </span>
          ))}
        </div>
      </div>

      {/* ── Sélection magazine ───────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 py-12 lg:py-20">
        <div className="flex items-end justify-between mb-6 lg:mb-10">
          <div>
            <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#4F46E5]">S&eacute;lection</span>
            <h2 className="font-serif text-2xl lg:text-4xl text-[#0F172A] mt-1"
              style={{ fontFamily: "'DM Serif Display', serif" }}>
              Derni&egrave;res annonces
            </h2>
          </div>
          <Link href="/annonces"
            className="hidden sm:inline-flex items-center gap-2 text-sm text-[#0F172A]/50 hover:text-[#4F46E5] transition-colors font-medium border-b border-[#0F172A]/20 hover:border-[#4F46E5] pb-0.5">
            Tout parcourir &rarr;
          </Link>
        </div>

        {/* Grille magazine */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-3" style={{ gridAutoRows: 'clamp(140px, 20vw, 220px)' }}>

          {biens[0] && (
            <Link href={`/annonce/${biens[0].id}`}
              className="relative rounded-2xl overflow-hidden group block col-span-2 row-span-2">
              {biens[0].photo_url
                ? <Image src={biens[0].photo_url} alt={biens[0].titre} fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    sizes="(max-width: 1024px) 100vw, 66vw" />
                : <div className="w-full h-full bg-gradient-to-br from-[#c7d2fe] to-[#4F46E5]" />
              }
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded text-white mb-3 inline-block"
                  style={{ background: biens[0].type === 'vente' ? '#4F46E5' : '#0891B2' }}>
                  {biens[0].type === 'vente' ? 'Vente' : 'Location'}
                </span>
                <div className="font-serif text-3xl text-white mb-1.5"
                  style={{ fontFamily: "'DM Serif Display', serif" }}>
                  {formatPrix(biens[0].prix, biens[0].type)}
                </div>
                <div className="text-white/80 text-sm truncate">{biens[0].titre}</div>
                <div className="text-white/45 text-xs mt-1">{biens[0].ville} {biens[0].code_postal}</div>
              </div>
              {biens[0].coup_de_coeur && (
                <div className="absolute top-4 right-4 bg-amber-400 text-amber-900 text-xs font-bold px-2 py-0.5 rounded">&#x2764; Coup de c&oelig;ur</div>
              )}
              {biens[0].vendeur_logo && (
                <div className="absolute top-4 left-4 w-9 h-9 rounded-lg bg-white shadow-md overflow-hidden flex items-center justify-center p-0.5 border border-white/60">
                  <img src={biens[0].vendeur_logo} alt="" className="w-full h-full object-contain" />
                </div>
              )}
            </Link>
          )}

          {biens.slice(1, 6).map((b: any) => (
            <Link key={b.id} href={`/annonce/${b.id}`}
              className="relative rounded-2xl overflow-hidden group block">
              {b.photo_url
                ? <Image src={b.photo_url} alt={b.titre} fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" />
                : <div className="w-full h-full bg-gradient-to-br from-[#c7d2fe] to-[#4F46E5]" />
              }
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3.5">
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded text-white mb-1.5 inline-block"
                  style={{ background: b.type === 'vente' ? '#4F46E5' : '#0891B2' }}>
                  {b.type === 'vente' ? 'Vente' : 'Location'}
                </span>
                <div className="font-serif text-lg text-white"
                  style={{ fontFamily: "'DM Serif Display', serif" }}>
                  {formatPrix(b.prix, b.type)}
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-white/45 text-[11px] truncate">{b.ville}</span>
                  {b.dpe && (
                    <span className="text-white font-bold px-1.5 py-0.5 rounded text-[9px] flex-shrink-0 ml-2"
                      style={{ background: DPE_COLORS[b.dpe] }}>{b.dpe}</span>
                  )}
                </div>
              </div>
              {b.vendeur_logo && (
                <div className="absolute top-2 right-2 w-7 h-7 rounded-md bg-white shadow-md overflow-hidden flex items-center justify-center p-0.5 border border-white/60">
                  <img src={b.vendeur_logo} alt="" className="w-full h-full object-contain" />
                </div>
              )}
            </Link>
          ))}
        </div>

        <div className="text-center mt-8 sm:hidden">
          <Link href="/annonces" className="text-sm text-[#4F46E5] font-medium">
            Voir toutes les annonces &rarr;
          </Link>
        </div>
      </section>


      {/* ── Features ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-16 lg:py-32 px-4" style={{ background: '#ebe8e5' }}>

        <style>{`
          .feature-card:hover .feature-num { opacity: 0.09; }
          .feature-card .feature-num { opacity: 0.045; transition: opacity 0.5s; }
          .feature-card:hover { border-color: rgba(79,70,229,0.3) !important; box-shadow: 0 12px 40px rgba(79,70,229,0.1); }
          .feature-card:hover .feature-arrow { transform: translate(3px,-3px); }
          .feature-arrow { transition: transform 0.3s; }
        `}</style>

        {/* Orbes */}
        <div className="absolute top-0 left-1/4 w-[700px] h-[500px] pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(79,70,229,0.08) 0%, transparent 65%)', filter: 'blur(60px)' }} />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[400px] pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(8,145,178,0.07) 0%, transparent 65%)', filter: 'blur(60px)' }} />
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle, rgba(15,23,42,0.055) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

        <div className="max-w-7xl mx-auto relative z-10">

          {/* En-tête */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 lg:gap-8 mb-10 lg:mb-16">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <span className="w-6 h-px bg-[#4F46E5]" />
                <span className="text-[10px] font-mono font-semibold tracking-[0.3em] uppercase text-[#4F46E5]">Pourquoi Terranova</span>
              </div>
              <h2 className="font-serif leading-[1] text-[#0F172A]"
                style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(2rem, 5vw, 5rem)' }}>
                Tout ce {"qu'il"} faut.<br />
                <em style={{ color: '#4F46E5' }}>Rien de superflu.</em>
              </h2>
            </div>
            <Link href="/carte"
              className="flex-shrink-0 group inline-flex items-center gap-3 text-sm font-medium text-[#0F172A]/50 hover:text-[#4F46E5] transition-colors self-start lg:self-auto pb-1"
              style={{ borderBottom: '1px solid rgba(15,23,42,0.2)' }}>
              Explorer la carte
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>

          {/* Bento grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

            {/* ── 01 Carte interactive — hero card ── */}
            <Link href="/carte"
              className="feature-card group relative lg:col-span-7 rounded-3xl overflow-hidden flex flex-col justify-between p-7 lg:p-10 cursor-pointer"
              style={{
                background: 'linear-gradient(145deg, #0f0c29 0%, #1a1660 50%, #24243e 100%)',
                border: '1px solid rgba(255,255,255,0.06)',
                minHeight: 320,
                transition: 'border-color 0.4s',
              }}>
              <span className="feature-num absolute -right-4 -top-6 font-serif font-bold select-none pointer-events-none"
                style={{ fontSize: '18rem', lineHeight: 1, color: 'white', fontFamily: "'DM Serif Display', serif" }}>01</span>
              <div className="absolute inset-0 pointer-events-none" style={{
                backgroundImage: 'linear-gradient(rgba(129,140,248,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(129,140,248,.07) 1px, transparent 1px)',
                backgroundSize: '48px 48px',
              }} />
              <div className="absolute bottom-0 left-1/3 w-72 h-72 pointer-events-none opacity-30 group-hover:opacity-50 transition-opacity duration-700"
                style={{ background: 'radial-gradient(circle, #4F46E5 0%, transparent 70%)', filter: 'blur(30px)' }} />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6"
                  style={{ background: 'rgba(79,70,229,0.2)', border: '1px solid rgba(129,140,248,0.2)' }}>
                  <svg className="w-6 h-6 text-[#818CF8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                  </svg>
                </div>
                <h3 className="font-serif text-2xl lg:text-4xl text-white leading-tight mb-3"
                  style={{ fontFamily: "'DM Serif Display', serif" }}>Carte interactive</h3>
                <p className="text-white/45 text-base leading-relaxed max-w-sm mb-6">
                  Dessinez une zone au lasso, activez la vue 3D, explorez les biens en un coup d&apos;&oelig;il.
                </p>
                {/* Bulles de features */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {[
                    'Sélection au lasso',
                    'Clustering intelligent',
                    'Score de quartier',
                    'Filtres temps réel',
                    'Comparateur de biens',
                    'Vue satellite & 3D',
                    'DPE visible sur carte',
                    'Zoom par zone',
                    'Biens en temps réel',
                    'Recherche géographique',
                  ].map(f => (
                    <span key={f}
                      className="text-[12px] font-medium px-3.5 py-1.5 rounded-full text-white/70 transition-colors hover:text-white"
                      style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                      {f}
                    </span>
                  ))}
                </div>
              </div>
              <div className="relative z-10 mt-6">
                <div className="inline-flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-semibold text-white transition-all group-hover:-translate-y-0.5"
                  style={{ background: 'rgba(79,70,229,0.5)', border: '1px solid rgba(129,140,248,0.35)' }}>
                  <svg className="feature-arrow w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
                    <line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>
                  </svg>
                  Ouvrir la carte
                </div>
              </div>
            </Link>

            {/* Colonne droite */}
            <div className="lg:col-span-5 flex flex-col gap-4">

              {/* ── 02 Score de quartier ── */}
              <div className="feature-card group relative rounded-3xl px-7 pt-7 pb-14 flex-1 bg-white"
                style={{ border: '1px solid rgba(15,23,42,0.09)', transition: 'border-color 0.4s, box-shadow 0.4s', minHeight: 200 }}>
                <div className="relative z-10 w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: 'rgba(8,145,178,0.12)', border: '1px solid rgba(8,145,178,0.18)' }}>
                  <svg className="w-5 h-5 text-[#22D3EE]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                </div>
                <h3 className="relative z-10 font-serif text-xl text-[#0F172A] mb-1" style={{ fontFamily: "'DM Serif Display', serif" }}>Score de quartier</h3>
                <p className="relative z-10 text-[#0F172A]/40 text-xs leading-relaxed mb-4">Données réelles pour chaque bien.</p>
                <div className="relative z-10 space-y-3">
                  {[
                    { label: 'Transports', val: 85, color: '#22D3EE' },
                    { label: 'Commerces',  val: 72, color: '#818CF8' },
                    { label: 'Écoles',     val: 91, color: '#34D399' },
                  ].map(s => (
                    <div key={s.label} className="w-full">
                      <div className="flex justify-between text-[10px] text-[#0F172A]/40 mb-1">
                        <span>{s.label}</span>
                        <span className="font-semibold tabular-nums" style={{ color: s.color }}>{s.val}/100</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(15,23,42,0.08)' }}>
                        <div className="h-full rounded-full" style={{ width: `${s.val}%`, background: s.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── 03 Filtres & comparateur ── */}
              <div className="feature-card group relative rounded-3xl px-7 pt-7 pb-9 flex-1 bg-white"
                style={{ border: '1px solid rgba(15,23,42,0.09)', transition: 'border-color 0.4s, box-shadow 0.4s', minHeight: 200 }}>
                <div className="relative z-10 w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: 'rgba(79,70,229,0.12)', border: '1px solid rgba(79,70,229,0.18)' }}>
                  <svg className="w-5 h-5 text-[#818CF8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                  </svg>
                </div>
                <h3 className="relative z-10 font-serif text-xl text-[#0F172A] mb-1" style={{ fontFamily: "'DM Serif Display', serif" }}>Filtres & comparateur</h3>
                <p className="relative z-10 text-[#0F172A]/40 text-xs leading-relaxed mb-4">Prix, surface, DPE. Comparez 3 biens côte à côte.</p>
                <div className="relative z-10 flex flex-wrap gap-1.5">
                  {[
                    { label: 'Appartement', color: '#4F46E5' },
                    { label: '80–150 m²',  color: '#4F46E5' },
                    { label: 'DPE A–C',    color: '#059669' },
                    { label: '< 400 000 €', color: '#0891B2' },
                  ].map(c => (
                    <span key={c.label} className="text-[10px] font-medium px-2.5 py-1 rounded-full text-white"
                      style={{ background: c.color }}>{c.label}</span>
                  ))}
                </div>
              </div>

            </div>

            {/* ── 04 Contact direct ── */}
            <div className="feature-card group relative lg:col-span-6 rounded-3xl p-7 bg-white"
              style={{ border: '1px solid rgba(15,23,42,0.09)', transition: 'border-color 0.4s, box-shadow 0.4s' }}>
              <span className="feature-num absolute top-5 right-6 font-serif font-bold select-none pointer-events-none z-0"
                style={{ fontSize: '4rem', lineHeight: 1, color: '#0F172A', opacity: 0.06, fontFamily: "'DM Serif Display', serif" }}>04</span>
              <div className="relative z-10 w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.18)' }}>
                <svg className="w-5 h-5 text-[#34D399]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <h3 className="relative z-10 font-serif text-xl text-[#0F172A] mb-1" style={{ fontFamily: "'DM Serif Display', serif" }}>Contact direct</h3>
              <p className="relative z-10 text-[#0F172A]/40 text-xs leading-relaxed mb-5">Sans intermédiaire. Zéro commission, zéro délai.</p>
              <div className="relative z-10 space-y-2">
                <div className="flex justify-start">
                  <div className="text-[11px] text-[#0F172A]/65 px-3.5 py-2.5 rounded-2xl rounded-tl-sm leading-relaxed"
                    style={{ background: 'rgba(15,23,42,0.06)', maxWidth: '80%' }}>
                    Bonjour, votre bien est-il encore disponible ?
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="text-[11px] text-white px-3.5 py-2.5 rounded-2xl rounded-tr-sm leading-relaxed"
                    style={{ background: '#4F46E5', maxWidth: '72%' }}>
                    Oui, venez le visiter ce samedi !
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="text-[11px] text-[#0F172A]/65 px-3.5 py-2.5 rounded-2xl rounded-tl-sm leading-relaxed"
                    style={{ background: 'rgba(15,23,42,0.06)', maxWidth: '60%' }}>
                    Super, à samedi alors 👍
                  </div>
                </div>
              </div>
            </div>

            {/* ── 05 Publication gratuite ── */}
            <Link href="/publier"
              className="feature-card group relative lg:col-span-6 rounded-3xl p-7 overflow-hidden cursor-pointer flex flex-col"
              style={{ background: 'linear-gradient(135deg, #312e81 0%, #4338CA 60%, #4F46E5 100%)', border: '1px solid rgba(129,140,248,0.25)', transition: 'border-color 0.4s, box-shadow 0.4s' }}>
              <div className="absolute bottom-0 right-0 w-56 h-56 pointer-events-none opacity-25 group-hover:opacity-45 transition-opacity duration-700"
                style={{ background: 'radial-gradient(circle, #818CF8 0%, transparent 70%)', filter: 'blur(40px)' }} />
              <span className="feature-num absolute top-5 right-6 font-serif font-bold select-none pointer-events-none z-0"
                style={{ fontSize: '4rem', lineHeight: 1, color: 'white', opacity: 0.12, fontFamily: "'DM Serif Display', serif" }}>05</span>
              <div className="relative z-10 w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}>
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="relative z-10 font-serif text-xl text-white mb-1" style={{ fontFamily: "'DM Serif Display', serif" }}>Publication gratuite</h3>
              <p className="relative z-10 text-white/65 text-xs leading-relaxed mb-5">Publiez en quelques minutes. Photos, description, localisation.</p>
              {/* Bulles de features */}
              <div className="relative z-10 flex flex-wrap gap-2 mb-6">
                {[
                  'Photos & galerie',
                  'Localisation précise',
                  'Description libre',
                  'DPE & surface',
                  'Prix personnalisé',
                  'Contact intégré',
                  'Stats de vues',
                  'Modification à tout moment',
                  'Mise en ligne instantanée',
                ].map(f => (
                  <span key={f}
                    className="text-[12px] font-medium px-3.5 py-1.5 rounded-full text-white/70"
                    style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)' }}>
                    {f}
                  </span>
                ))}
              </div>
              <div className="relative z-10 mt-auto">
                <div className="inline-flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-semibold text-white transition-all group-hover:-translate-y-0.5"
                  style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}>
                  <svg className="feature-arrow w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Publier un bien
                </div>
              </div>
            </Link>

          </div>
        </div>
      </section>

      {/* ── Vendeurs & Tarifs (section fusionnée) ────────────────── */}
      <section className="bg-[#0F172A] relative overflow-hidden px-6 pt-16 lg:pt-24 pb-16">

        {/* Fond */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.035]" style={{
          backgroundImage: 'radial-gradient(circle, #94A3B8 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] pointer-events-none" style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(79,70,229,0.18) 0%, transparent 60%)',
        }} />

        <div className="max-w-7xl mx-auto relative z-10">

          {/* ── En-tête centré ── */}
          <div className="text-center mb-10 lg:mb-16">
            <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#818CF8]">
              Pour les vendeurs
            </span>
            <h2 className="font-serif text-white mt-3 mb-4 leading-tight"
              style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(2rem, 4vw, 4rem)' }}>
              Publiez. Gérez. <em style={{ color: '#818CF8' }}>Vendez.</em>
            </h2>
            <p className="text-white/40 text-sm mx-auto leading-relaxed sm:whitespace-nowrap">
              Commencez gratuitement. Passez au plan supérieur quand vous en avez besoin.
            </p>
          </div>

          {/* ── Grille : pitch gauche + tarifs droite ── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-24 items-start">

            {/* Colonne gauche : pitch vendeur */}
            <div className="lg:col-span-2 flex flex-col gap-5 max-w-md mx-auto lg:max-w-none lg:mx-0 w-full">

              {/* Mock annonce */}
              <div className="rounded-2xl overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}>
                <div className="h-40 relative overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80&auto=format&fit=crop"
                    alt="Exemple annonce"
                    fill className="object-cover" sizes="500px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-3 left-3 flex gap-1.5">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white bg-[#4F46E5]">Vente</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
                      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)' }}>5 photos</span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="font-serif text-lg text-white mb-0.5"
                    style={{ fontFamily: "'DM Serif Display', serif" }}>320 000 €</div>
                  <div className="text-white/40 text-xs mb-3">Appartement 3 pièces · Lyon 6e</div>
                  <div className="flex gap-4 pt-3 border-t border-white/08 text-[11px] text-white/35">
                    <span>👁 248 vues</span>
                    <span>❤ 17 favoris</span>
                    <span>✉ 5 messages</span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { val: (totalAnnonceurs ?? 0).toLocaleString('fr-FR'), label: 'vendeurs' },
                  { val: '5 min', label: 'pour publier' },
                  { val: '0 €', label: 'commission' },
                ].map(s => (
                  <div key={s.label} className="rounded-xl px-3 py-3 text-center"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="font-serif text-xl text-[#818CF8]"
                      style={{ fontFamily: "'DM Serif Display', serif" }}>{s.val}</div>
                    <div className="text-white/30 text-[10px] mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <Link href="/publier"
                className="inline-flex items-center justify-center gap-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold px-6 py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-[#4F46E5]/30 hover:-translate-y-0.5">
                Publier gratuitement &rarr;
              </Link>
            </div>

            {/* Colonne droite : 3 plans */}
            <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {PLANS.map(plan => (
                <div key={plan.name}
                  className={`relative rounded-2xl p-6 flex flex-col transition-all ${
                    plan.featured
                      ? 'bg-[#4F46E5] shadow-2xl shadow-[#4F46E5]/40 lg:scale-[1.02]'
                      : 'bg-white/05 border border-white/10 hover:border-[#4F46E5]/40'
                  }`}>

                  {plan.featured && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 text-[10px] font-bold px-3 py-0.5 rounded-full tracking-wide uppercase">
                      Populaire
                    </div>
                  )}

                  <div className="mb-4">
                    <h3 className="font-semibold text-base text-white mb-1">{plan.name}</h3>
                    <p className={`text-xs leading-relaxed ${plan.featured ? 'text-white/70' : 'text-white/35'}`}>
                      {plan.desc}
                    </p>
                  </div>

                  <div className="mb-6">
                    <span className="font-serif text-4xl text-white"
                      style={{ fontFamily: "'DM Serif Display', serif" }}>{plan.price}€</span>
                    <span className={`text-xs ml-1 ${plan.featured ? 'text-white/60' : 'text-white/30'}`}>
                      /{plan.period}
                    </span>
                  </div>

                  <ul className="space-y-2.5 flex-1 mb-6">
                    {plan.features.map(f => (
                      <li key={f} className={`flex items-start gap-2 text-xs ${plan.featured ? 'text-white/90' : 'text-white/55'}`}>
                        <svg className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${plan.featured ? 'text-white' : 'text-[#4F46E5]'}`}
                          viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                        </svg>
                        {f}
                      </li>
                    ))}
                    {plan.missing.map(f => (
                      <li key={f} className="flex items-start gap-2 text-xs text-white/20 line-through">
                        <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-white/15" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Link href={plan.href}
                    className={`w-full text-center py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      plan.featured
                        ? 'bg-white text-[#4F46E5] hover:bg-white/90'
                        : 'bg-[#4F46E5]/20 text-white border border-[#4F46E5]/30 hover:bg-[#4F46E5] hover:border-[#4F46E5]'
                    }`}>
                    {plan.cta}
                  </Link>
                </div>
              ))}
            </div>

          </div>

          <p className="text-center text-xs text-white/20 mt-10">
            Sans engagement &middot; R&eacute;siliable &agrave; tout moment &middot; Paiement s&eacute;curis&eacute;
          </p>
        </div>
      </section>

      <SiteFooter />

    </div>
  )
}
