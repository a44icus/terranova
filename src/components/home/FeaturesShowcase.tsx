'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

const INTERVAL = 5500 // ms entre auto-advance

/* ── Couleurs accent par feature ─────────────────────────────── */
const ACCENTS = ['#4F46E5', '#0891B2', '#059669', '#D97706', '#7C3AED']

/* ── Données des features ─────────────────────────────────────── */
const FEATURES = [
  {
    key:   'carte',
    tab:   'Carte',
    num:   '01',
    title: 'Cherchez où vous voulez vivre',
    desc:  'Dessinez une zone au lasso, activez la vue satellite, explorez les scores de quartier. La recherche géographique la plus précise du marché français.',
    cta:   { href: '/carte',   label: 'Explorer la carte' },
    tags:  ['Sélection au lasso', 'Clustering intelligent', 'Score de quartier', 'Vue satellite', 'Filtres temps réel'],
  },
  {
    key:   'score',
    tab:   'Score',
    num:   '02',
    title: 'Chaque quartier noté sur 100',
    desc:  'Transports, commerces, écoles, sécurité — des données réelles agrégées pour chaque bien. Comparez objectivement avant de visiter.',
    cta:   { href: '/annonces', label: 'Voir les annonces' },
    tags:  ['Transports', 'Commerces', 'Écoles', 'Santé', 'Loisirs'],
  },
  {
    key:   'filtres',
    tab:   'Filtres',
    num:   '03',
    title: 'Le bien parfait en 30 secondes',
    desc:  "Prix, surface, DPE, pièces, options — combinez tous les filtres et comparez jusqu'à 3 biens côte à côte. Zéro résultat hors-sujet.",
    cta:   { href: '/annonces', label: 'Lancer une recherche' },
    tags:  ['Budget précis', 'Surface min/max', 'DPE A–C', 'Nb pièces', 'Comparateur'],
  },
  {
    key:   'contact',
    tab:   'Contact',
    num:   '04',
    title: 'Vendeur et acheteur en direct',
    desc:  'Messagerie intégrée, demande de visite en un clic, aucune commission cachée. Vous parlez directement avec la personne qui connaît le bien.',
    cta:   { href: '/annonces', label: 'Trouver un bien' },
    tags:  ['Zéro commission', 'Messagerie intégrée', 'Visites planifiées', 'Réponse rapide'],
  },
  {
    key:   'publier',
    tab:   'Publier',
    num:   '05',
    title: 'En ligne en 5 minutes chrono',
    desc:  'Photos, description, localisation précise, DPE — tout en quelques clics. Gratuit pour les particuliers, et des stats complètes dès le premier jour.',
    cta:   { href: '/publier', label: 'Publier gratuitement' },
    tags:  ['Gratuit', 'Photos illimitées', 'Localisation précise', 'Statistiques', 'Mise en ligne instantanée'],
  },
]

/* ════════════════════════════════════════════════════════════════
   VISUALS — un composant animé par feature
══════════════════════════════════════════════════════════════════ */

