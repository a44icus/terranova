'use client'

interface Slice {
  label: string
  value: number
  color: string
}

interface Props {
  data:         Slice[]
  total?:       number
  centerLine1?: string
  centerLine2?: string
  size?:        number
}

export default function DonutChart({ data, total, centerLine1, centerLine2, size = 150 }: Props) {
  const sum = data.reduce((s, d) => s + d.value, 0)

  if (sum === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-[#0F172A]/20 gap-2">
        <svg className="w-12 h-12" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="14" strokeDasharray="6 4" opacity="0.3"/>
        </svg>
        <p className="text-xs">Aucune donnée</p>
      </div>
    )
  }

  const displayTotal = total ?? sum
  const R  = 40
  const r  = 26
  const cx = 50
  const cy = 50
  const gap = 1.5

  function polar(angleDeg: number, radius: number) {
    const rad = ((angleDeg - 90) * Math.PI) / 180
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) }
  }

  function arc(startDeg: number, endDeg: number) {
    const s1  = polar(startDeg, R), e1 = polar(endDeg, R)
    const s2  = polar(endDeg,   r), e2 = polar(startDeg, r)
    const big = endDeg - startDeg > 180 ? 1 : 0
    return `M${s1.x} ${s1.y} A${R} ${R} 0 ${big} 1 ${e1.x} ${e1.y} L${s2.x} ${s2.y} A${r} ${r} 0 ${big} 0 ${e2.x} ${e2.y}Z`
  }

  let cursor = 0
  const slices = data.map(d => {
    const sweep = (d.value / sum) * (360 - data.length * gap)
    const path  = arc(cursor, cursor + sweep)
    cursor += sweep + gap
    return { ...d, path, pct: d.value / sum }
  })

  return (
    <div>
      {/* Donut centré */}
      <div className="flex justify-center mb-5">
        <svg viewBox="0 0 100 100" style={{ width: size, height: size }}>
          {slices.map((s, i) => (
            <path key={i} d={s.path} fill={s.color} />
          ))}
          {/* Centre */}
          <text x={cx} y={cy - 5} textAnchor="middle" fontSize="13" fontWeight="700"
            fill="#0F172A" fontFamily="'DM Serif Display', serif">
            {centerLine1 ?? displayTotal}
          </text>
          <text x={cx} y={cy + 8} textAnchor="middle" fontSize="7.5"
            fill="rgba(15,23,42,0.45)" fontFamily="sans-serif">
            {centerLine2 ?? 'total'}
          </text>
        </svg>
      </div>

      {/* Légende en lignes */}
      <div className="space-y-2.5">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
              <span className="text-[#0F172A]/55">{s.label}</span>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="font-semibold text-[#0F172A] tabular-nums">{s.value}</span>
              <span className="text-[#0F172A]/30 w-8 text-right tabular-nums">
                {(s.pct * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
