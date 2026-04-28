'use client'

import { useEffect, useRef } from 'react'
import { MAP_STYLES } from '@/lib/mapStyles'

interface Props {
  lat: number
  lng: number
  label?: string
}

const PIN_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 28 34'%3E%3Cellipse cx='14' cy='31' rx='6' ry='2.5' fill='rgba(0,0,0,0.18)'/%3E%3Cpath d='M14 2C8.477 2 4 6.477 4 12c0 7.5 10 20 10 20s10-12.5 10-20c0-5.523-4.477-10-10-10z' fill='%234F46E5'/%3E%3Ccircle cx='14' cy='12' r='4' fill='white'/%3E%3C/svg%3E`

export default function AgentMapPin({ lat, lng, label }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    import('maplibre-gl').then(({ default: mgl }) => {
      if (!containerRef.current) return

      const map = new mgl.Map({
        container: containerRef.current,
        style: MAP_STYLES.street as any,
        center: [lng, lat],
        zoom: 15,
        attributionControl: false,
      })
      mapRef.current = map

      const el = document.createElement('div')
      el.style.cssText = `width:28px;height:34px;background:url("${PIN_SVG}") center/contain no-repeat;`

      const marker = new mgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([lng, lat])
        .addTo(map)

      if (label) {
        marker.setPopup(new mgl.Popup({ offset: [0, -36], closeButton: false })
          .setHTML(`<p style="font-size:12px;font-weight:500;margin:0;white-space:nowrap">${label}</p>`))
      }
    })

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [lat, lng, label])

  return <div ref={containerRef} className="w-full h-full" />
}
