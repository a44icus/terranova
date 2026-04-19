'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { useMapStore } from '@/store/mapStore'
import { useBiensFiltres } from '@/hooks/useBiens'
import { usePOI } from '@/hooks/usePOI'
import { useGeolocation } from '@/hooks/useGeolocation'
import { formatPrixCourt, metersToLngDeg, metersToLatDeg, makeCircle } from '@/lib/geo'
import { MAP_STYLES, type MapStyleKey } from '@/lib/mapStyles'
import { POI_CATEGORIES, computeNeighborhoodScore } from '@/lib/poi'
import type { Map as MapLibreMap, Marker } from 'maplibre-gl'
import type { BienPublic } from '@/lib/types'
import DetailPopup from '@/components/panels/DetailPopup'
import RoutePanel from '@/components/panels/RoutePanel'
import NearbyPanel from '@/components/panels/NearbyPanel'
import SearchBar from './SearchBar'
import LassoCanvas from './LassoCanvas'

let mapInstance: MapLibreMap | null = null
export function getMap() { return mapInstance }

const CAT_ICON: Record<string, string> = {
  appartement: '🏢', maison: '🏠', bureau: '🏗️',
  terrain: '🌱', parking: '🅿️', local: '🏪',
}

export default function MapCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const markersRef = useRef<Map<string, Marker>>(new Map())
  const clusterMarkersRef = useRef<Marker[]>([])
  const poiMarkersRef = useRef<Marker[]>([])
  const geoMarkerRef = useRef<Marker | null>(null)
  const routeDestMarkerRef = useRef<Marker | null>(null)
  const tetherSvgRef = useRef<SVGSVGElement | null>(null)
  const poiCleanupRef = useRef<(() => void)[]>([])
  const approxLayersRef = useRef<string[]>([])
  const styleRef = useRef<MapStyleKey>('street')
  const is3DRef = useRef(false)
  const auto3DRef = useRef(false)      // 3D déclenché automatiquement par le zoom
  const progAnimRef = useRef(false)    // animation programmatique en cours
  const buildingsRef = useRef(false)
  const routePickingRef = useRef(false)
  const routeOriginRef = useRef<{lng: number; lat: number} | null>(null)

  const {
    activeBienId, setActiveBienId,
    sidebarOpen, toggleSidebar,
    geoPosition, setGeoPosition,
    nearbyRadius, showToast,
  } = useMapStore()

  const biens = useBiensFiltres()
  const { loadPOI, abort: abortPOI } = usePOI()
  const { start: startGeo, stop: stopGeo } = useGeolocation()

  const [zoom, setZoom] = useState('—')
  const [mapStyle, setMapStyleState] = useState<MapStyleKey>('street')
  const [routeActive, setRouteActive] = useState(false)
  const [routePickingDest, setRoutePickingDest] = useState(false)
  const [geoActive, setGeoActive] = useState(false)
  const [poiData, setPoiData] = useState<{pois: any[], best: Record<string, any>} | null>(null)
  const [activeBien, setActiveBien] = useState<BienPublic | null>(null)
  const [insightsHtml, setInsightsHtml] = useState('')

  const maplibreRef = useRef<any>(null)

  const updateMarkersRef = useRef<() => void>(() => {})

  // ── INIT MAP ──────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    import('maplibre-gl').then(({ default: maplibregl }) => {
      maplibreRef.current = maplibregl
      const map = new maplibregl.Map({
        container: containerRef.current!,
        style: MAP_STYLES.street as any,
        center: [2.3522, 48.8566],
        zoom: 11,
        maxZoom: 19,
      })
      mapRef.current = map
      mapInstance = map
      map.on('load', () => {
        updateMarkersRef.current()
        // Si un bien était déjà actif (venant de l'URL), on centre la carte
        const activeId = useMapStore.getState().activeBienId
        if (activeId) {
          const target = useMapStore.getState().biens.find((b: any) => b.id === activeId)
          if (target) flyTo3D([target.lng, target.lat], 17.5)
        }
      })
      map.on('moveend', () => updateMarkersRef.current())

      const AUTO_3D_ZOOM = 15
      map.on('zoom', () => {
        const z = map.getZoom()
        setZoom(z.toFixed(1))

        // Scroll manuel uniquement — les flyTo gèrent leur propre pitch
        if (!is3DRef.current && !progAnimRef.current) {
          if (z >= AUTO_3D_ZOOM && !auto3DRef.current) {
            auto3DRef.current = true
            map.easeTo({ pitch: 50, bearing: -15, duration: 500 })
          } else if (z < AUTO_3D_ZOOM && auto3DRef.current) {
            auto3DRef.current = false
            map.easeTo({ pitch: 0, bearing: 0, duration: 400 })
          }
        }
      })
      map.on('click', (e: any) => {
        if (routePickingRef.current && routeOriginRef.current) {
          routePickingRef.current = false
          setRoutePickingDest(false)
          const { lng, lat } = e.lngLat
          placeRouteDestMarker(lng, lat)
          e.originalEvent?.stopPropagation()
          return
        }
        setActiveBienId(null)
      })
    })
    return () => {
      mapRef.current?.remove()
      mapRef.current = null
      mapInstance = null
    }
  }, [])

  // ── HELPER FLYTO AVEC AUTO-3D ─────────────────────────────
  function flyTo3D(center: [number, number], zoom: number, speed = 1.2) {
    const map = mapRef.current
    if (!map) return
    const use3D = !is3DRef.current && zoom >= 15
    if (use3D) auto3DRef.current = true
    progAnimRef.current = true

    if (use3D) {
      // flyTo avec duration (et non speed) pour éviter le conflit _onEaseFrame
      // — anime center, zoom (avec courbe), pitch et bearing en un seul mouvement
      map.flyTo({ center, zoom, pitch: 50, bearing: -15, duration: 2400 })
    } else {
      map.flyTo({ center, zoom, speed })
    }

    map.once('moveend', () => { progAnimRef.current = false })
  }

  // ── MISE À JOUR MARKERS ───────────────────────────────────
  useEffect(() => {
    if (mapRef.current?.loaded()) updateMarkers()
  }, [biens, activeBienId])

  // ── BIEN ACTIF → POI + POPUP + FLYTO ────────────────────────
  useEffect(() => {
    const bien = biens.find(b => b.id === activeBienId) ?? null
    setActiveBien(bien)
    clearPOI()
    clearApproxZones()

    if (bien) {
      // Centrer la carte sur le bien
      flyTo3D([bien.lng, bien.lat], 17.5)

      if (bien.approx) addApproxZone(bien)
      loadPOI(bien.id, bien.lat, bien.lng).then(result => {
        if (!result) { console.warn('[POI] Pas de résultat'); return }
        setPoiData(result)
        renderPOIMarkers(result.pois, bien.lng, bien.lat)
        renderInsights(result.best)
      })
    } else {
      setPoiData(null)
      setInsightsHtml('')
    }
  }, [activeBienId])

  // ── GEO POSITION → MARKER + CERCLES ──────────────────────
  useEffect(() => {
    if (!geoPosition) {
      geoMarkerRef.current?.remove()
      geoMarkerRef.current = null
      removeGeoCircles()
      return
    }
    placeGeoMarker(geoPosition)
    drawGeoCircles(geoPosition)
  }, [geoPosition, nearbyRadius])

  const updateMarkers = useCallback(async () => {
    const map = mapRef.current
    if (!map) return
    const maplibregl = maplibreRef.current
    if (!maplibregl) return
    const Supercluster = (await import('supercluster')).default

    markersRef.current.forEach(m => m.remove())
    markersRef.current.clear()
    clusterMarkersRef.current.forEach(m => m.remove())
    clusterMarkersRef.current = []

    const sc = new Supercluster({ radius: 60, maxZoom: 14 })
    sc.load(biens.map(b => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [b.lng, b.lat] },
      properties: { id: b.id },
    })))

    const zoom = Math.floor(map.getZoom())
    const bounds = map.getBounds()
    const bbox: [number, number, number, number] = [
      bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()
    ]
    const clusters = sc.getClusters(bbox, zoom)

    clusters.forEach((feature: any) => {
      const [lng, lat] = feature.geometry.coordinates
      if (feature.properties.cluster) {
        const count = feature.properties.point_count
        const el = document.createElement('div')
        el.style.cssText = 'display:inline-flex;flex-direction:column;align-items:center;cursor:pointer;'
        el.innerHTML = `
          <div style="width:42px;height:42px;border-radius:50%;background:#0F172A;color:white;display:flex;align-items:center;justify-content:center;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:700;box-shadow:0 2px 12px rgba(0,0,0,0.3);border:2.5px solid white;">${count}</div>
          <div style="width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:9px solid white;margin-top:-1px;"></div>`
        el.addEventListener('click', (e) => {
          e.stopPropagation()
          const z = Math.min(sc.getClusterExpansionZoom(feature.properties.cluster_id), 20)
          flyTo3D([lng, lat], z, 1.4)
        })
        const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat([lng, lat]).addTo(map)
        clusterMarkersRef.current.push(marker)
      } else {
        const b = biens.find(x => x.id === feature.properties.id)
        if (!b) return
        const isActive = b.id === activeBienId
        const color = b.type === 'vente' ? '#4F46E5' : '#0891B2'
        const bg = isActive ? '#0F172A' : color
        const label = formatPrixCourt(b.prix, b.type)
        const el = document.createElement('div')
        el.style.cssText = 'display:inline-flex;flex-direction:column;align-items:center;cursor:pointer;'

        if (b.approx) {
          el.innerHTML = `
            <div style="position:relative;display:flex;flex-direction:column;align-items:center;">
              <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-60%);width:52px;height:52px;border-radius:50%;background:rgba(79,70,229,0.18);animation:approxPulse 2s ease-in-out infinite;pointer-events:none;"></div>
              <div style="background:${bg};color:white;padding:5px 11px 5px 9px;border-radius:20px;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:500;white-space:nowrap;cursor:pointer;box-shadow:0 2px 12px rgba(0,0,0,0.25);border:2px dashed rgba(255,255,255,0.8);transform:${isActive ? 'scale(1.12)' : 'scale(1)'};transition:all 0.2s;display:flex;align-items:center;gap:5px;position:relative;">
                <span style="font-size:14px;">${CAT_ICON[b.categorie] ?? '🏠'}</span>
                <span>${label}</span>
                <span style="font-size:9px;opacity:0.75;">~</span>
              </div>
              <div style="width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:9px solid rgba(255,255,255,0.8);margin-top:-1px;"></div>
            </div>`
        } else {
          el.innerHTML = `
            <div style="background:${bg};color:white;padding:5px 11px 5px 9px;border-radius:20px;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:500;white-space:nowrap;box-shadow:0 2px 12px rgba(0,0,0,0.25);border:2px solid white;transform:${isActive ? 'scale(1.12)' : 'scale(1)'};transition:all 0.2s;display:flex;align-items:center;gap:5px;">
              <span style="font-size:14px;">${CAT_ICON[b.categorie] ?? '🏠'}</span>
              <span>${label}</span>
            </div>
            <div style="width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:9px solid white;margin-top:-1px;"></div>`
        }
        el.addEventListener('click', (e) => {
          e.stopPropagation()
          const newId = b.id === activeBienId ? null : b.id
          setActiveBienId(newId)
        })
        const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat([b.lng, b.lat]).addTo(map)
        markersRef.current.set(b.id, marker)
      }
    })
  }, [biens, activeBienId, setActiveBienId])

  // Toujours garder la ref à jour pour moveend
  updateMarkersRef.current = updateMarkers

  // ── ZONES APPROXIMATIVES ──────────────────────────────────
  function addApproxZone(bien: BienPublic) {
    const map = mapRef.current
    if (!map) return
    const r = bien.approx_radius ?? 300
    const coords = makeCircle(bien.lat, bien.lng, r)
    const rings = [
      { scale: 0.28, opacity: 0.30 },
      { scale: 0.60, opacity: 0.16 },
      { scale: 1.00, opacity: 0.07 },
    ]
    rings.forEach((ring, i) => {
      const rCoords = makeCircle(bien.lat, bien.lng, r * ring.scale)
      const srcId = `approx-${bien.id}-${i}`
      const layId = `approx-layer-${bien.id}-${i}`
      if (!map.getSource(srcId)) {
        map.addSource(srcId, { type: 'geojson', data: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [rCoords] }, properties: {} } })
        map.addLayer({ id: layId, type: 'fill', source: srcId, paint: { 'fill-color': '#4F46E5', 'fill-opacity': ring.opacity } })
        approxLayersRef.current.push(srcId, layId)
      }
    })
    // Contour
    const strokeSrc = `approx-stroke-${bien.id}`
    const strokeLay = `approx-stroke-layer-${bien.id}`
    if (!map.getSource(strokeSrc)) {
      map.addSource(strokeSrc, { type: 'geojson', data: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [coords] }, properties: {} } })
      map.addLayer({ id: strokeLay, type: 'line', source: strokeSrc, paint: { 'line-color': '#4F46E5', 'line-width': 1.5, 'line-opacity': 0.4, 'line-dasharray': [4, 3] } })
      approxLayersRef.current.push(strokeSrc, strokeLay)
    }
  }

  function clearApproxZones() {
    const map = mapRef.current
    if (!map) return
    // Supprimer les layers EN PREMIER, puis les sources
    approxLayersRef.current.forEach(id => {
      try { if (map.getLayer(id)) map.removeLayer(id) } catch {}
    })
    approxLayersRef.current.forEach(id => {
      try { if (map.getSource(id)) map.removeSource(id) } catch {}
    })
    approxLayersRef.current = []
  }

  // ── POI MARKERS ───────────────────────────────────────────
  function ensureTetherSvg(): SVGSVGElement {
    if (tetherSvgRef.current) return tetherSvgRef.current
    const mc = containerRef.current!
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:2;'
    mc.appendChild(svg)
    tetherSvgRef.current = svg
    return svg
  }

  function clearTetherSvg() {
    tetherSvgRef.current?.remove()
    tetherSvgRef.current = null
  }


  function clearPOI() {
    poiCleanupRef.current.forEach(fn => fn())
    poiCleanupRef.current = []
    poiMarkersRef.current.forEach(m => m.remove())
    poiMarkersRef.current = []
    clearTetherSvg()
    // Ne PAS appeler abortPOI() ici — loadPOI gère lui-même l'annulation
  }

  function renderPOIMarkers(pois: any[], bienLng: number, bienLat: number) {
    const map = mapRef.current
    if (!map || pois.length === 0) return
    const maplibregl = maplibreRef.current
    if (!maplibregl) return

    let delay = 0

    pois.forEach((p) => {
      const catDef = POI_CATEGORIES.find(c => c.key === p.categoryKey)
      const color = catDef?.color ?? '#888'
      const dist = Math.round(p.distance)
      const curDelay = delay
      delay += 60

      /*
       * Structure standard MapLibre :
       * el = l'élément visuellement visible, ancré anchor:'bottom'
       *   → son bord inférieur (le stem) est exactement sur [p.lon, p.lat]
       *   → flex-column : icône + badge + stem dot
       *   → transform-origin:bottom center → scale part du point géo
       * Pas de wrapper 0×0, pas d'absolute interne, pas de translateX.
       */
      const el = document.createElement('div')
      el.style.cssText = `
        display:flex;flex-direction:column;align-items:center;gap:3px;
        cursor:pointer;
        transform-origin:bottom center;
        filter:drop-shadow(0 2px 6px rgba(0,0,0,0.20));
      `

      // Icône ronde
      const iconEl = document.createElement('div')
      iconEl.style.cssText = `
        width:36px;height:36px;border-radius:50%;
        background:white;border:2.5px solid ${color};
        display:flex;align-items:center;justify-content:center;
        font-size:17px;line-height:1;flex-shrink:0;
      `
      iconEl.textContent = p.emoji

      // Badge distance + catégorie
      const badgeEl = document.createElement('div')
      badgeEl.style.cssText = `
        background:white;border-radius:7px;padding:2px 7px;
        border:1px solid rgba(0,0,0,0.07);
        display:flex;flex-direction:column;align-items:center;
        white-space:nowrap;text-align:center;flex-shrink:0;
      `
      badgeEl.innerHTML = `
        <span style="font-family:'DM Sans',sans-serif;font-size:11px;font-weight:700;color:${color};">${dist >= 1000 ? (dist/1000).toFixed(1)+'km' : dist+'m'}</span>
        <span style="font-family:'DM Sans',sans-serif;font-size:9px;color:rgba(15,23,42,0.45);">${catDef?.label ?? ''}</span>
      `

      // Stem (petit trait + dot qui touche exactement le sol)
      const stemEl = document.createElement('div')
      stemEl.style.cssText = `
        display:flex;flex-direction:column;align-items:center;gap:0;flex-shrink:0;
      `
      const stemLine = document.createElement('div')
      stemLine.style.cssText = `width:2px;height:8px;background:${color};border-radius:1px;`
      const stemDot = document.createElement('div')
      stemDot.style.cssText = `
        width:7px;height:7px;border-radius:50%;
        background:${color};border:1.5px solid white;
      `
      stemEl.appendChild(stemLine)
      stemEl.appendChild(stemDot)

      el.appendChild(iconEl)
      el.appendChild(badgeEl)
      el.appendChild(stemEl)

      // Animation d'entrée — uniquement translateY + opacity, jamais translateX
      el.style.opacity = '0'
      el.style.transform = 'translateY(8px) scale(0.88)'
      setTimeout(() => {
        el.style.transition = `opacity 0.35s ease, transform 0.35s cubic-bezier(.34,1.45,.64,1)`
        el.style.opacity = '1'
        el.style.transform = 'translateY(0) scale(1)'
        // Nettoyer la transition après animation pour que hover/snap soient réactifs
        setTimeout(() => { el.style.transition = '' }, 400)
      }, curDelay)

      // Marker MapLibre standard : anchor bottom = stem dot sur le point géo
      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([p.lon, p.lat])
        .addTo(map)

      // Popup au survol — pas de transform, juste l'info
      const CARD_H = 36 + 3 + 34 + 3 + 15  // icon+gap+badge+gap+stem ≈ 91px
      const popup = new maplibregl.Popup({
        offset: [0, -CARD_H],
        closeButton: false,
        anchor: 'bottom',
      }).setHTML(`
        <div style="font-family:'DM Sans',sans-serif;font-size:12px;padding:2px 0;">
          <strong style="color:#0F172A;">${p.name || catDef?.label}</strong><br>
          <span style="color:rgba(15,23,42,0.5);">${p.subtype ?? catDef?.label ?? ''} · ${dist >= 1000 ? (dist/1000).toFixed(1)+' km' : dist+' m'}</span>
        </div>`)

      el.addEventListener('mouseenter', () => {
        popup.setLngLat([p.lon, p.lat]).addTo(map)
        popup.getElement()?.style.setProperty('z-index', '9999')
      })
      el.addEventListener('mouseleave', () => { popup.remove() })
      el.addEventListener('click', (e) => { e.stopPropagation() })

      poiMarkersRef.current.push(marker)
      poiCleanupRef.current.push(() => { popup.remove() })
    })
  }

  // ── INSIGHTS ──────────────────────────────────────────────
  function renderInsights(bestByCategory: Record<string, any>) {
    const score = computeNeighborhoodScore(bestByCategory)
    const label = score >= 8 ? { text: 'Excellent', color: '#27ae60' }
      : score >= 6 ? { text: 'Très bon', color: '#2980b9' }
      : score >= 4 ? { text: 'Correct', color: '#f39c12' }
      : { text: 'Moyen', color: '#e74c3c' }

    const bars = Array.from({ length: 10 }, (_, i) =>
      `<div style="flex:1;height:6px;border-radius:3px;background:${i < score ? label.color : 'rgba(15,23,42,0.1)'}"></div>`
    ).join('')

    const poiList = Object.values(bestByCategory)
      .sort((a, b) => a.distance - b.distance)
      .map(p => {
        const catDef = POI_CATEGORIES.find(c => c.key === p.categoryKey)
        const dist = p.distance < 1000 ? `${Math.round(p.distance)} m` : `${(p.distance / 1000).toFixed(1)} km`
        return `<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:0.5px solid rgba(15,23,42,0.07);">
          <span style="font-size:16px;">${catDef?.emoji ?? '📍'}</span>
          <span style="flex:1;min-width:0;">
            <span style="display:block;font-size:12px;color:#0F172A;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p.name}</span>
            ${p.subtype ? `<span style="display:block;font-size:10px;color:rgba(15,23,42,0.45);">${p.subtype}</span>` : ''}
          </span>
          <span style="font-size:11px;font-weight:600;color:${label.color};flex-shrink:0;">${dist}</span>
        </div>`
      }).join('')

    setInsightsHtml(`
      <div style="background:white;border-radius:12px;padding:14px;margin-bottom:14px;border:0.5px solid rgba(15,23,42,0.1);">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
          <span style="font-size:12px;font-weight:500;color:rgba(15,23,42,0.5);text-transform:uppercase;letter-spacing:0.07em;">Score quartier</span>
          <span style="font-family:'DM Serif Display',serif;font-size:22px;color:${label.color};">${score}<span style="font-size:13px;color:rgba(15,23,42,0.35);font-family:'DM Sans',sans-serif;">/10</span></span>
        </div>
        <div style="display:flex;gap:3px;margin-bottom:6px;">${bars}</div>
        <div style="font-size:11px;font-weight:600;color:${label.color};text-align:right;">${label.text}</div>
        ${poiList ? `<div style="margin-top:10px;">${poiList}</div>` : ''}
      </div>`)
  }

  // ── GÉOLOCALISATION ───────────────────────────────────────
  function placeGeoMarker(pos: { lat: number; lng: number; acc: number }) {
    const map = mapRef.current
    if (!map) return
    const maplibregl = maplibreRef.current
    if (!maplibregl) return
    const el = document.createElement('div')
    el.innerHTML = `
      <div style="position:relative;width:20px;height:20px;">
        <div style="position:absolute;top:50%;left:50%;width:36px;height:36px;background:rgba(41,128,185,0.22);border-radius:50%;animation:geoRipple 2s ease-out infinite;transform:translate(-50%,-50%);"></div>
        <div style="position:absolute;top:50%;left:50%;width:36px;height:36px;background:rgba(41,128,185,0.22);border-radius:50%;animation:geoRipple 2s ease-out 1s infinite;transform:translate(-50%,-50%);"></div>
        <div style="position:absolute;top:50%;left:50%;width:14px;height:14px;background:#2980b9;border-radius:50%;border:2.5px solid white;box-shadow:0 2px 8px rgba(41,128,185,0.5);transform:translate(-50%,-50%);"></div>
      </div>`
    geoMarkerRef.current?.remove()
    geoMarkerRef.current = new maplibregl.Marker({ element: el, anchor: 'center' })
      .setLngLat([pos.lng, pos.lat]).addTo(map)
  }

  function drawGeoCircles(pos: { lat: number; lng: number; acc: number }) {
    const map = mapRef.current
    if (!map) return
    removeGeoCircles()
    const accCoords = makeCircle(pos.lat, pos.lng, Math.max(pos.acc ?? 50, 30))
    const radCoords = makeCircle(pos.lat, pos.lng, nearbyRadius)

    if (!map.getSource('geo-acc')) {
      map.addSource('geo-acc', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [accCoords] }, properties: {} } })
      map.addLayer({ id: 'geo-acc-fill', type: 'fill', source: 'geo-acc', paint: { 'fill-color': '#2980b9', 'fill-opacity': 0.12 } })
      map.addLayer({ id: 'geo-acc-stroke', type: 'line', source: 'geo-acc', paint: { 'line-color': '#2980b9', 'line-width': 1.5, 'line-opacity': 0.4 } })
    } else {
      (map.getSource('geo-acc') as any).setData({ type: 'Feature', geometry: { type: 'Polygon', coordinates: [accCoords] }, properties: {} })
    }
    if (!map.getSource('geo-radius')) {
      map.addSource('geo-radius', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [radCoords] }, properties: {} } })
      map.addLayer({ id: 'geo-radius-fill', type: 'fill', source: 'geo-radius', paint: { 'fill-color': '#2980b9', 'fill-opacity': 0.05 } })
      map.addLayer({ id: 'geo-radius-stroke', type: 'line', source: 'geo-radius', paint: { 'line-color': '#2980b9', 'line-width': 2, 'line-opacity': 0.5, 'line-dasharray': [4, 3] } })
    } else {
      (map.getSource('geo-radius') as any).setData({ type: 'Feature', geometry: { type: 'Polygon', coordinates: [radCoords] }, properties: {} })
    }
  }

  function removeGeoCircles() {
    const map = mapRef.current
    if (!map) return
    ;['geo-acc-fill','geo-acc-stroke','geo-radius-fill','geo-radius-stroke'].forEach(id => {
      try { if (map.getLayer(id)) map.removeLayer(id) } catch {}
    })
    ;['geo-acc','geo-radius'].forEach(id => {
      try { if (map.getSource(id)) map.removeSource(id) } catch {}
    })
  }

  // ── ITINÉRAIRE ────────────────────────────────────────────
  function startRoute(bien: BienPublic) {
    routeOriginRef.current = { lng: bien.lng, lat: bien.lat }
    routePickingRef.current = true
    setRoutePickingDest(true)
    setRouteActive(true)
    const map = mapRef.current
    if (map) map.getCanvas().style.cursor = 'crosshair'
  }

  function placeRouteDestMarker(lng: number, lat: number) {
    const map = mapRef.current
    if (!map) return
    const maplibregl = maplibreRef.current
    if (!maplibregl) return
    routeDestMarkerRef.current?.remove()
    const el = document.createElement('div')
    el.innerHTML = `<div style="width:16px;height:16px;background:#2980b9;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`
    routeDestMarkerRef.current = new maplibregl.Marker({ element: el, anchor: 'center' })
      .setLngLat([lng, lat]).addTo(map)
    map.getCanvas().style.cursor = ''
  }

  function cancelRoute() {
    const bien = activeBien
    routeOriginRef.current = null
    routePickingRef.current = false
    setRoutePickingDest(false)
    setRouteActive(false)
    routeDestMarkerRef.current?.remove()
    routeDestMarkerRef.current = null
    const map = mapRef.current
    if (map) {
      map.getCanvas().style.cursor = ''
      try { if (map.getLayer('route-layer')) map.removeLayer('route-layer') } catch {}
      try { if (map.getSource('route-source')) map.removeSource('route-source') } catch {}
    }
    if (bien) flyTo3D([bien.lng, bien.lat], 17.5)
  }

  // ── TOGGLE GÉOLOC ─────────────────────────────────────────
  function toggleGeoloc() {
    if (geoActive) {
      stopGeo()
      setGeoActive(false)
    } else {
      setGeoActive(true)
      startGeo(
        (pos) => {
          mapRef.current?.flyTo({ center: [pos.lng, pos.lat], zoom: 13, speed: 1.3 })
          showToast('📍 Position trouvée')
        },
        (err) => {
          showToast(`❌ ${err}`)
          setGeoActive(false)
        }
      )
    }
  }

  // ── 3D BUILDINGS ──────────────────────────────────────────
  function toggle3D() {
    const map = mapRef.current
    if (!map) return
    // Si la 3D était en mode auto, on prend le contrôle manuel
    if (auto3DRef.current) auto3DRef.current = false
    is3DRef.current = !is3DRef.current
    if (is3DRef.current) {
      map.easeTo({ pitch: 55, bearing: -15, zoom: Math.max(map.getZoom(), 15), duration: 900 })
    } else {
      map.easeTo({ pitch: 0, bearing: 0, duration: 700 })
      if (buildingsRef.current) {
        try { map.setLayoutProperty('3d-buildings', 'visibility', 'none') } catch {}
        buildingsRef.current = false
      }
    }
  }

  function toggleBuildings() {
    const map = mapRef.current
    if (!map) return
    if (!map.getLayer('3d-buildings')) {
      if (!map.getSource('openmaptiles')) {
        map.addSource('openmaptiles', { type: 'vector', url: 'https://tiles.openfreemap.org/planet' })
      }
      map.addLayer({
        id: '3d-buildings', source: 'openmaptiles', 'source-layer': 'building',
        type: 'fill-extrusion', minzoom: 14,
        paint: {
          'fill-extrusion-color': ['interpolate', ['linear'], ['coalesce', ['get', 'render_height'], 10], 0, '#ede8e1', 10, '#ddd5c8', 30, '#ccc3b2', 80, '#bbb09a'],
          'fill-extrusion-height': ['coalesce', ['get', 'render_height'], ['get', 'height'], 10],
          'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
          'fill-extrusion-opacity': 0.85,
        }
      })
      buildingsRef.current = true
    } else {
      buildingsRef.current = !buildingsRef.current
      map.setLayoutProperty('3d-buildings', 'visibility', buildingsRef.current ? 'visible' : 'none')
    }
  }

  // ── STYLE CARTE ───────────────────────────────────────────
  const MAX_ZOOM: Record<MapStyleKey, number> = { street: 19, satellite: 18.5, topo: 17 }

  function setMapStyle(style: MapStyleKey) {
    const map = mapRef.current
    if (!map) return
    styleRef.current = style
    setMapStyleState(style)
    map.setStyle(MAP_STYLES[style] as any)
    map.setMaxZoom(MAX_ZOOM[style])
    // Si le zoom actuel dépasse la limite, redescendre
    if (map.getZoom() > MAX_ZOOM[style]) {
      map.easeTo({ zoom: MAX_ZOOM[style], duration: 400 })
    }
    map.once('style.load', () => updateMarkers())
  }

  // ── RENDER ────────────────────────────────────────────────
  return (
    <div className="flex-1 relative overflow-hidden">
      {/* Carte */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Lasso canvas */}
      <LassoCanvas mapRef={mapRef} containerRef={containerRef} />

      {/* Barre de recherche */}
      <SearchBar mapRef={mapRef} />

      {/* Popup détail bien */}
      {activeBien && (
        <DetailPopup
          bien={activeBien}
          insightsHtml={insightsHtml}
          onClose={() => setActiveBienId(null)}
          onRoute={() => startRoute(activeBien)}
          poiCategories={POI_CATEGORIES}
        />
      )}

      {/* Panneau itinéraire */}
      {routeActive && (
        <RoutePanel
          origin={routeOriginRef.current}
          mapRef={mapRef}
          picking={routePickingDest}
          onPlaceDest={placeRouteDestMarker}
          onCancel={cancelRoute}
        />
      )}

      {/* Hint clic carte itinéraire */}
      {routePickingDest && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-navy text-white px-4 py-2.5 rounded-full text-xs z-20 shadow-lg whitespace-nowrap animate-fade-in">
          🖱️ Clique sur la carte pour définir la destination
        </div>
      )}

      {/* Panneau proximité géoloc */}
      {geoActive && geoPosition && (
        <NearbyPanel
          biens={biens}
          position={geoPosition}
          onSelectBien={(id) => {
            setActiveBienId(id)
            const b = biens.find(x => x.id === id)
            if (b) flyTo3D([b.lng, b.lat], 17.5)
          }}
          onClose={() => { stopGeo(); setGeoActive(false) }}
        />
      )}

      {/* Bouton toggle sidebar — desktop uniquement */}
      <button
        onClick={toggleSidebar}
        className="hidden lg:flex absolute top-1/2 -translate-y-1/2 left-0 z-10 w-5 h-12 bg-white border border-navy/12 border-l-0 rounded-r-lg items-center justify-center text-[11px] text-navy/45 shadow-sm hover:bg-navy hover:text-white transition-all"
      >
        {sidebarOpen ? '‹' : '›'}
      </button>

      {/* Contrôles droite */}
      <div className="absolute top-4 right-4 flex flex-col gap-1.5 z-10">
        {[
          { label: '+', action: () => mapRef.current?.zoomIn() },
          { label: '−', action: () => mapRef.current?.zoomOut() },
          { label: '⌖', action: () => mapRef.current?.flyTo({ center: [2.3522, 48.8566], zoom: 11, pitch: 0, bearing: 0 }) },
          { label: '3D', action: toggle3D },
          { label: '🏢', action: toggleBuildings },
        ].map(btn => (
          <button key={btn.label} onClick={btn.action}
            className="w-9 h-9 bg-white border border-navy/12 rounded-lg flex items-center justify-center text-sm shadow-sm hover:bg-navy hover:text-white transition-all font-medium">
            {btn.label}
          </button>
        ))}
        {/* Géoloc */}
        <button onClick={toggleGeoloc}
          className={`w-9 h-9 border rounded-lg flex items-center justify-center shadow-sm transition-all ${geoActive ? 'bg-[#2980b9] border-[#2980b9] text-white' : 'bg-white border-navy/12 hover:bg-navy hover:text-white'}`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="6"/>
            <line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/>
            <line x1="18" y1="12" x2="22" y2="12"/>
          </svg>
        </button>
        {/* Zoom display */}
        <div className="w-9 h-9 bg-white border border-navy/12 rounded-lg flex items-center justify-center text-[11px] font-semibold shadow-sm cursor-default">
          {zoom}
        </div>
      </div>

      {/* Style carte */}
      <div className="absolute bottom-10 right-4 flex bg-white border border-navy/12 rounded-lg overflow-hidden shadow-sm z-10">
        {(['street', 'satellite', 'topo'] as MapStyleKey[]).map(s => (
          <button key={s} onClick={() => setMapStyle(s)}
            className={`px-3 py-2 text-xs font-medium border-r last:border-r-0 border-navy/10 transition-all ${mapStyle === s ? 'bg-navy text-white' : 'text-navy/50 hover:text-navy'}`}>
            {s === 'street' ? 'Plan' : s === 'satellite' ? 'Satellite' : 'Topo'}
          </button>
        ))}
      </div>

      {/* Lasso controls */}
      <LassoControls />

      {/* Légende POI */}
      {activeBien && poiData && poiData.pois.length > 0 && (
        <div className="absolute bottom-10 left-4 bg-white rounded-xl p-3 shadow-md border border-navy/10 z-10 text-xs font-['DM_Sans']">
          <div className="text-[10px] font-medium text-navy/40 uppercase tracking-wider mb-2">Commodités</div>
          {POI_CATEGORIES.map(cat => (
            <div key={cat.key} className="flex items-center gap-2 mb-1.5 last:mb-0">
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] border-2 border-white shadow-sm flex-shrink-0" style={{ background: cat.color }}>{cat.emoji}</div>
              <span className="text-navy">{cat.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Styles CSS inline pour animations */}
      <style>{`
        @keyframes poiFloat { from { opacity: 0; transform: translateY(10px) scale(0.85); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes approxPulse { 0%, 100% { transform: translate(-50%,-60%) scale(1); opacity: 0.5; } 50% { transform: translate(-50%,-60%) scale(1.55); opacity: 0; } }
        @keyframes geoRipple { 0% { transform: translate(-50%,-50%) scale(1); opacity: 0.55; } 100% { transform: translate(-50%,-50%) scale(3.2); opacity: 0; } }
        @keyframes animate-fade-in { from { opacity: 0; transform: translateX(-50%) translateY(8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        .animate-fade-in { animation: animate-fade-in 0.22s ease; }
      `}</style>
    </div>
  )
}

function LassoControls() {
  const { setLassoPolygon, lassoPolygon } = useMapStore()
  return (
    <div className="absolute bottom-10 left-4 z-10" style={{ display: lassoPolygon ? 'block' : 'none' }}>
      <button onClick={() => setLassoPolygon(null)}
        className="bg-white border border-navy/12 rounded-lg px-3 py-2 text-xs font-medium text-navy/60 shadow-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all">
        ✕ Annuler la zone
      </button>
    </div>
  )
}



