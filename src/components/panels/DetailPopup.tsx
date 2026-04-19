'use client'

import Image from 'next/image'
import Link from 'next/link'
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

  return (
    <>
      <style>{`
        @keyframes slide-up {
          from { transform: translateX(-50%) translateY(16px); opacity: 0; }
          to   { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
        .popup-slide { animation: slide-up 0.25s ease; }
      `}</style>
      <div className="popup-slide" style={{
        position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
        width: 'min(460px, calc(100vw - 380px - 32px))',
        maxHeight: 'calc(100vh - 130px)',
        background: 'white', borderRadius: 16,
        boxShadow: '0 12px 48px rgba(0,0,0,0.18)',
        zIndex: 20, display: 'flex', flexDirection: 'column',
        border: '0.5px solid rgba(26,26,24,0.1)', overflow: 'hidden',
      }}>
        {/* Haut : image + infos */}
        <div style={{ display: 'flex', flexShrink: 0 }}>
          {/* Image */}
          <div style={{
            width: 130, flexShrink: 0, minHeight: 140,
            background: 'linear-gradient(135deg,#e0ddd8,#c8c4bc)',
            position: 'relative', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40,
          }}>
            {bien.photo_url
              ? <Image src={bien.photo_url} alt={bien.titre} fill style={{ objectFit:'cover' }} sizes="130px" />
              : <span style={{ opacity: 0.4 }}>{icon}</span>
            }
            {bien.approx && (
              <div style={{ position:'absolute', bottom:6, left:6, background:'rgba(255,248,235,0.93)', color:'#8a5e18', border:'1px solid rgba(200,140,50,0.4)', borderRadius:4, padding:'2px 6px', fontSize:9, fontWeight:600 }}>
                ~ Approx.
              </div>
            )}
            {bien.vendeur_logo && (
              <div style={{ position:'absolute', top:6, left:6, width:28, height:28, borderRadius:6, background:'white', boxShadow:'0 1px 4px rgba(0,0,0,0.18)', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', padding:2, border:'1px solid rgba(255,255,255,0.6)' }}>
                <img src={bien.vendeur_logo} alt="" style={{ width:'100%', height:'100%', objectFit:'contain' }} />
              </div>
            )}
          </div>

          {/* Infos */}
          <div style={{ flex:1, minWidth:0, padding:'14px 14px 12px', position:'relative' }}>
            <button onClick={onClose} style={{ position:'absolute', top:10, right:10, width:24, height:24, borderRadius:'50%', background:'rgba(26,26,24,0.07)', border:'none', cursor:'pointer', fontSize:12, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>

            <div style={{ display:'flex', gap:4, marginBottom:6, flexWrap:'wrap' }}>
              <span style={{ background: bien.type==='vente'?'#4F46E5':'#0891B2', color:'white', fontSize:10, fontWeight:600, padding:'2px 7px', borderRadius:4 }}>
                {bien.type==='vente'?'Vente':'Location'}
              </span>
              {bien.pro && <span style={{ background:'rgba(26,26,24,0.1)', color:'rgba(26,26,24,0.7)', fontSize:10, fontWeight:600, padding:'2px 7px', borderRadius:4 }}>PRO</span>}
            </div>

            <div className="font-serif" style={{ fontSize:20, lineHeight:1.1 }}>{prix}</div>
            <div style={{ fontSize:13, fontWeight:500, marginTop:2, paddingRight:28, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{bien.titre}</div>
            <div style={{ fontSize:11, color:'rgba(26,26,24,0.5)', marginTop:2, marginBottom:8 }}>📍 {bien.ville} {bien.code_postal}</div>

            <div style={{ display:'flex', gap:8, fontSize:11, color:'rgba(26,26,24,0.6)', marginBottom:10, flexWrap:'wrap' }}>
              {bien.surface && <span>{bien.surface} m²</span>}
              {(bien.pieces??0)>0 && <span>{bien.pieces} pièces</span>}
              {(bien.sdb??0)>0 && <span>{bien.sdb} sdb</span>}
              {bien.dpe && <span style={{ background:DPE_COLORS[bien.dpe], color:'white', fontWeight:700, padding:'1px 6px', borderRadius:3, fontSize:10 }}>DPE {bien.dpe}</span>}
            </div>

            <div style={{ display:'flex', gap:6 }}>
              <Link href={`/annonce/${bien.id}`} style={{ flex:1, background:'#0F172A', color:'white', border:'none', borderRadius:7, padding:'7px 0', fontSize:12, fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', textDecoration:'none' }}
                onMouseEnter={e=>(e.currentTarget.style.background='#4F46E5')}
                onMouseLeave={e=>(e.currentTarget.style.background='#0F172A')}>
                Voir la fiche
              </Link>
              {[
                { label: isFav?'♥':'♡', active: isFav, color:'#e05a5a', onClick:()=>toggleFavorite(bien.id) },
                { label: '⚖', active: isCmp, color:'#0891B2', onClick:()=>toggleCompare(bien.id) },
                { label: '🗺', active: false, color:'#2980b9', onClick:onRoute },
              ].map((btn,i) => (
                <button key={i} onClick={btn.onClick} style={{
                  width:34, height:34, borderRadius:7,
                  border:`0.5px solid ${btn.active?btn.color:'rgba(26,26,24,0.15)'}`,
                  background: btn.active?btn.color:'none',
                  color: btn.active?'white':'rgba(26,26,24,0.4)',
                  cursor:'pointer', fontSize:14,
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>{btn.label}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Score quartier — barre uniquement, pas la liste POI */}
        {insightsHtml && (
          <ScoreBar html={insightsHtml} />
        )}
      </div>
    </>
  )
}

function ScoreBar({ html }: { html: string }) {
  // Extraire le score et la couleur depuis le HTML généré
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



