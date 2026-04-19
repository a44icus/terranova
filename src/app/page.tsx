import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatPrix } from '@/lib/geo'
import type { Metadata } from 'next'
import HeroBubbles from '@/components/hero/HeroBubbles'

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
      .limit(7),
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
      <header className="absolute top-0 left-0 right-0 z-50 px-6 h-14 flex items-center justify-between">
        <Link href="/" className="font-serif text-[22px] tracking-wide text-white"
          style={{ fontFamily: "'DM Serif Display', serif" }}>
          Terra<span className="text-[#818CF8] italic">nova</span>
        </Link>
        <nav className="flex items-center gap-1">
          <Link href="/annonces"
            className="text-white/60 hover:text-white text-sm px-3 py-1.5 rounded-md hover:bg-white/08 transition-all">
            Annonces
          </Link>
          <Link href="/carte"
            className="text-white/60 hover:text-white text-sm px-3 py-1.5 rounded-md hover:bg-white/08 transition-all">
            Carte
          </Link>
          <Link href="/estimer"
            className="text-white/60 hover:text-white text-sm px-3 py-1.5 rounded-md hover:bg-white/08 transition-all">
            Estimer
          </Link>
          {user ? (
            <>
              <Link href="/compte"
                className="text-white/60 hover:text-white text-sm px-3 py-1.5 rounded-md hover:bg-white/08 transition-all">
                Mon compte
              </Link>
              <Link href="/publier"
                className="ml-2 bg-[#4F46E5] text-white text-sm font-medium px-4 py-1.5 rounded-md hover:bg-[#4338CA] transition-colors">
                + Publier
              </Link>
            </>
          ) : (
            <>
              <Link href="/auth/login"
                className="text-white/60 hover:text-white text-sm px-3 py-1.5 rounded-md hover:bg-white/08 transition-all">
                Se connecter
              </Link>
              <Link href="/publier"
                className="ml-2 bg-[#4F46E5] text-white text-sm font-medium px-4 py-1.5 rounded-md hover:bg-[#4338CA] transition-colors">
                + Publier un bien
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="h-screen flex overflow-hidden relative bg-[#0F172A]">

        {/* Photo plein écran derrière tout */}
        <Image
          src={biens[0]?.photo_url ?? '/hero2.jpg'}
          alt=""
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />

        {/* Gradient gauche pour lisibilité du texte */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'linear-gradient(to right, rgba(9,9,35,0.88) 0%, rgba(9,9,35,0.75) 35%, rgba(9,9,35,0.3) 60%, rgba(9,9,35,0.05) 100%)',
        }} />
        {/* Vignette haut & bas */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'linear-gradient(to bottom, rgba(9,9,35,0.4) 0%, transparent 20%, transparent 80%, rgba(9,9,35,0.5) 100%)',
        }} />

        {/* ── Colonne gauche — texte ── */}
        <div className="relative flex flex-col justify-center px-10 lg:px-16 xl:px-20 w-[52%] flex-shrink-0 z-10">

          <div className="relative z-10">
            <div className="flex items-center gap-3 text-[#818CF8] text-[11px] font-semibold tracking-[0.18em] uppercase mb-7">
              <span className="w-8 h-px bg-[#4F46E5]" />
              Immobilier &middot; France
            </div>

            <h1 className="font-serif text-white leading-[0.95] mb-7"
              style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(3.2rem, 5vw, 5.5rem)' }}>
              {"L'immobilier"}<br />
              <em className="text-[#818CF8]">autrement.</em>
            </h1>

            <p className="text-white/50 text-base leading-relaxed mb-10 max-w-sm">
              Carte interactive, filtres intelligents,<br />contact direct. Sans interm&eacute;diaire.
            </p>

            {/* CTAs */}
            <div className="flex gap-3 mb-12 flex-wrap">
              <Link href="/carte"
                className="inline-flex items-center gap-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold px-7 py-3.5 rounded-xl text-sm transition-all shadow-xl shadow-[#4F46E5]/30 hover:-translate-y-0.5 whitespace-nowrap">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
                  <line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>
                </svg>
                Voir la carte
              </Link>
              <Link href="/publier"
                className="inline-flex items-center gap-2 border-2 border-white/20 hover:border-[#4F46E5] hover:bg-[#4F46E5]/10 text-white font-semibold px-7 py-3.5 rounded-xl text-sm transition-all hover:-translate-y-0.5 whitespace-nowrap">
                + Publier une annonce
              </Link>
              <Link href="/estimer" className="text-white/50 hover:text-white text-sm underline underline-offset-2">
                Estimer mon bien →
              </Link>
            </div>

            {/* Stats */}
            <div className="flex gap-8 pt-8 border-t border-white/08">
              {[
                { val: (totalBiens ?? 0).toLocaleString('fr-FR'), label: 'biens' },
                { val: (totalVilles ?? 0).toLocaleString('fr-FR'), label: 'villes' },
                { val: '0\u00a0\u20ac', label: 'commission' },
              ].map(s => (
                <div key={s.label}>
                  <div className="font-serif text-2xl text-white" style={{ fontFamily: "'DM Serif Display', serif" }}>{s.val}</div>
                  <div className="text-[11px] text-white/30 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Barre recherche en bas */}
          <form action="/annonces" method="get"
            className="absolute bottom-0 left-0 right-0 flex items-center gap-2 px-10 lg:px-16 py-4 border-t border-white/08"
            style={{ background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(12px)' }}>
            <input name="ville" type="text" placeholder="Ville, d&eacute;partement&hellip;"
              className="flex-1 bg-white/06 border border-white/10 text-white placeholder:text-white/30 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#4F46E5] transition-colors" />
            <button type="submit"
              className="bg-[#4F46E5] hover:bg-[#4338CA] text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap">
              Rechercher
            </button>
          </form>
        </div>

        {/* ── Colonne droite — bulles ── */}
        <div className="relative flex-1 z-10">
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
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#4F46E5]">S&eacute;lection</span>
            <h2 className="font-serif text-4xl text-[#0F172A] mt-1.5"
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
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3" style={{ gridAutoRows: '220px' }}>

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

          {biens.slice(1, 7).map((b: any) => (
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

      {/* ── Carte teaser ─────────────────────────────────────────── */}
      <section className="bg-[#0F172A] relative overflow-hidden py-24 px-6">
        <div className="absolute inset-0 pointer-events-none opacity-[0.04]" style={{
          backgroundImage: 'radial-gradient(circle, #94A3B8 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] pointer-events-none" style={{
          background: 'radial-gradient(circle at 80% 20%, rgba(79,70,229,0.18) 0%, transparent 60%)',
        }} />

        <div className="max-w-6xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#818CF8] flex items-center gap-2 mb-8">
              <span className="w-6 h-px bg-[#4F46E5]" /> Carte interactive
            </span>
            <h2 className="font-serif text-4xl xl:text-5xl text-white leading-tight mb-6"
              style={{ fontFamily: "'DM Serif Display', serif" }}>
              Voyez tous les biens.<br />{"D'un"} seul regard.
            </h2>
            <p className="text-white/50 leading-relaxed mb-8 max-w-sm">
              La carte regroupe tous les biens disponibles. S&eacute;lectionnez une zone au lasso, filtrez en temps r&eacute;el, d&eacute;couvrez le score de quartier.
            </p>
            <div className="flex gap-4 flex-wrap">
              <Link href="/carte"
                className="inline-flex items-center gap-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold px-6 py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-[#4F46E5]/30 hover:-translate-y-0.5">
                Ouvrir la carte &rarr;
              </Link>
              <Link href="/annonces"
                className="inline-flex items-center gap-2 border border-white/15 hover:border-[#4F46E5]/60 text-white/60 hover:text-white font-medium px-6 py-3.5 rounded-xl text-sm transition-all">
                Liste des annonces
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: '\uD83C\uDFAF', label: 'S\u00e9lection au lasso' },
              { icon: '\uD83D\uDD0D', label: 'Zoom sur votre secteur' },
              { icon: '\uD83D\uDCCD', label: 'Clustering intelligent' },
              { icon: '\uD83C\uDFD8', label: 'Score de quartier' },
              { icon: '\u2696', label: 'Comparateur int\u00e9gr\u00e9' },
              { icon: '\uD83D\uDCCA', label: 'Filtres temps r\u00e9el' },
            ].map(f => (
              <div key={f.label}
                className="flex items-center gap-3 bg-white/04 border border-white/06 rounded-xl px-4 py-3 hover:bg-[#4F46E5]/10 hover:border-[#4F46E5]/30 transition-all">
                <span className="text-xl">{f.icon}</span>
                <span className="text-white/60 text-sm">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────── */}
      <section className="py-28 px-4 overflow-hidden relative" style={{ background: '#F5F0EB' }}>
        <div className="max-w-6xl mx-auto relative z-10">

          {/* En-tête */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-16">
            <div>
              <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#4F46E5] flex items-center gap-3 mb-5">
                <span className="w-8 h-px bg-[#4F46E5]" />Pourquoi Terranova
              </span>
              <h2 className="font-serif text-5xl xl:text-6xl text-[#0F172A] leading-[1.05]"
                style={{ fontFamily: "'DM Serif Display', serif" }}>
                Tout ce {"qu'il"} faut.<br />
                <span className="text-[#4F46E5]">Rien de superflu.</span>
              </h2>
            </div>
            <Link href="/carte"
              className="flex-shrink-0 inline-flex items-center gap-2 bg-[#0F172A] hover:bg-[#4F46E5] text-white text-sm font-medium px-5 py-3 rounded-xl transition-all duration-300 self-start sm:self-auto">
              Explorer la carte →
            </Link>
          </div>

          {/* Grille bento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* ── Carte 1 grande : Carte interactive ── */}
            <Link href="/carte"
              className="group relative rounded-3xl overflow-hidden flex flex-col justify-between p-9 min-h-[320px] hover:-translate-y-1 transition-all duration-300 shadow-xl shadow-[#4F46E5]/15"
              style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4F46E5 100%)' }}>
              <div className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full opacity-25 group-hover:opacity-40 transition-opacity duration-500"
                style={{ background: 'radial-gradient(circle, #818CF8 0%, transparent 70%)' }} />
              <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }} />
              <div className="relative z-10">
                <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-white/30">01</span>
                <div className="mt-8 mb-3 text-5xl">🗺</div>
                <h3 className="font-serif text-3xl text-white leading-tight"
                  style={{ fontFamily: "'DM Serif Display', serif" }}>
                  Carte interactive
                </h3>
                <p className="mt-3 text-white/60 text-sm leading-relaxed max-w-xs">
                  Dessinez une zone au lasso, zoomez sur votre quartier, explorez les biens en un coup d&apos;&oelig;il.
                </p>
              </div>
              <div className="relative z-10 mt-8 flex items-center gap-2 text-white/70 group-hover:text-white text-sm font-medium transition-colors">
                Ouvrir la carte <span className="group-hover:translate-x-1.5 transition-transform inline-block">→</span>
              </div>
            </Link>

            {/* Colonne droite : 2 cartes empilées */}
            <div className="flex flex-col gap-4">

              {/* Carte 2 */}
              <Link href="/annonces"
                className="group relative rounded-3xl bg-white border border-[#0F172A]/08 p-7 flex gap-5 items-start hover:-translate-y-0.5 hover:shadow-lg hover:border-[#4F46E5]/20 transition-all duration-300">
                <div className="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                  style={{ background: 'linear-gradient(135deg, #EEF2FF, #C7D2FE)' }}>
                  ⚡
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold tracking-[0.15em] text-[#0F172A]/25">02</span>
                  <h3 className="font-serif text-xl text-[#0F172A] mt-1 mb-1.5"
                    style={{ fontFamily: "'DM Serif Display', serif" }}>
                    Filtres &amp; comparateur
                  </h3>
                  <p className="text-[#0F172A]/50 text-sm leading-relaxed">
                    Prix, surface, DPE. Comparez 3 biens c&ocirc;te &agrave; c&ocirc;te.
                  </p>
                </div>
              </Link>

              {/* Carte 3 */}
              <div className="group relative rounded-3xl bg-white border border-[#0F172A]/08 p-7 flex gap-5 items-start hover:-translate-y-0.5 hover:shadow-lg hover:border-[#0891B2]/20 transition-all duration-300">
                <div className="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                  style={{ background: 'linear-gradient(135deg, #ECFEFF, #A5F3FC)' }}>
                  📍
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold tracking-[0.15em] text-[#0F172A]/25">03</span>
                  <h3 className="font-serif text-xl text-[#0F172A] mt-1 mb-1.5"
                    style={{ fontFamily: "'DM Serif Display', serif" }}>
                    Score de quartier
                  </h3>
                  <p className="text-[#0F172A]/50 text-sm leading-relaxed">
                    Transports, commerces, &eacute;coles — des donn&eacute;es r&eacute;elles pour chaque bien.
                  </p>
                </div>
              </div>

            </div>

            {/* Carte 4 */}
            <div className="group relative rounded-3xl bg-white border border-[#0F172A]/08 p-7 flex gap-5 items-start hover:-translate-y-0.5 hover:shadow-lg hover:border-[#4F46E5]/20 transition-all duration-300">
              <div className="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                style={{ background: 'linear-gradient(135deg, #EEF2FF, #C7D2FE)' }}>
                ✉
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold tracking-[0.15em] text-[#0F172A]/25">04</span>
                <h3 className="font-serif text-xl text-[#0F172A] mt-1 mb-1.5"
                  style={{ fontFamily: "'DM Serif Display', serif" }}>
                  Contact direct
                </h3>
                <p className="text-[#0F172A]/50 text-sm leading-relaxed">
                  Envoyez un message &agrave; l&apos;annonceur sans interm&eacute;diaire. Z&eacute;ro commission, z&eacute;ro d&eacute;lai.
                </p>
              </div>
            </div>

            {/* Carte 5 */}
            <Link href="/publier"
              className="group relative rounded-3xl bg-white border border-[#0F172A]/08 p-7 flex gap-5 items-start hover:-translate-y-0.5 hover:shadow-lg hover:border-[#4F46E5]/20 transition-all duration-300">
              <div className="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                style={{ background: 'linear-gradient(135deg, #EEF2FF, #C7D2FE)' }}>
                🎯
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold tracking-[0.15em] text-[#0F172A]/25">05</span>
                <h3 className="font-serif text-xl text-[#0F172A] mt-1 mb-1.5"
                  style={{ fontFamily: "'DM Serif Display', serif" }}>
                  Publication gratuite
                </h3>
                <p className="text-[#0F172A]/50 text-sm leading-relaxed">
                  Publiez en quelques minutes. Photos, description, localisation — sans frais cach&eacute;s.
                </p>
              </div>
            </Link>

          </div>
        </div>
      </section>

      {/* ── Tarifs ───────────────────────────────────────────────── */}
      <section className="bg-[#0F172A] py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.04]" style={{
          backgroundImage: 'radial-gradient(circle, #94A3B8 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none" style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(79,70,229,0.2) 0%, transparent 65%)',
        }} />

        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-14">
            <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#818CF8]">Tarifs</span>
            <h2 className="font-serif text-4xl text-white mt-2 mb-3"
              style={{ fontFamily: "'DM Serif Display', serif" }}>
              Simple, transparent,<br />sans surprise.
            </h2>
            <p className="text-white/40 text-sm max-w-md mx-auto">
              Commencez gratuitement. Passez au plan sup&eacute;rieur quand vous en avez besoin.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PLANS.map(plan => (
              <div key={plan.name}
                className={`relative rounded-2xl p-8 flex flex-col transition-all ${
                  plan.featured
                    ? 'bg-[#4F46E5] shadow-2xl shadow-[#4F46E5]/40 scale-[1.02]'
                    : 'bg-white/05 border border-white/10 hover:border-[#4F46E5]/40'
                }`}>

                {plan.featured && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 text-[10px] font-bold px-3 py-1 rounded-full tracking-wide uppercase">
                    Populaire
                  </div>
                )}

                <div className="mb-6">
                  <h3 className={`font-semibold text-lg mb-1 ${plan.featured ? 'text-white' : 'text-white'}`}>
                    {plan.name}
                  </h3>
                  <p className={`text-xs leading-relaxed ${plan.featured ? 'text-white/70' : 'text-white/40'}`}>
                    {plan.desc}
                  </p>
                </div>

                <div className="mb-8">
                  <div className="flex items-end gap-1.5">
                    <span className={`font-serif text-5xl ${plan.featured ? 'text-white' : 'text-white'}`}
                      style={{ fontFamily: "'DM Serif Display', serif" }}>
                      {plan.price}&euro;
                    </span>
                    <span className={`text-sm mb-2 ${plan.featured ? 'text-white/60' : 'text-white/30'}`}>
                      /{plan.period}
                    </span>
                  </div>
                </div>

                <ul className="space-y-3 flex-1 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className={`flex items-start gap-2.5 text-sm ${plan.featured ? 'text-white/90' : 'text-white/60'}`}>
                      <svg className={`w-4 h-4 flex-shrink-0 mt-0.5 ${plan.featured ? 'text-white' : 'text-[#4F46E5]'}`}
                        viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                      {f}
                    </li>
                  ))}
                  {plan.missing.map(f => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-white/20 line-through">
                      <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-white/15" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link href={plan.href}
                  className={`w-full text-center py-3 rounded-xl text-sm font-semibold transition-all ${
                    plan.featured
                      ? 'bg-white text-[#4F46E5] hover:bg-white/90'
                      : 'bg-[#4F46E5]/20 text-white border border-[#4F46E5]/30 hover:bg-[#4F46E5] hover:border-[#4F46E5]'
                  }`}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-white/25 mt-8">
            Sans engagement &middot; R&eacute;siliable &agrave; tout moment &middot; Paiement s&eacute;curis&eacute;
          </p>
        </div>
      </section>

      {/* ── CTA vendeur ──────────────────────────────────────────── */}
      <section className="border-t border-[#0F172A]/06 grid grid-cols-1 lg:grid-cols-2 min-h-[380px]" style={{ background: '#F5F0EB' }}>
        <div className="px-8 lg:px-16 py-20 flex flex-col justify-center">
          <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#4F46E5] flex items-center gap-2 mb-8">
            <span className="w-6 h-px bg-[#4F46E5]" /> Pour les vendeurs
          </span>
          <h2 className="font-serif text-4xl xl:text-5xl text-[#0F172A] leading-tight mb-6"
            style={{ fontFamily: "'DM Serif Display', serif" }}>
            Votre bien m&eacute;rite<br />{"d'"}être vu.
          </h2>
          <p className="text-[#0F172A]/50 leading-relaxed mb-10 max-w-sm">
            Publiez gratuitement. G&eacute;rez vos photos, suivez vos statistiques, r&eacute;pondez &agrave; vos contacts depuis votre espace personnel.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/publier"
              className="inline-flex items-center justify-center gap-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold px-7 py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-[#4F46E5]/20 hover:-translate-y-0.5">
              Publier gratuitement &rarr;
            </Link>
            <Link href="/auth/register"
              className="inline-flex items-center justify-center gap-2 border border-[#0F172A]/15 hover:border-[#4F46E5]/50 text-[#0F172A]/60 hover:text-[#4F46E5] font-medium px-6 py-3.5 rounded-xl text-sm transition-all">
              Cr&eacute;er un compte
            </Link>
          </div>
        </div>

        <div className="px-8 lg:px-16 py-20 flex flex-col justify-center relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #EDE9E3 0%, #DDD8F0 100%)' }}>
          <div className="absolute inset-0 pointer-events-none opacity-30" style={{
            backgroundImage: 'radial-gradient(circle, #4F46E5 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }} />
          <div className="relative space-y-6">
            {[
              { icon: '📸', label: 'Photos multiples & galerie' },
              { icon: '📊', label: 'Statistiques\u00a0: vues, favoris, contacts' },
              { icon: '✉', label: 'Gestion des messages entrants' },
              { icon: '🔒', label: 'Contr\u00f4le total sur votre annonce' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-white shadow-sm flex items-center justify-center text-xl flex-shrink-0">
                  {item.icon}
                </div>
                <span className="text-[#0F172A]/75 text-sm font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="bg-[#0F172A] border-t border-white/06 px-6 py-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <Link href="/" className="font-serif text-xl text-white tracking-wide"
            style={{ fontFamily: "'DM Serif Display', serif" }}>
            Terra<span className="text-[#818CF8] italic">nova</span>
          </Link>
          <nav className="flex flex-wrap gap-6 text-xs text-white/35">
            <Link href="/annonces" className="hover:text-white transition-colors">Annonces</Link>
            <Link href="/carte" className="hover:text-white transition-colors">Carte interactive</Link>
            <Link href="/publier" className="hover:text-white transition-colors">Publier un bien</Link>
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

    </div>
  )
}