/* 01 — Carte MapLibre réelle */
function CarteVisual({ accent }: { accent: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<any>(null)

  const BIENS = [
    { lng: 2.3120, lat: 48.8700, prix: '385 000 €' },
    { lng: 2.3750, lat: 48.8680, prix: '290 000 €' },
    { lng: 2.3400, lat: 48.8430, prix: '520 000 €' },
    { lng: 2.3600, lat: 48.8820, prix: '195 000 €' },
    { lng: 2.3050, lat: 48.8520, prix: '680 000 €' },
  ]

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    import('maplibre-gl').then(({ default: mgl }) => {
      if (!containerRef.current) return
      const map = new mgl.Map({
        container: containerRef.current,
        style: 'https://tiles.openfreemap.org/styles/liberty',
        center: [2.3400, 48.8600],
        zoom: 11.8,
        attributionControl: false,
      })
      mapRef.current = map

      map.on('load', () => {
        map.resize()
        BIENS.forEach(b => {
          const el = document.createElement('div')
          el.innerHTML = `
            <div style="
              background:${accent};color:white;
              font:700 11px 'DM Sans',sans-serif;
              padding:3px 9px;border-radius:20px;
              box-shadow:0 2px 10px rgba(0,0,0,.4);
              border:2px solid white;white-space:nowrap;
            ">${b.prix}</div>`
          new mgl.Marker({ element: el, anchor: 'bottom' })
            .setLngLat([b.lng, b.lat])
            .addTo(map)
        })
      })
    })

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="relative w-full h-full">
      {/* Map container — bloc normal w-full h-full (PAS absolute, MapLibre n'aime pas) */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Overlay teinté */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'rgba(6,9,15,0.22)' }} />

      {/* Lasso animé */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 300" fill="none">
        <rect x="55" y="50" width="290" height="200" rx="16"
          fill={`${accent}10`} stroke={accent} strokeWidth="2" strokeDasharray="10 5" opacity="0.75">
          <animate attributeName="stroke-dashoffset" values="0;30" dur="2s" repeatCount="indefinite"/>
        </rect>
      </svg>

      {/* Badge résumé */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 text-center px-4 py-2.5 rounded-xl pointer-events-none"
        style={{ background:'rgba(8,8,20,.82)', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,.14)' }}>
        <div className="text-[10px] text-white/45 mb-0.5">5 biens dans la zone</div>
        <div className="text-sm font-bold text-white">195 000 € — 680 000 €</div>
      </div>
    </div>
  )
}

/* 02 — Score quartier */
function ScoreVisual({ accent }: { accent: string }) {
  const scores = [
    { label: 'Transports', val: 85, color: '#22D3EE' },
    { label: 'Commerces',  val: 72, color: accent },
    { label: 'Écoles',     val: 91, color: '#34D399' },
    { label: 'Sécurité',   val: 78, color: '#F59E0B' },
    { label: 'Loisirs',    val: 68, color: '#A78BFA' },
  ]
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center gap-3 px-8">
      {/* Score global */}
      <div className="mb-2 text-center">
        <div className="text-5xl font-bold text-white" style={{ fontFamily: "'DM Serif Display', serif" }}>79</div>
        <div className="text-xs text-white/40 uppercase tracking-widest mt-1">Score global</div>
      </div>
      {/* Barres */}
      {scores.map((s, i) => (
        <div key={s.label} className="w-full max-w-xs">
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-white/50">{s.label}</span>
            <span className="font-semibold" style={{ color: s.color }}>{s.val}</span>
          </div>
          <div className="w-full h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className="h-full rounded-full" style={{
              width: `${s.val}%`,
              background: s.color,
              animation: `growWidth 1.2s ${0.15 * i}s ease-out backwards`,
            }} />
          </div>
        </div>
      ))}
    </div>
  )
}

