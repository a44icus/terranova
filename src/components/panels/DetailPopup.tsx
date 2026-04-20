'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useMapStore } from '@/store/mapStore'
import { formatPrix } from '@/lib/geo'
import type { BienPublic } from '@/lib/types'
import type { POICategory } from '@/lib/poi'

const DPE_COLORS: Record<string, string> = {
  A: '#2E7D32', B: '#558B2F', C: '#9E9D24',
  D: '#F9A825', E: '#EF6C00', F: '#D84315', G: '#B71C1C',
}

const CAT_ICON: Record<string, string> = {
  appartement: '🏛️', maison: '🌿', bureau: '🏢',
  terrain: '🌱', parking: '🅿️', local: '🏪',
}

interface Props {
  bien: BienPublic
  insightsHtml: string
  onClose: () => void
  onRoute: () => void
  poiCategories: POICategory[]
}

export default function DetailPopup({ bien, insightsHtml, onClose, onRoute }: Props) {
  const { favorites, toggleFavorite, compareSet, toggleCompare } = useMapStore()
  const isFav = favorites.has(bien.id)
  const isCmp = compareSet.has(bien.id)
  const prix = formatPrix(bien.prix, bien.type)
  const icon = CAT_ICON[bien.categorie] ?? '🏠'
  const [copied, setCopied] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      // Sur mobile → commence toujours replié ; sur desktop → toujours déplié
      if (mobile) setCollapsed(true)
      else setCollapsed(false)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Replie automatiquement quand on change de bien
  useEffect(() => {
    if (isMobile) setCollapsed(true)
  }, [bien.id, isMobile])

  function handleShare() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  /* ─────────────────────────────────────────────────────────────
     MOBILE REPLIÉ : mini strip horizontal
  ───────────────────────────────────────────────────────────── */
  if (isMobile && collapsed) {
    return (
      <>
        <style>{`
          @keyframes strip-in {
            from { transform: translateY(20px); opacity: 0; }
            to   { transform: translateY(0);    opacity: 1; }
          }
          .strip-in { animation: strip-in 0.22s ease; }
        `}</style>
        <div className="strip-in" style={{
          position: 'fixed',
          bottom: 72,            /* au-dessus du handle bottom sheet */
          left: 12, right: 12,
          zIndex: 190,
          background: 'white',
          borderRadius: 14,
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          border: '0.5px solid rgba(26,26,24,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 10px',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {/* Photo miniature */}
          <div style={{
            width: 44, height: 44, borderRadius: 8, flexShrink: 0,
            background: 'linear-gradient(135deg,#e0ddd8,#c8c4bc)',
            position: 'relative', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
          }}>
            {bien.photo_url
              ? <Image src={bien.photo_url} alt={bien.titre} fill style={{ objectFit: 'cover' }} sizes="44px" />
              : <span style={{ opacity: 0.4 }}>{icon}</span>
            }
          </div>

          {/* Prix + titre */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontFamily: "'DM Serif Display',serif", fontSize: 16, lineHeight: 1.1 }}>{prix}</span>
              <span style={{
                background: bien.type === 'vente' ? '#4F46E5' : '#0891B2',
                color: 'white', fontSize: 8, fontWeight: 700,
                padding: '1px 5px', borderRadius: 3,
              }}>
                {bien.type === 'vente' ? 'Vte' : 'Loc'}
              </span>
            </div>
            <div style={{
              fontSize: 11, fontWeight: 500, marginTop: 1,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              color: 'rgba(26,26,24,0.7)',
            }}>
              {bien.titre}
            </div>
          </div>

          {/* Bouton déplier */}
          <button
            onClick={() => setCollapsed(false)}
            title="Voir les détails"
            style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: 'rgba(79,70,229,0.08)', border: '1.5px solid rgba(79,70,229,0.22)',
              color: '#4F46E5', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {/* chevron up */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="18 15 12 9 6 15"/>
            </svg>
          </button>

          {/* Lien fiche */}
          <Link
            href={`/annonce/${bien.id}`}
            style={{
              flexShrink: 0, background: '#4F46E5', color: 'white',
              borderRadius: 8, padding: '0 12px',
              height: 32, display: 'flex', alignItems: 'center',
              fontSize: 12, fontWeight: 600, textDecoration: 'none', gap: 4,
            }}
          >
            Voir
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </Link>

          {/* Fermer */}
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              background: 'rgba(26,26,24,0.07)', border: 'none',
              cursor: 'pointer', fontSize: 11,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >✕</button>
        </div>
      </>
    )
  }

  /* ─────────────────────────────────────────────────────────────
     POPUP COMPLET (desktop ou mobile déplié)
  ───────────────────────────────────────────────────────────── */
  return (
    <>
      <style>{`
        @keyframes slide-up-desktop {
          from { transform: translateX(-50%) translateY(16px); opacity: 0; }
          to   { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
        @keyframes slide-up-mobile {
          from { transform: translateY(16px); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
        .popup-slide-desktop { animation: slide-up-desktop 0.25s ease; }
        .popup-slide-mobile  { animation: slide-up-mobile  0.25s ease; }
      `}</style>
      <div
        className={isMobile ? 'popup-slide-mobile' : 'popup-slide-desktop'}
        style={isMobile ? {
          /* ── Mobile déplié : fixed au-dessus du bottom sheet ── */
          position: 'fixed',
          bottom: 72,
          left: 12, right: 12,
          width: 'auto',
          maxHeight: '70vh',
          background: 'white', borderRadius: 16,
          boxShadow: '0 12px 48px rgba(0,0,0,0.22)',
          zIndex: 190,
          display: 'flex', flexDirection: 'column',
          border: '0.5px solid rgba(26,26,24,0.1)', overflow: 'hidden',
          fontFamily: "'DM Sans', sans-serif",
        } : {
          /* ── Desktop : centré entre sidebar et bord droit ── */
          position: 'absolute',
          bottom: 24, left: '50%', transform: 'translateX(-50%)',
          width: 'min(460px, calc(100vw - 380px - 32px))',
          maxHeight: 'calc(100vh - 130px)',
          background: 'white', borderRadius: 16,
          boxShadow: '0 12px 48px rgba(0,0,0,0.18)',
          zIndex: 20,
          display: 'flex', flexDirection: 'column',
          border: '0.5px solid rgba(26,26,24,0.1)', overflow: 'hidden',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* Handle replier — mobile uniquement */}
        {isMobile && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 12px 0',
            flexShrink: 0,
          }}>
            {/* Drag handle visuel */}
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(26,26,24,0.12)' }} />
            <button
              onClick={() => setCollapsed(true)}
              title="Réduire"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(26,26,24,0.4)', padding: '2px 4px',
                display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 11,
              }}
            >
              Réduire
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
          </div>
        )}

        {/* ── Layout principal ── */}
        <div style={{ display: 'flex', flexShrink: 0 }}>

          {/* Photo */}
          <div style={{
            width: isMobile ? 100 : 130,
            flexShrink: 0,
            minHeight: isMobile ? 120 : 140,
            background: 'linear-gradient(135deg,#e0ddd8,#c8c4bc)',
            position: 'relative', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36,
          }}>
            {bien.photo_url
              ? <Image src={bien.photo_url} alt={bien.titre} fill style={{ objectFit: 'cover' }} sizes="130px" />
              : <span style={{ opacity: 0.4 }}>{icon}</span>
            }
            {bien.approx && (
              <div style={{ position: 'absolute', bottom: 4, left: 4, background: 'rgba(255,248,235,0.93)', color: '#8a5e18', border: '1px solid rgba(200,140,50,0.4)', borderRadius: 4, padding: '1px 5px', fontSize: 9, fontWeight: 600 }}>
                ~ Approx.
              </div>
            )}
            {bien.vendeur_logo && !isMobile && (
              <div style={{ position: 'absolute', top: 6, left: 6, width: 28, height: 28, borderRadius: 6, background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.18)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 2 }}>
                <img src={bien.vendeur_logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
            )}
          </div>

          {/* Infos */}
          <div style={{ flex: 1, minWidth: 0, padding: isMobile ? '10px 10px 8px' : '14px 14px 12px', position: 'relative' }}>
            {!isMobile && (
              <button onClick={onClose} style={{ position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: '50%', background: 'rgba(26,26,24,0.07)', border: 'none', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            )}

            {/* Badges */}
            <div style={{ display: 'flex', gap: 4, marginBottom: isMobile ? 4 : 6, flexWrap: 'wrap' }}>
              <span style={{ background: bien.type === 'vente' ? '#4F46E5' : '#0891B2', color: 'white', fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 4 }}>
                {bien.type === 'vente' ? 'Vente' : 'Location'}
              </span>
              {bien.pro && !isMobile && (
                <span style={{ background: 'rgba(26,26,24,0.1)', color: 'rgba(26,26,24,0.7)', fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 4 }}>PRO</span>
              )}
            </div>

            {/* Prix */}
            <div className="font-serif" style={{ fontSize: isMobile ? 18 : 20, lineHeight: 1.1 }}>{prix}</div>

            {/* Titre */}
            <div style={{ fontSize: isMobile ? 12 : 13, fontWeight: 500, marginTop: 2, paddingRight: isMobile ? 0 : 26, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {bien.titre}
            </div>

            {/* Ville */}
            <div style={{ fontSize: 10, color: 'rgba(26,26,24,0.5)', marginTop: 2, marginBottom: isMobile ? 6 : 8 }}>
              📍 {bien.ville} {bien.code_postal}
            </div>

            {/* Caractéristiques */}
            <div style={{ display: 'flex', gap: 6, fontSize: 10, color: 'rgba(26,26,24,0.6)', marginBottom: isMobile ? 8 : 10, flexWrap: 'wrap' }}>
              {bien.surface && <span>{bien.surface} m²</span>}
              {(bien.pieces ?? 0) > 0 && <span>{bien.pieces} p.</span>}
              {!isMobile && (bien.sdb ?? 0) > 0 && <span>{bien.sdb} sdb</span>}
              {bien.dpe && (
                <span style={{ background: DPE_COLORS[bien.dpe], color: 'white', fontWeight: 700, padding: '1px 5px', borderRadius: 3, fontSize: 9 }}>
                  DPE {bien.dpe}
                </span>
              )}
            </div>

            {/* CTA + actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 5 : 6 }}>
              {/* Voir la fiche */}
              <Link href={`/annonce/${bien.id}`}
                style={{ background: '#4F46E5', color: 'white', borderRadius: 8, padding: isMobile ? '7px 0' : '9px 0', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, textDecoration: 'none', boxShadow: '0 2px 8px rgba(79,70,229,0.35)' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#4338CA')}
                onMouseLeave={e => (e.currentTarget.style.background = '#4F46E5')}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                Voir la fiche
              </Link>

              {/* Boutons secondaires */}
              <div style={{ display: 'flex', gap: isMobile ? 4 : 5 }}>
                {[
                  {
                    icon: isFav
                      ? <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                      : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
                    label: 'Favori', active: isFav, color: '#e05a5a',
                    bg: 'rgba(224,90,90,0.08)', border: 'rgba(224,90,90,0.22)', shadow: 'rgba(224,90,90,0.35)',
                    onClick: () => toggleFavorite(bien.id),
                  },
                  {
                    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="3" width="7" height="18" rx="1"/></svg>,
                    label: 'Comparer', active: isCmp, color: '#0891B2',
                    bg: 'rgba(8,145,178,0.08)', border: 'rgba(8,145,178,0.22)', shadow: 'rgba(8,145,178,0.35)',
                    onClick: () => toggleCompare(bien.id),
                  },
                  {
                    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M6 17V9a6 6 0 0 1 6-6"/><path d="M18 7v8a6 6 0 0 1-6 6"/></svg>,
                    label: 'Itinéraire', active: false, color: '#4F46E5',
                    bg: 'rgba(79,70,229,0.08)', border: 'rgba(79,70,229,0.22)', shadow: 'rgba(79,70,229,0.35)',
                    onClick: onRoute,
                  },
                  {
                    icon: copied
                      ? <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                      : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
                    label: copied ? 'Copié !' : 'Partager', active: copied, color: '#059669',
                    bg: 'rgba(5,150,105,0.08)', border: 'rgba(5,150,105,0.22)', shadow: 'rgba(5,150,105,0.35)',
                    onClick: handleShare,
                  },
                ].map((btn, i) => (
                  <button key={i} onClick={btn.onClick} style={{
                    flex: 1,
                    height: isMobile ? 32 : 40,
                    borderRadius: 8,
                    border: `1.5px solid ${btn.active ? btn.color : btn.border}`,
                    background: btn.active ? btn.color : btn.bg,
                    color: btn.active ? 'white' : btn.color,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: isMobile ? 'row' : 'column',
                    alignItems: 'center', justifyContent: 'center',
                    gap: isMobile ? 0 : 3,
                    transition: 'all 0.15s',
                    boxShadow: btn.active ? `0 3px 10px ${btn.shadow}` : 'none',
                    padding: '2px',
                  }}
                    onMouseEnter={e => { if (!btn.active) { e.currentTarget.style.background = btn.color; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = btn.color; e.currentTarget.style.boxShadow = `0 3px 10px ${btn.shadow}` } }}
                    onMouseLeave={e => { if (!btn.active) { e.currentTarget.style.background = btn.bg; e.currentTarget.style.color = btn.color; e.currentTarget.style.borderColor = btn.border; e.currentTarget.style.boxShadow = 'none' } }}
                    title={btn.label}
                  >
                    {btn.icon}
                    {!isMobile && (
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.01em', lineHeight: 1 }}>
                        {btn.label}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Score quartier — masqué sur mobile */}
        {insightsHtml && !isMobile && (
          <ScoreBar html={insightsHtml} />
        )}
      </div>
    </>
  )
}

function ScoreBar({ html }: { html: string }) {
  const scoreMatch = html.match(/font-size:22px[^>]*>(\d+)</)
  const colorMatch = html.match(/color:(#[0-9a-f]+)[\s\S]*?font-size:22px/)
  const labelMatch = html.match(/font-size:11px;font-weight:600;color:(#[^;]+);text-align:right[^>]*>([^<]+)</)
  const score = scoreMatch ? parseInt(scoreMatch[1]) : null
  const color = colorMatch ? colorMatch[1] : '#27ae60'
  const label = labelMatch ? labelMatch[2] : ''

  if (!score) return null

  return (
    <div style={{
      borderTop: '0.5px solid rgba(26,26,24,0.08)',
      padding: '10px 14px 12px',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 10, fontWeight: 500, color: 'rgba(26,26,24,0.4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>
          Score quartier
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} style={{ flex: 1, height: 5, borderRadius: 3, background: i < score ? color : 'rgba(26,26,24,0.1)' }} />
          ))}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div className="font-serif" style={{ fontSize: 20, color, lineHeight: 1 }}>
          {score}<span style={{ fontSize: 11, color: 'rgba(26,26,24,0.35)' }}>/10</span>
        </div>
        <div style={{ fontSize: 10, fontWeight: 600, color, marginTop: 2 }}>{label}</div>
      </div>
    </div>
  )
}
