'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

/* ── Marqueurs de carte décoratifs ───────────────────────────────────────── */
const PINS = [
  { t: '8%',  l: '4%',  s: 28, o: 0.10, r: -8,  c: '#4F46E5' },
  { t: '22%', l: '9%',  s: 20, o: 0.08, r: 6,   c: '#6366F1' },
  { t: '38%', l: '3%',  s: 32, o: 0.12, r: -4,  c: '#4F46E5' },
  { t: '55%', l: '11%', s: 18, o: 0.07, r: 10,  c: '#818CF8' },
  { t: '72%', l: '5%',  s: 24, o: 0.09, r: -6,  c: '#2563EB' },
  { t: '88%', l: '10%', s: 22, o: 0.08, r: 4,   c: '#6366F1' },
  { t: '6%',  l: '93%', s: 24, o: 0.10, r: 8,   c: '#4F46E5' },
  { t: '20%', l: '88%', s: 18, o: 0.07, r: -10, c: '#818CF8' },
  { t: '36%', l: '95%', s: 30, o: 0.11, r: 4,   c: '#2563EB' },
  { t: '52%', l: '90%', s: 22, o: 0.08, r: -6,  c: '#6366F1' },
  { t: '70%', l: '94%', s: 20, o: 0.09, r: 8,   c: '#4F46E5' },
  { t: '86%', l: '89%', s: 26, o: 0.10, r: -4,  c: '#2563EB' },
  { t: '4%',  l: '32%', s: 16, o: 0.06, r: 6,   c: '#818CF8' },
  { t: '3%',  l: '68%', s: 18, o: 0.07, r: -8,  c: '#6366F1' },
  { t: '94%', l: '28%', s: 18, o: 0.07, r: -6,  c: '#4F46E5' },
  { t: '92%', l: '72%', s: 20, o: 0.08, r: 8,   c: '#6366F1' },
]

function MapPin({ size, color, opacity, rotation }: { size: number; color: string; opacity: number; rotation: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}
      style={{ opacity, transform: `rotate(${rotation}deg)`, filter: `drop-shadow(0 2px 6px ${color}40)` }}>
      <path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z"/>
      <circle cx="12" cy="9" r="2.6" fill="#FFFFFF"/>
    </svg>
  )
}

// ── Design visuel par tier (couleurs, dégradés) — indépendant du contenu DB ──
const TIER_DESIGN = {
  gratuit: {
    featured:     false,
    cardBg:       '#FFFFFF',
    overlay:      'radial-gradient(ellipse 120% 58% at 50% -5%, rgba(219,234,254,0.98) 0%, rgba(191,219,254,0.55) 40%, transparent 72%)',
    border:       'rgba(0,0,0,0.07)',
    shadow:       '0 2px 20px rgba(0,0,0,0.055)',
    iconGrad:     'linear-gradient(135deg,#60A5FA,#2563EB)',
    glow:         'rgba(59,130,246,0.18)',
    accent:       '#2563EB',
    accentSoft:   'rgba(37,99,235,0.09)',
    accentBorder: 'rgba(37,99,235,0.20)',
    nameColor:    '#0F172A',
    descColor:    '#64748B',
    priceColor:   '#0F172A',
    periodColor:  '#94A3B8',
    featColor:    '#475569',
    sepColor:     'rgba(0,0,0,0.06)',
    ctaStyle:     { background: 'rgba(0,0,0,0.04)', color: '#0F172A', border: '1px solid rgba(0,0,0,0.10)' },
  },
  pro: {
    featured:     true,
    badge:        'Le plus populaire',
    cardBg:       '#0D0C1A',
    overlay:      'radial-gradient(ellipse 130% 62% at 50% -5%, rgba(109,40,217,0.98) 0%, rgba(79,70,229,0.78) 30%, rgba(79,70,229,0.18) 58%, transparent 76%)',
    border:       'rgba(129,140,248,0.28)',
    shadow:       '0 0 0 1px rgba(99,102,241,.18), 0 24px 80px rgba(99,102,241,0.40), 0 0 120px rgba(99,102,241,0.22)',
    iconGrad:     'linear-gradient(135deg,#A5B4FC,#6366F1,#4F46E5)',
    glow:         'rgba(99,102,241,0.45)',
    accent:       '#A5B4FC',
    accentSoft:   'rgba(165,180,252,0.15)',
    accentBorder: 'rgba(165,180,252,0.30)',
    nameColor:    '#FFFFFF',
    descColor:    'rgba(255,255,255,0.48)',
    priceColor:   '#FFFFFF',
    periodColor:  'rgba(255,255,255,0.28)',
    featColor:    'rgba(255,255,255,0.58)',
    sepColor:     'rgba(255,255,255,0.07)',
    ctaStyle:     { background: 'linear-gradient(135deg,#6366F1,#4F46E5)', color: '#fff', boxShadow: '0 6px 24px rgba(99,102,241,.5)' },
  },
  agence: {
    featured:     false,
    cardBg:       '#FFFFFF',
    overlay:      'radial-gradient(ellipse 120% 52% at 50% -5%, rgba(178,145,70,0.45) 0%, rgba(178,145,70,0.22) 42%, transparent 68%)',
    border:       'rgba(178,145,70,0.22)',
    shadow:       '0 2px 20px rgba(178,145,70,0.12)',
    iconGrad:     'linear-gradient(135deg,#E5C880,#b29146,#8A6F30)',
    glow:         'rgba(178,145,70,0.25)',
    accent:       '#b29146',
    accentSoft:   'rgba(178,145,70,0.10)',
    accentBorder: 'rgba(178,145,70,0.30)',
    nameColor:    '#0F172A',
    descColor:    '#64748B',
    priceColor:   '#0F172A',
    periodColor:  '#94A3B8',
    featColor:    '#475569',
    sepColor:     'rgba(0,0,0,0.06)',
    ctaStyle:     { background: 'rgba(0,0,0,0.04)', color: '#0F172A', border: '1px solid rgba(0,0,0,0.10)' },
  },
} as const