/* 03 — Filtres */
function FiltresVisual({ accent }: { accent: string }) {
  const filters = [
    { label: 'Appartement', active: true },
    { label: '60–120 m²',   active: true },
    { label: 'DPE A–C',     active: true },
    { label: '< 400 000 €', active: true },
    { label: 'Parking',     active: false },
    { label: '3+ pièces',   active: false },
  ]
  return (
    <div className="relative w-full h-full flex flex-col justify-center px-6 gap-5">
      {/* Filtres actifs */}
      <div className="flex flex-wrap gap-2">
        {filters.map((f, i) => (
          <span key={f.label}
            className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all"
            style={{
              background: f.active ? accent : 'rgba(255,255,255,0.06)',
              color: f.active ? 'white' : 'rgba(255,255,255,0.35)',
              border: f.active ? 'none' : '1px solid rgba(255,255,255,0.1)',
              animation: `fadeSlideUp 0.4s ${0.08 * i}s ease backwards`,
            }}>
            {f.label}
          </span>
        ))}
      </div>

      {/* Divider */}
      <div className="h-px bg-white/08" />

      {/* Mini cards résultats */}
      <div className="space-y-2">
        <div className="text-[11px] text-white/30 uppercase tracking-wider mb-1">23 biens trouvés</div>
        {[
          { prix: '285 000 €', titre: 'T3 lumineux · Paris 11e', surf: '78 m²', dpe: 'B' },
          { prix: '340 000 €', titre: 'Appartement rénové · Lyon 6e', surf: '92 m²', dpe: 'C' },
        ].map((b, i) => (
          <div key={i} className="flex items-center justify-between bg-white/05 rounded-xl px-3 py-2.5 border border-white/08"
            style={{ animation: `fadeSlideUp 0.4s ${0.2 + 0.12 * i}s ease backwards` }}>
            <div>
              <div className="text-sm font-semibold text-white">{b.prix}</div>
              <div className="text-[10px] text-white/40">{b.titre}</div>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-white/40">
              <span>{b.surf}</span>
              <span className="font-bold text-white text-[9px] px-1.5 py-0.5 rounded"
                style={{ background: b.dpe === 'B' ? '#558B2F' : '#9E9D24' }}>
                {b.dpe}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* 04 — Contact direct */
function ContactVisual({ accent }: { accent: string }) {
  return (
    <div className="relative w-full h-full flex flex-col justify-center px-6 gap-3">
      {/* Header conversation */}
      <div className="flex items-center gap-3 pb-3 border-b border-white/08">
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
          style={{ background: `linear-gradient(135deg, ${accent}, #7C3AED)` }}>M</div>
        <div>
          <div className="text-sm font-medium text-white">Marie V.</div>
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            En ligne
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="space-y-2.5 flex-1">
        {[
          { from: 'them', text: 'Bonjour, votre bien est-il encore disponible ?', delay: '0.1s' },
          { from: 'me',   text: 'Oui, tout à fait ! Quand souhaitez-vous visiter ?', delay: '0.5s' },
          { from: 'them', text: 'Samedi matin si possible 🙏', delay: '0.9s' },
          { from: 'me',   text: 'Parfait — samedi 10h, je vous confirme !', delay: '1.3s' },
        ].map((m, i) => (
          <div key={i} className={`flex ${m.from === 'me' ? 'justify-end' : 'justify-start'}`}
            style={{ animation: `fadeSlideUp 0.4s ${m.delay} ease backwards` }}>
            <div className="text-[11px] leading-relaxed px-3 py-2 rounded-2xl max-w-[75%]"
              style={{
                background: m.from === 'me' ? accent : 'rgba(255,255,255,0.08)',
                color: m.from === 'me' ? 'white' : 'rgba(255,255,255,0.75)',
                borderRadius: m.from === 'me' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              }}>
              {m.text}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        <div className="flex justify-start" style={{ animation: 'fadeSlideUp 0.4s 1.7s ease backwards' }}>
          <div className="px-3.5 py-2.5 rounded-2xl rounded-bl-sm flex gap-1 items-center"
            style={{ background: 'rgba(255,255,255,0.08)' }}>
            {[0, 1, 2].map(i => (
              <span key={i} className="w-1.5 h-1.5 rounded-full bg-white/40 inline-block"
                style={{ animation: `typingDot 1.4s ${0.2 * i}s ease-in-out infinite` }} />
            ))}
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 bg-white/06 border border-white/10 rounded-2xl px-3 py-2.5 mt-1">
        <span className="text-xs text-white/25 flex-1">Écrire un message…</span>
        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: accent }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </div>
      </div>
    </div>
  )
}

/* 05 — Publication */
function PublierVisual({ accent }: { accent: string }) {
  const miniMapRef       = useRef<HTMLDivElement>(null)
  const miniMapInstanceRef = useRef<any>(null)

  // Coordonnées : 12 rue de la Paix, Paris 1er
  const LNG = 2.3306
  const LAT = 48.8699

  useEffect(() => {
    if (!miniMapRef.current || miniMapInstanceRef.current) return

    import('maplibre-gl').then(({ default: mgl }) => {
      if (!miniMapRef.current) return
      const map = new mgl.Map({
        container: miniMapRef.current,
        style: 'https://tiles.openfreemap.org/styles/liberty',
        center: [LNG, LAT],
        zoom: 15,
        attributionControl: false,
      })
      miniMapInstanceRef.current = map

      map.on('load', () => {
        map.resize()
        const el = document.createElement('div')
        el.style.cssText = `
          width:16px;height:16px;
          background:${accent};
          border:3px solid white;
          border-radius:50%;
          box-shadow:0 0 0 5px ${accent}40, 0 2px 10px rgba(0,0,0,.45);
        `
        new mgl.Marker({ element: el }).setLngLat([LNG, LAT]).addTo(map)
      })
    })

    return () => {
      miniMapInstanceRef.current?.remove()
      miniMapInstanceRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const steps = [
    { label: 'Type de bien', done: true },
    { label: 'Photos',       done: true },
    { label: 'Description',  done: true },
    { label: 'Localisation', done: false, active: true },
    { label: 'Prix',         done: false },
  ]

  return (
    <div className="relative w-full h-full flex flex-col justify-center px-6 gap-4">
      {/* Steps */}
      <div className="flex gap-1.5 mb-1">
        {steps.map((s, i) => (
          <div key={i} className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{
                width: s.done ? '100%' : s.active ? '55%' : '0%',
                background: s.done ? '#34D399' : accent,
                animation: s.active ? 'growWidth 1.5s ease' : undefined,
              }} />
          </div>
        ))}
      </div>
      <div className="text-[10px] text-white/30 mb-1">Étape 4 / 5 — Localisation</div>

      {/* Vraie mini-carte MapLibre — bloc normal w-full h-full */}
      <div className="h-28 rounded-2xl overflow-hidden relative border border-white/10">
        <div ref={miniMapRef} className="w-full h-full" />
        {/* Overlay teinté posé au-dessus du canvas */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'rgba(6,9,15,0.20)' }} />
        <div className="absolute bottom-2 right-2 z-10 bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1 text-[10px] text-white/70 pointer-events-none">
          📍 Coordonnées précises
        </div>
      </div>

      {/* Champ adresse */}
      <div className="bg-white/06 border-2 rounded-xl px-3 py-2.5" style={{ borderColor: accent }}>
        <div className="text-[10px] text-white/40 mb-0.5">Adresse</div>
        <div className="text-sm text-white/80">12 rue de la Paix, Paris 75001</div>
      </div>

      {/* Bouton */}
      <div className="text-center py-2.5 rounded-xl text-sm font-semibold text-white"
        style={{ background: accent }}>
        Suivant →
      </div>

      {/* Badge gratuit */}
      <div className="absolute top-4 right-4 text-[10px] font-bold px-2.5 py-1 rounded-full text-white"
        style={{ background: '#059669' }}>
        Gratuit ✓
      </div>
    </div>
  )
}

const VISUALS = [CarteVisual, ScoreVisual, FiltresVisual, ContactVisual, PublierVisual]

/* ════════════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
══════════════════════════════════════════════════════════════════ */
export default function FeaturesShowcase() {
  const [active, setActive] = useState(0)
  const [progress, setProgress] = useState(0)
  const [paused, setPaused]   = useState(false)   // true dès qu'un clic manuel a eu lieu
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const progRef  = useRef<ReturnType<typeof setInterval> | null>(null)

  const accent = ACCENTS[active]

  function startTimers(idx = active) {
    if (timerRef.current)  clearInterval(timerRef.current)
    if (progRef.current)   clearInterval(progRef.current)

    setProgress(0)
    const step = 100 / (INTERVAL / 50)

    progRef.current = setInterval(() => {
      setProgress(p => Math.min(p + step, 100))
    }, 50)

    timerRef.current = setInterval(() => {
      setActive(prev => {
        const next = (prev + 1) % FEATURES.length
        return next
      })
    }, INTERVAL)
  }

  useEffect(() => {
    if (paused) return  // l'utilisateur a cliqué manuellement → on ne relance plus l'auto-advance
    startTimers()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (progRef.current)  clearInterval(progRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, paused])

  function handleTab(idx: number) {
    // Clic manuel : on stoppe définitivement l'auto-advance
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    if (progRef.current)  { clearInterval(progRef.current);  progRef.current  = null }
    setProgress(0)
    setPaused(true)
    setActive(idx)
  }

  const Visual = VISUALS[active]
  const feat   = FEATURES[active]

  return (
    <section className="relative overflow-hidden py-12 lg:py-16" style={{ background: '#06090F' }}>

      {/* ── CSS animations globales à ce composant ── */}
      <style>{`
        @keyframes ping {
          0%    { transform: scale(0.8); opacity: 0.6; }
          80%   { transform: scale(2);   opacity: 0; }
          100%  { opacity: 0; }
        }
        @keyframes growWidth {
          from { width: 0; }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes typingDot {
          0%,60%,100% { transform: translateY(0); opacity: 0.4; }
          30%          { transform: translateY(-4px); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; }
        }
      `}</style>

      {/* ── Fond : orbes + grid ── */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Grid dots */}
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: 'radial-gradient(circle, #94A3B8 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }} />
        {/* Orbes couleur */}
        <motion.div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[500px] rounded-full pointer-events-none"
          animate={{ background: `radial-gradient(circle, ${accent}18 0%, transparent 65%)` }}
          transition={{ duration: 1.2 }}
          style={{ filter: 'blur(80px)' }}
        />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 65%)', filter: 'blur(60px)' }} />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">

        {/* ── Header ── */}
        <div className="text-center mb-8 lg:mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <span className="h-px w-6" style={{ background: accent }} />
            <span className="text-[10px] font-mono font-semibold tracking-[0.3em] uppercase"
              style={{ color: accent }}>
              Pourquoi Terranova
            </span>
            <span className="h-px w-6" style={{ background: accent }} />
          </div>
          <h2 className="font-serif text-white leading-[1.05] mb-3"
            style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(1.8rem, 3.6vw, 3rem)' }}>
            Tout ce qu'il faut.<br />
            <em style={{ color: accent }}>Rien de superflu.</em>
          </h2>
          <p className="text-white/40 text-sm max-w-lg mx-auto leading-relaxed">
            Cinq outils pensés pour aller droit au but, que vous soyez acheteur, locataire ou vendeur.
          </p>
        </div>

        {/* ── Tab navigation ── */}
        <div className="flex justify-center mb-12 lg:mb-18">
          <div className="relative flex gap-1 p-1.5 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {FEATURES.map((f, i) => (
              <button
                key={f.key}
                onClick={() => handleTab(i)}
                className="relative px-4 py-2 rounded-xl text-sm font-medium transition-colors duration-200 overflow-hidden"
                style={{ color: active === i ? 'white' : 'rgba(255,255,255,0.4)' }}
              >
                {/* Active pill background */}
                {active === i && (
                  <motion.div
                    layoutId="tab-bg"
                    className="absolute inset-0 rounded-xl"
                    style={{ background: accent }}
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  />
                )}
                {/* Progress bar at bottom of active tab */}
                {active === i && (
                  <div className="absolute bottom-0 left-0 h-0.5 rounded-full"
                    style={{ width: `${progress}%`, background: 'rgba(255,255,255,0.4)' }} />
                )}
                <span className="relative z-10 whitespace-nowrap">{f.tab}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Content panel ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-8 items-stretch">

          {/* Texte */}
          <AnimatePresence mode="wait">
            <motion.div
              key={feat.key + '-text'}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="flex flex-col justify-center py-2 lg:py-4"
            >
              {/* Numéro */}
              <div className="font-serif text-6xl font-bold leading-none mb-3 select-none"
                style={{
                  fontFamily: "'DM Serif Display', serif",
                  color: 'transparent',
                  WebkitTextStroke: `1.5px ${accent}40`,
                }}>
                {feat.num}
              </div>

              <h3 className="font-serif text-xl lg:text-2xl text-white mb-3 leading-snug"
                style={{ fontFamily: "'DM Serif Display', serif" }}>
                {feat.title}
              </h3>

              <p className="text-white/50 text-sm leading-relaxed mb-4">
                {feat.desc}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-5">
                {feat.tags.map(tag => (
                  <span key={tag}
                    className="text-xs px-3 py-1.5 rounded-full"
                    style={{
                      background: `${accent}18`,
                      color: `${accent}CC`,
                      border: `1px solid ${accent}30`,
                    }}>
                    {tag}
                  </span>
                ))}
              </div>

              {/* CTA */}
              <Link href={feat.cta.href}
                className="self-start inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
                style={{ background: accent, boxShadow: `0 4px 20px ${accent}40` }}>
                {feat.cta.label}
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </motion.div>
          </AnimatePresence>

          {/* Visual */}
          <AnimatePresence mode="wait">
            <motion.div
              key={feat.key + '-visual'}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
              className="relative rounded-3xl overflow-hidden"
              style={{
                background: 'linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
                border: `1px solid ${accent}25`,
                height: 320,            /* hauteur explicite — nécessaire pour propager aux enfants en h-full */
                boxShadow: `0 0 60px ${accent}12, inset 0 1px 0 rgba(255,255,255,0.06)`,
              }}
            >
              {/* Corner dots */}
              <div className="absolute top-3 left-4 flex gap-1.5 z-20">
                {['#FF5F57','#FEBC2E','#28C840'].map(c => (
                  <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c, opacity: 0.6 }} />
                ))}
              </div>

              <div className="w-full h-full pt-8">
                <Visual accent={accent} />
              </div>
            </motion.div>
          </AnimatePresence>

        </div>

        {/* ── Feature dots navigation (mobile) ── */}
        <div className="flex justify-center gap-2 mt-8 lg:hidden">
          {FEATURES.map((_, i) => (
            <button key={i} onClick={() => handleTab(i)}
              className="rounded-full transition-all duration-300"
              style={{
                width:  active === i ? 20 : 6,
                height: 6,
                background: active === i ? accent : 'rgba(255,255,255,0.2)',
              }} />
          ))}
        </div>

      </div>
    </section>
  )
}
