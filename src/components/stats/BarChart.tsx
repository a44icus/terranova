'use client'

interface Bar { label: string; value: number; color?: string }

interface Props {
  data: Bar[]
  height?: number
  color?: string
}

export default function BarChart({ data, height = 140, color = '#4F46E5' }: Props) {
  if (!data.length) return (
    <div className="flex items-center justify-center h-24 text-navy/25 text-xs">Aucune donnée</div>
  )

  const W = 600
  const H = height
  const PAD = { top: 10, right: 8, bottom: 32, left: 8 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom

  const max = Math.max(...data.map(d => d.value), 1)
  const barW = chartW / data.length
  const gap = barW * 0.25

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }}>
      {/* Grille */}
      {[0.5, 1].map(r => (
        <line key={r}
          x1={PAD.left} y1={PAD.top + chartH * (1 - r)}
          x2={PAD.left + chartW} y2={PAD.top + chartH * (1 - r)}
          stroke="rgba(15,23,42,0.06)" strokeWidth="1" />
      ))}

      {data.map((d, i) => {
        const barH = Math.max((d.value / max) * chartH, d.value > 0 ? 3 : 0)
        const x = PAD.left + i * barW + gap / 2
        const y = PAD.top + chartH - barH
        const w = barW - gap
        const c = d.color ?? color
        const isLong = d.label.length > 6

        return (
          <g key={i}>
            <rect x={x} y={y} width={w} height={barH}
              fill={c} rx="3" opacity="0.85" />
            {/* Valeur au dessus */}
            {d.value > 0 && (
              <text x={x + w / 2} y={y - 3} textAnchor="middle"
                fontSize="9" fill={c} fontFamily="sans-serif" fontWeight="600">
                {d.value}
              </text>
            )}
            {/* Label en bas */}
            <text x={x + w / 2} y={H - 8} textAnchor="middle"
              fontSize={isLong ? '7.5' : '9'} fill="rgba(15,23,42,0.45)" fontFamily="sans-serif">
              {d.label.length > 10 ? d.label.slice(0, 10) + '…' : d.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}