// ── Type des plans passés depuis le serveur ───────────────────────────────
export interface HomePlan {
  key:         'gratuit' | 'pro' | 'agence'
  name:        string
  desc:        string
  price:       string
  priceSuffix: string
  priceAnnuel: string | null
  cta:         string
  href:        string
  features:    string[]
  actif:       boolean
}

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1]

function PlanIcon({ tier }: { tier: 'gratuit' | 'pro' | 'agence' }) {
  const cls = 'w-5 h-5 text-white'
  const sw  = '1.7'
  if (tier === 'gratuit') return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={sw}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" />
    </svg>
  )
  if (tier === 'pro') return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={sw}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
    </svg>
  )
  return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={sw}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
    </svg>
  )
}

interface Props {
  totalAnnonceurs: number
  homePlans: HomePlan[]
}

export default function VendeurSection({ totalAnnonceurs, homePlans }: Props) {
  const count = totalAnnonceurs > 0 ? `${totalAnnonceurs.toLocaleString('fr-FR')}+` : '1 000+'

  return (
    <section className="relative overflow-hidden py-16 lg:py-24 px-4" style={{ background: '#F8FAFC' }}>

      <style>{`
        .vs-side {
          transition: transform .35s cubic-bezier(.22,1,.36,1),
                      box-shadow .35s cubic-bezier(.22,1,.36,1);
        }
        .vs-side:hover {
          transform: translateY(-7px);
          box-shadow: 0 16px 48px rgba(0,0,0,0.10) !important;
        }
        @media(prefers-reduced-motion:reduce){ .vs-side{ transition:none!important; } }
      `}</style>

      {/* ── Blobs décoratifs ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div style={{ position:'absolute', top:'-10%', left:'-5%', width:560, height:440,
          background:'radial-gradient(ellipse,rgba(79,70,229,.07) 0%,transparent 65%)', filter:'blur(64px)' }} />
        <div style={{ position:'absolute', bottom:'-8%', right:'-4%', width:460, height:380,
          background:'radial-gradient(ellipse,rgba(37,99,235,.06) 0%,transparent 65%)', filter:'blur(64px)' }} />
        <div style={{ position:'absolute', top:'30%', left:'50%', transform:'translateX(-50%)', width:700, height:300,
          background:'radial-gradient(ellipse,rgba(99,102,241,.04) 0%,transparent 65%)', filter:'blur(80px)' }} />
        {PINS.map((p, i) => (
          <div key={i} className="absolute" style={{ top: p.t, left: p.l, transform: 'translate(-50%, -100%)' }}>
            <MapPin size={p.s} color={p.c} opacity={p.o} rotation={p.r} />
          </div>
        ))}
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: .6, ease }}
          className="text-center mb-14">
          <p className="text-[11px] font-bold tracking-[.25em] uppercase text-[#4F46E5] mb-4">Pour les vendeurs</p>
          <h2 className="font-serif leading-tight"
            style={{ fontFamily:"'DM Serif Display',serif", fontSize:'clamp(2rem,4vw,3.5rem)', color:'#0F172A' }}>
            Publiez. Gérez. <em style={{ color:'#4F46E5' }}>Vendez.</em>
          </h2>
          <p className="text-slate-400 text-sm mt-3">
            {count} vendeurs actifs &middot; 0 € de commission &middot; 5 min pour publier
          </p>
        </motion.div>

        {/* ── Cartes de plans ── */}
        <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-4 lg:gap-3">
          {homePlans.map((plan, i) => {
            const d = TIER_DESIGN[plan.key]
            const f = d.featured

            return (
              <motion.div key={plan.key}
                className={`relative flex flex-col rounded-3xl overflow-hidden w-full ${
                  f ? 'lg:w-[340px]' : 'vs-side lg:w-[290px] lg:mt-8'
                }`}
                initial={{ opacity: 0, y: 36 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: .65, ease, delay: i * .1 }}
                style={{ background: d.cardBg, border: `1px solid ${d.border}`, boxShadow: d.shadow }}>

                {/* Gradient overlay */}
                <div className="absolute inset-0 pointer-events-none" aria-hidden style={{ background: d.overlay }} />

                {/* Shapes géométriques décoratives */}
                <div className="absolute top-3 right-4 pointer-events-none" aria-hidden>
                  <div className="relative w-[88px] h-[88px]">
                    <div className="absolute inset-0 border-2 rounded-xl rotate-[14deg]" style={{ borderColor:`${d.accent}1A` }} />
                    <div className="absolute inset-3 border rounded-lg rotate-[14deg]" style={{ borderColor:`${d.accent}14` }} />
                    <div className="absolute inset-6 border rounded-md rotate-[-6deg]" style={{ borderColor:`${d.accent}20` }} />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rotate-45 border" style={{ borderColor:`${d.accent}28` }} />
                  </div>
                </div>

                {/* Badge */}
                {'badge' in d && d.badge && (
                  <div className="absolute top-4 right-4 z-20">
                    <span className="text-[10px] font-bold tracking-wider uppercase px-3 py-1.5 rounded-full"
                      style={{ background:'rgba(255,255,255,.1)', color:'#fff', border:'1px solid rgba(255,255,255,.18)', backdropFilter:'blur(8px)' }}>
                      {d.badge}
                    </span>
                  </div>
                )}

                {/* Icône quart de rond */}
                <div className="absolute top-0 left-0 z-[15] pointer-events-none"
                  style={{ width: 58, height: 58, background: d.iconGrad, borderBottomRightRadius: '100%', boxShadow: `0 4px 16px ${d.glow}` }}>
                  <div className="absolute" style={{ top: 11, left: 11 }}>
                    <PlanIcon tier={plan.key} />
                  </div>
                </div>

                {/* Contenu */}
                <div className="relative z-10 flex flex-col flex-1 pt-16 px-6 pb-6">

                  {/* Nom + desc */}
                  <div className="mb-5">
                    <p className="font-bold text-2xl leading-tight" style={{ color: d.nameColor }}>{plan.name}</p>
                    <p className="text-[11px] leading-snug mt-0.5 max-w-[180px]" style={{ color: d.descColor }}>{plan.desc}</p>
                  </div>

                  <div className="flex-1" style={{ minHeight: f ? 28 : 20 }} />

                  {/* Prix */}
                  <div className="mb-5">
                    <div className="flex items-end gap-1.5">
                      <span className="font-serif leading-none"
                        style={{ fontFamily:"'DM Serif Display',serif", fontSize: f ? '3.8rem' : '3rem', color: d.priceColor }}>
                        {plan.price}€
                      </span>
                      <span className="text-sm mb-2" style={{ color: d.periodColor }}>{plan.priceSuffix}</span>
                    </div>
                    {plan.priceAnnuel && (
                      <p className="text-[11px] mt-0.5" style={{ color: d.periodColor }}>{plan.priceAnnuel}</p>
                    )}
                  </div>

                  {/* CTA */}
                  <Link href={plan.href}
                    className="block w-full text-center font-semibold text-sm py-3.5 rounded-2xl mb-5 transition-all duration-200 hover:-translate-y-0.5"
                    style={d.ctaStyle}>
                    {plan.cta}
                  </Link>

                  {/* Séparateur */}
                  <div className="mb-5" style={{ height: 1, background: d.sepColor }} />

                  {/* Features */}
                  <ul className="space-y-3">
                    {plan.features.map(feat => (
                      <li key={feat} className="flex items-center gap-3 text-xs" style={{ color: d.featColor }}>
                        <div className="w-[18px] h-[18px] rounded-full flex-shrink-0 flex items-center justify-center"
                          style={{ background: d.accentSoft, border:`1px solid ${d.accentBorder}` }}>
                          <svg className="w-2.5 h-2.5" viewBox="0 0 20 20" fill={d.accent}>
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                          </svg>
                        </div>
                        {feat}
                      </li>
                    ))}
                  </ul>

                </div>
              </motion.div>
            )
          })}
        </div>

        <p className="text-center text-xs text-slate-300 mt-10">
          Sans engagement &middot; R&eacute;siliable &agrave; tout moment &middot; Paiement s&eacute;curis&eacute;
        </p>

      </div>
    </section>
  )
}
