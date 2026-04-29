'use client'

interface Point { date: string; value: number }

interface Props {
  data:        Point[]
  color?:      string
  height?:     number
  showLabels?: boolean
  filled?:     boolean
  showYAxis?:  boolean
}

export default function LineChart({
  data,
  color      = '#4F46E5',
  height     = 120,
  showLabels = true,
  filled     = true,
  showYAxis  = false,
}: Props) {
  if (!data.length) return (
    <div className="flex items-center justify-center h-24 text-[rgba(15,23,42,0.25)] text-xs">Aucune donnée</div>
  )

  const W   = 600
  const H   = height
  const PAD = { top: 16, right: 12, bottom: showLabels ? 32 : 12, left: showYAxis ? 36 : 8 }

  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top  - PAD.bottom

  const max = Math.max(...data.map(d => d.value), 1)

  const points = data.map((d, i) => ({
    x: PAD.left + (i / Math.max(data.length - 1, 1)) * chartW,
    y: PAD.top  + chartH - (d.value / max) * chartH,
    ...d,
  }))

  // Courbe lisse avec courbes de Bézier
  function smoothPath(pts: typeof points): string {
    if (pts.length < 2) return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
    let d = `M${pts[0].x},${pts[0].y}`
    for (let i = 0; i < pts.length - 1; i++) {
      const cp1x = pts[i].x   + (pts[i+1].x - pts[i].x)   / 3
      const cp1y = pts[i].y
      const cp2x = pts[i+1].x - (pts[i+1].x - pts[i].x)   / 3
      const cp2y = pts[i+1].y
      d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${pts[i+1].x},${pts[i+1].y}`
    }
    return d
  }

  const linePath = smoothPath(points)
  const baseline = PAD.top + chartH
  const fillPath = `${linePath} L${points[points.length-1].x},${baseline} L${points[0].x},${baseline} Z`

  // Grilles horizontales
  const gridLines = [0, 0.25, 0.5, 0.75, 1]

  // Labels X : premier, milieu, dernier + quelques intermédiaires
  const step = Math.max(1, Math.floor(data.length / 6))
  const labelIdxs = Array.from(new Set([
    0,
    ...Array.from({ length: Math.floor(data.length / step) }, (_, i) => (i + 1) * step),
    data.length - 1,
  ])).filter(i => i < data.length)

  const gradId = `lc-grad-${color.replace('#', '')}`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>

      {/* Grilles horizontales */}
      {gridLines.map(r => {
        const y = PAD.top + chartH * (1 - r)
        const val = Math.round(max * r)
        return (
          <g key={r}>
            <line x1={PAD.left} y1={y} x2={PAD.left + chartW} y2={y}
              stroke="rgba(15,23,42,0.06)" strokeWidth="1" strokeDasharray={r === 0 ? '0' : '4 4'} />
            {showYAxis && r > 0 && (
              <text x={PAD.left - 6} y={y + 3.5} textAnchor="end"
                fontSize="9" fill="rgba(15,23,42,0.30)" fontFamily="sans-serif">
                {val}
              </text>
            )}
          </g>
        )
      })}

      {/* Zone remplie */}
      {filled && <path d={fillPath} fill={`url(#${gradId})`} />}

      {/* Ligne lisse */}
      <path d={linePath} fill="none" stroke={color} strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round" />

      {/* Labels X */}
      {showLabels && labelIdxs.map(i => {
        const p = points[i]
        const raw = data[i].date.slice(5)   // MM-DD
        const [mm, dd] = raw.split('-')
        const moisCourt = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc'][parseInt(mm) - 1] ?? mm
        return (
          <text key={i} x={p.x} y={H - 6} textAnchor="middle"
            fontSize="9" fill="rgba(15,23,42,0.38)" fontFamily="sans-serif">
            {dd} {moisCourt}
          </text>
        )
      })}
    </svg>
  )
}
