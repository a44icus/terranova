'use client'

import { useRef } from 'react'
import type { MapAd } from '@/lib/mapAds'
import { isAdActive, isAdInViewport } from '@/lib/mapAds'
import type { Map as MapLibreMap } from 'maplibre-gl'

/** Échappe les caractères HTML pour éviter les injections XSS */
function esc(s: string | null | undefined): string {
  if (!s) return ''
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

async function trackEvent(ad_id: string, event_type: 'impression' | 'click') {
  try {
    await fetch('/api/ad-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ad_id, event_type }),
    })
  } catch {}
}

/** Clé localStorage pour le capping d'impressions (par pub, par jour) */
function cappingKey(ad_id: string): string {
  const today = new Date().toISOString().slice(0, 10)
  return `ad_cap_${ad_id}_${today}`
}

/** Retourne le nombre d'impressions vues aujourd'hui pour une pub */
function getLocalImpressions(ad_id: string): number {
  try {
    return parseInt(localStorage.getItem(cappingKey(ad_id)) ?? '0', 10)
  } catch { return 0 }
}

/** Incrémente le compteur local d'impressions */
function incrementLocalImpressions(ad_id: string): void {
  try {
    const key = cappingKey(ad_id)
    const current = parseInt(localStorage.getItem(key) ?? '0', 10)
    localStorage.setItem(key, String(current + 1))
  } catch {}
}

