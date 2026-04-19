'use client'

interface Point { date: string; value: number }

interface Props {
  data: Point[]
  color?: string
  height?: number
  showLabels?: boolean
  filled?: boolean
}

export default function LineChart({
  data,
  color = '#4F46E5',
  height = 120,
  showLabels = true,
  filled = true,
}: Props) {
  if (!data.length) return (
    <div className="flex items-center justify-center h-24 text-navy/25 text-xs">Aucune donnée</div>
  )

  const W = 600
  const H = height
  const PAD = { top: 10, right: 8, bottom: showLabels ? 28 : 8, left: 8 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom

  const max = Math.max(...data.map(d => d.value), 1)
  const min = 0

  const points = data.map((d, i) => ({
    x: PAD.left + (i / Math.max(data.length - 1, 1)) * chartW,
    y: PAD.top + chartH - ((d.value - min) / (max - min)) * chartH,
    ...d,
  }))

  // Ligne SVG
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')

  // Zone remplie
  const fillPath = points.length > 0
    ? `${linePath} L${points[points.length - 1].x.toFixed(1)},${(PAD.top + chartH).toFixed(1)} L${points[0].x.toFixed(1)},${(PAD.top + chartH).toFixed(1)} Z`
    : ''

  // Labels : afficher seulement le premier, milieu et dernier
  const labelIdxs = data.length <= 7
    ? data.map((_, i) => i)
    : [0, Math.floor((data.length - 1) / 2), data.length - 1]

  const gradId = `grad-${color.replace('#', '')}`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grille horizontale légère */}
      {[0.25, 0.5, 0.75, 1].map(r => (
        <line key={r}
          x1={PAD.left} y1={PAD.top + chartH * (1 - r)}
          x2={PAD.left + chartW} y2={PAD.top + chartH * (1 - r)}
          stroke="rgba(15,23,42,0.06)" strokeWidth="1" />
      ))}

      {/* Zone remplie */}
      {filled && fillPath && (
        <path d={fillPath} fill={`url(#${gradId})`} />
      )}

      {/* Ligne */}
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Points actifs */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="white" stroke={color} strokeWidth="1.5" />
      ))}

      {/* Labels de dates */}
      {showLabels && labelIdxs.map(i => {
        const p = points[i]
        const label = data[i].date.slice(5) // MM-DD
        return (
          <text key={i} x={p.x} y={H - 4} textAnchor="middle"
            fontSize="9" fill="rgba(15,23,42,0.35)" fontFamily="sans-serif">
            {label}
          </text>
        )
      })}
    </svg>
  )
}



