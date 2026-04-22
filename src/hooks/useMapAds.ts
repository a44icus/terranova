import { useEffect, useRef } from 'react'
import type { MapAd } from '@/lib/mapAds'
import { isAdActive } from '@/lib/mapAds'
import type { Map as MapLibreMap } from 'maplibre-gl'

/**
 * Charge les publicités et les affiche comme marqueurs sur la carte.
 * Retourne une fonction cleanup pour retirer les marqueurs.
 */
export function useMapAds(
  mapRef: React.RefObject<MapLibreMap | null>,
  maplibreRef: React.RefObject<any>,
  ads: MapAd[],
) {
  const adMarkersRef = useRef<any[]>([])

  function clearAdMarkers() {
    adMarkersRef.current.forEach(m => m.remove())
    adMarkersRef.current = []
  }

  function renderAdMarkers() {
    const map = mapRef.current
    const maplibregl = maplibreRef.current
    if (!map || !maplibregl) return

    clearAdMarkers()

    const activeAds = ads.filter(isAdActive)

    activeAds.forEach(ad => {
      const color = ad.couleur ?? '#F59E0B'

      // ── PIN FORMAT ─────────────────────────────────────────────────
      if (ad.format === 'pin') {
        const el = document.createElement('div')
        el.style.cssText = 'display:inline-flex;flex-direction:column;align-items:center;cursor:pointer;'
        el.innerHTML = `
          <div style="
            background:${color};
            color:white;
            padding:5px 11px 5px 9px;
            border-radius:20px;
            font-family:'DM Sans',sans-serif;
            font-size:12px;
            font-weight:600;
            white-space:nowrap;
            box-shadow:0 2px 12px rgba(0,0,0,0.25);
            border:2px solid white;
            display:flex;
            align-items:center;
            gap:6px;
            position:relative;
          ">
            ${ad.emoji ? `<span style="font-size:14px;">${ad.emoji}</span>` : ''}
            <span>${ad.titre}</span>
            <span style="
              font-size:9px;
              background:rgba(255,255,255,0.25);
              border-radius:4px;
              padding:1px 4px;
              letter-spacing:0.04em;
            ">PUB</span>
          </div>
          <div style="width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:9px solid white;margin-top:-1px;"></div>`

        _attachPopup(el, ad, map, maplibregl)

        const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([ad.lng, ad.lat])
          .addTo(map)
        adMarkersRef.current.push(marker)
      }

      // ── BANNER FORMAT ──────────────────────────────────────────────
      else if (ad.format === 'banner') {
        const el = document.createElement('div')
        el.style.cssText = 'cursor:pointer;'
        el.innerHTML = `
          <div style="
            background:${color};
            color:white;
            border-radius:10px;
            padding:8px 14px;
            font-family:'DM Sans',sans-serif;
            box-shadow:0 4px 16px rgba(0,0,0,0.2);
            border:2px solid rgba(255,255,255,0.8);
            max-width:200px;
            display:flex;
            flex-direction:column;
            gap:2px;
          ">
            <div style="display:flex;align-items:center;gap:6px;">
              ${ad.emoji ? `<span style="font-size:18px;">${ad.emoji}</span>` : ''}
              <span style="font-size:13px;font-weight:700;">${ad.titre}</span>
              <span style="
                margin-left:auto;
                font-size:9px;
                background:rgba(0,0,0,0.2);
                border-radius:4px;
                padding:1px 5px;
                letter-spacing:0.04em;
                flex-shrink:0;
              ">PUB</span>
            </div>
            ${ad.description ? `<div style="font-size:11px;opacity:0.85;line-height:1.4;">${ad.description}</div>` : ''}
          </div>
          <div style="
            width:0;height:0;
            border-left:9px solid transparent;
            border-right:9px solid transparent;
            border-top:10px solid rgba(255,255,255,0.8);
            margin:0 auto;margin-top:-1px;
          "></div>`

        _attachPopup(el, ad, map, maplibregl)

        const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([ad.lng, ad.lat])
          .addTo(map)
        adMarkersRef.current.push(marker)
      }

      // ── CARD FORMAT ────────────────────────────────────────────────
      else if (ad.format === 'card') {
        const el = document.createElement('div')
        el.style.cssText = 'cursor:pointer;'
        el.innerHTML = `
          <div style="
            background:white;
            border-radius:12px;
            overflow:hidden;
            box-shadow:0 6px 24px rgba(0,0,0,0.18);
            border:2px solid ${color};
            width:180px;
            font-family:'DM Sans',sans-serif;
          ">
            ${ad.image_url ? `
              <div style="position:relative;">
                <img src="${ad.image_url}" alt="${ad.titre}"
                  style="width:100%;height:90px;object-fit:cover;display:block;" />
                <span style="
                  position:absolute;top:6px;right:6px;
                  font-size:9px;font-weight:700;
                  background:rgba(0,0,0,0.55);color:white;
                  border-radius:4px;padding:2px 6px;letter-spacing:0.05em;
                ">PUB</span>
              </div>` : `
              <div style="
                height:48px;background:${color};
                display:flex;align-items:center;justify-content:center;
                font-size:24px;position:relative;
              ">
                ${ad.emoji ?? '📢'}
                <span style="
                  position:absolute;top:4px;right:6px;
                  font-size:9px;font-weight:700;color:rgba(255,255,255,0.7);
                ">PUB</span>
              </div>`}
            <div style="padding:8px 10px 10px;">
              <div style="font-size:12px;font-weight:700;color:#0F172A;margin-bottom:2px;">${ad.titre}</div>
              ${ad.description ? `<div style="font-size:11px;color:rgba(15,23,42,0.55);line-height:1.4;">${ad.description}</div>` : ''}
              ${ad.lien_url ? `
                <div style="
                  margin-top:6px;text-align:center;
                  background:${color};color:white;
                  border-radius:6px;padding:4px 8px;
                  font-size:11px;font-weight:600;
                ">En savoir plus →</div>` : ''}
            </div>
          </div>
          <div style="
            width:0;height:0;
            border-left:9px solid transparent;
            border-right:9px solid transparent;
            border-top:10px solid ${color};
            margin:0 auto;margin-top:-1px;
          "></div>`

        if (ad.lien_url) {
          el.addEventListener('click', (e) => {
            e.stopPropagation()
            window.open(ad.lien_url, '_blank', 'noopener')
          })
        }

        const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([ad.lng, ad.lat])
          .addTo(map)
        adMarkersRef.current.push(marker)
      }
    })
  }

  // Pas de listener zoom ici — géré dans MapCanvas pour éviter les conflits
  useEffect(() => {
    const map = mapRef.current
    if (!map?.loaded()) return
    // Le zoom est vérifié depuis MapCanvas avant d'appeler renderAdMarkers
  }, [ads])

  return { renderAdMarkers, clearAdMarkers }
}