export function useMapAds(
  mapRef: React.RefObject<MapLibreMap | null>,
  maplibreRef: React.RefObject<any>,
  ads: MapAd[],
) {
  const adMarkersRef = useRef<any[]>([])
  const impressedRef = useRef<Set<string>>(new Set())  // évite de tracker 2× par session

  function clearAdMarkers() {
    adMarkersRef.current.forEach(m => m.remove())
    adMarkersRef.current = []
  }

  function renderAdMarkers() {
    const map = mapRef.current
    const maplibregl = maplibreRef.current
    if (!map || !maplibregl) return

    clearAdMarkers()

    const center = map.getCenter()

    // ── Récupère les bounds actuels de la carte pour le ciblage bbox ─────
    const rawBounds = map.getBounds()
    const mapBounds = rawBounds ? {
      north: rawBounds.getNorth(),
      south: rawBounds.getSouth(),
      east:  rawBounds.getEast(),
      west:  rawBounds.getWest(),
    } : undefined

    const activeAds = ads
      .filter(isAdActive)
      .filter(ad => ad.lat != null && ad.lng != null)
      .filter(ad => isAdInViewport(ad, center.lat, center.lng, mapBounds))
      // ── Capping client : masque la pub si le cap journalier est atteint ──
      .filter(ad => {
        if (!ad.impressions_max_par_jour) return true  // pas de cap
        return getLocalImpressions(ad.id) < ad.impressions_max_par_jour
      })

    activeAds.forEach(ad => {
      const color = esc(ad.couleur ?? '#F59E0B')
      const lat = ad.lat!
      const lng = ad.lng!

      // ── Impression tracking (1× par session par pub) ──────────────────────
      if (!impressedRef.current.has(ad.id)) {
        impressedRef.current.add(ad.id)
        incrementLocalImpressions(ad.id)
        trackEvent(ad.id, 'impression')
      }

      const el = document.createElement('div')
      el.style.cssText = 'display:inline-flex;flex-direction:column;align-items:center;cursor:pointer;'

      if (ad.format === 'pin') {
        el.innerHTML = `
          <div style="background:${color};color:white;padding:5px 11px 5px 9px;border-radius:20px;
            font-family:'DM Sans',sans-serif;font-size:12px;font-weight:600;white-space:nowrap;
            box-shadow:0 2px 12px rgba(0,0,0,0.25);border:2px solid white;
            display:flex;align-items:center;gap:6px;">
            ${ad.emoji ? `<span style="font-size:14px;">${esc(ad.emoji)}</span>` : ''}
            <span>${esc(ad.titre)}</span>
            <span style="font-size:9px;background:rgba(255,255,255,0.25);border-radius:4px;padding:1px 4px;letter-spacing:0.04em;">PUB</span>
          </div>
          <div style="width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:9px solid white;margin-top:-1px;"></div>`
      } else if (ad.format === 'banner') {
        el.innerHTML = `
          <div style="background:${color};color:white;border-radius:10px;padding:8px 14px;
            font-family:'DM Sans',sans-serif;box-shadow:0 4px 16px rgba(0,0,0,0.2);
            border:2px solid rgba(255,255,255,0.8);max-width:200px;">
            <div style="display:flex;align-items:center;gap:6px;">
              ${ad.emoji ? `<span style="font-size:18px;">${esc(ad.emoji)}</span>` : ''}
              <span style="font-size:13px;font-weight:700;">${esc(ad.titre)}</span>
              <span style="margin-left:auto;font-size:9px;background:rgba(0,0,0,0.2);border-radius:4px;padding:1px 5px;flex-shrink:0;">PUB</span>
            </div>
            ${ad.description ? `<div style="font-size:11px;opacity:0.85;line-height:1.4;margin-top:3px;">${esc(ad.description)}</div>` : ''}
          </div>
          <div style="width:0;height:0;border-left:9px solid transparent;border-right:9px solid transparent;border-top:10px solid rgba(255,255,255,0.8);margin:0 auto;margin-top:-1px;"></div>`
      } else if (ad.format === 'card') {
        el.innerHTML = `
          <div style="background:white;border-radius:12px;overflow:hidden;
            box-shadow:0 6px 24px rgba(0,0,0,0.18);border:2px solid ${color};width:180px;
            font-family:'DM Sans',sans-serif;">
            ${ad.image_url
              ? `<div style="position:relative;">
                   <img src="${esc(ad.image_url)}" alt="${esc(ad.titre)}" style="width:100%;height:90px;object-fit:cover;display:block;"/>
                   <span style="position:absolute;top:6px;right:6px;font-size:9px;font-weight:700;background:rgba(0,0,0,0.55);color:white;border-radius:4px;padding:2px 6px;">PUB</span>
                 </div>`
              : `<div style="height:48px;background:${color};display:flex;align-items:center;justify-content:center;font-size:24px;position:relative;">
                   ${esc(ad.emoji) || '📢'}
                   <span style="position:absolute;top:4px;right:6px;font-size:9px;font-weight:700;color:rgba(255,255,255,0.7);">PUB</span>
                 </div>`}
            <div style="padding:8px 10px 10px;">
              <div style="font-size:12px;font-weight:700;color:#0F172A;margin-bottom:2px;">${esc(ad.titre)}</div>
              ${ad.description ? `<div style="font-size:11px;color:rgba(15,23,42,0.55);line-height:1.4;">${esc(ad.description)}</div>` : ''}
              ${ad.lien_url ? `<div style="margin-top:6px;text-align:center;background:${color};color:white;border-radius:6px;padding:4px 8px;font-size:11px;font-weight:600;">En savoir plus →</div>` : ''}
            </div>
          </div>
          <div style="width:0;height:0;border-left:9px solid transparent;border-right:9px solid transparent;border-top:10px solid ${color};margin:0 auto;margin-top:-1px;"></div>`
      }

      // ── Popup au survol ───────────────────────────────────────────────────
      if (ad.description || ad.lien_url) {
        const popup = new maplibregl.Popup({ offset: [0, -8], closeButton: false, anchor: 'bottom' })
          .setHTML(`
            <div style="font-family:'DM Sans',sans-serif;padding:2px 0;min-width:140px;">
              <strong style="color:#0F172A;font-size:13px;">${esc(ad.titre)}</strong>
              ${ad.description ? `<p style="margin:4px 0 0;font-size:12px;color:rgba(15,23,42,0.55);line-height:1.4;">${esc(ad.description)}</p>` : ''}
              ${ad.lien_url ? `<a href="${esc(ad.lien_url)}" target="_blank" rel="noopener"
                style="display:inline-block;margin-top:6px;font-size:11px;color:${color};font-weight:600;text-decoration:none;">En savoir plus →</a>` : ''}
            </div>`)
        el.addEventListener('mouseenter', () => popup.setLngLat([lng, lat]).addTo(map as any))
        el.addEventListener('mouseleave', () => popup.remove())
      }

      // ── Clic → tracking + ouverture lien ─────────────────────────────────
      el.addEventListener('click', (e) => {
        e.stopPropagation()
        trackEvent(ad.id, 'click')
        if (ad.lien_url) window.open(ad.lien_url, '_blank', 'noopener')
      })

      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([lng, lat])
        .addTo(map)
      adMarkersRef.current.push(marker)
    })
  }

  // Pas de useEffect ici — tout est géré depuis MapCanvas pour éviter les conflits POI
  return { renderAdMarkers, clearAdMarkers }
}
