'use client'

import { useRef, useEffect, RefObject } from 'react'
import { useMapStore } from '@/store/mapStore'
import type { Map as MapLibreMap } from 'maplibre-gl'

interface Props {
  mapRef: RefObject<MapLibreMap | null>
  containerRef: RefObject<HTMLDivElement | null>
}

export default function LassoCanvas({ mapRef, containerRef }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const lassoPoints = useRef<[number, number][]>([])
  const lassoMode = useRef(false)
  const { setLassoPolygon, showToast } = useMapStore()
  const [active, setActive] = useStateLocal(false)

  function resizeCanvas() {
    const canvas = canvasRef.current
    const mc = containerRef.current
    if (!canvas || !mc) return
    canvas.width = mc.offsetWidth
    canvas.height = mc.offsetHeight
  }

  useEffect(() => {
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [])

  // Expose toggle to parent via window (simple approach)
  useEffect(() => {
    ;(window as any).__toggleLasso = () => {
      lassoMode.current = !lassoMode.current
      setActive(lassoMode.current)
      if (!lassoMode.current) {
        lassoPoints.current = []
        const ctx = canvasRef.current?.getContext('2d')
        if (ctx && canvasRef.current) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      }
    }
    ;(window as any).__cancelLasso = () => {
      lassoMode.current = false
      setActive(false)
      lassoPoints.current = []
      setLassoPolygon(null)
      const ctx = canvasRef.current?.getContext('2d')
      if (ctx && canvasRef.current) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    }
  }, [])

  function onMouseDown(e: React.MouseEvent) {
    if (!lassoMode.current) return
    lassoPoints.current = [[e.nativeEvent.offsetX, e.nativeEvent.offsetY]]
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!lassoMode.current || !lassoPoints.current.length) return
    lassoPoints.current.push([e.nativeEvent.offsetX, e.nativeEvent.offsetY])
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || !canvas) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.beginPath()
    ctx.moveTo(lassoPoints.current[0][0], lassoPoints.current[0][1])
    lassoPoints.current.forEach(p => ctx.lineTo(p[0], p[1]))
    ctx.strokeStyle = '#4F46E5'
    ctx.lineWidth = 2
    ctx.setLineDash([6, 3])
    ctx.stroke()
    ctx.fillStyle = 'rgba(79,70,229,0.1)'
    ctx.fill()
  }

  function onMouseUp() {
    if (!lassoMode.current || lassoPoints.current.length < 3) return
    const map = mapRef.current
    if (!map) return
    const polygon = lassoPoints.current.map(p => {
      const ll = map.unproject(p)
      return [ll.lng, ll.lat] as [number, number]
    })
    setLassoPolygon(polygon)
    lassoMode.current = false
    setActive(false)
    showToast('Zone sélectionnée')
  }

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-[5]"
      style={{ pointerEvents: active ? 'all' : 'none', cursor: active ? 'crosshair' : 'default' }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
    />
  )
}

function useStateLocal<T>(initial: T): [T, (v: T) => void] {
  const { useState } = require('react')
  return (useState as <S>(initial: S) => [S, (v: S) => void])(initial)
}