// ── Helper : attache un popup au survol ──────────────────────────────────────
function _attachPopup(
  el: HTMLElement,
  ad: MapAd,
  map: MapLibreMap,
  maplibregl: any,
) {
  if (!ad.description && !ad.lien_url) return

  const popup = new maplibregl.Popup({
    offset: [0, -8],
    closeButton: false,
    anchor: 'bottom',
  }).setHTML(`
    <div style="font-family:'DM Sans',sans-serif;padding:2px 0;min-width:140px;">
      <strong style="color:#0F172A;font-size:13px;">${ad.titre}</strong>
      ${ad.description ? `<p style="margin:4px 0 0;font-size:12px;color:rgba(15,23,42,0.55);line-height:1.4;">${ad.description}</p>` : ''}
      ${ad.lien_url ? `<a href="${ad.lien_url}" target="_blank" rel="noopener"
          style="display:inline-block;margin-top:6px;font-size:11px;color:${ad.couleur ?? '#F59E0B'};font-weight:600;text-decoration:none;">
          En savoir plus →
        </a>` : ''}
    </div>`)

  el.addEventListener('mouseenter', () => {
    popup.setLngLat([ad.lng, ad.lat]).addTo(map as any)
  })
  el.addEventListener('mouseleave', () => popup.remove())
  el.addEventListener('click', (e) => {
    e.stopPropagation()
    if (ad.lien_url) window.open(ad.lien_url, '_blank', 'noopener')
  })
}
