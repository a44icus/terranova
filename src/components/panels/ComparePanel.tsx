'use client'

import Image from 'next/image'
import { useMapStore } from '@/store/mapStore'
import { formatPrix } from '@/lib/geo'

interface Props {
  onClose: () => void
}

export default function ComparePanel({ onClose }: Props) {
  const { biens, compareSet, toggleCompare, clearCompare } = useMapStore()
  const compareBiens = [...compareSet].map(id => biens.find(b => b.id === id)).filter(Boolean) as typeof biens

  const rows = [
    { label: 'Prix',       fn: (b: typeof biens[0]) => formatPrix(b.prix, b.type), isBestMin: true },
    { label: 'Surface',    fn: (b: typeof biens[0]) => b.surface ? `${b.surface} m²` : '—', isBestMin: false },
    { label: 'Prix/m²',    fn: (b: typeof biens[0]) => b.type === 'vente' && b.surface ? `${Math.round(b.prix / b.surface).toLocaleString('fr-FR')} €` : '—', isBestMin: true },
    { label: 'Pièces',     fn: (b: typeof biens[0]) => b.pieces ? String(b.pieces) : '—', isBestMin: false },
    { label: 'SDB',        fn: (b: typeof biens[0]) => b.sdb ? String(b.sdb) : '—', isBestMin: false },
    { label: 'DPE',        fn: (b: typeof biens[0]) => b.dpe ?? '—', isBestMin: false },
    { label: 'Localisation', fn: (b: typeof biens[0]) => `${b.ville} ${b.code_postal}`, isBestMin: false },
    { label: 'Options',    fn: (b: typeof biens[0]) => b.options.join(', ') || '—', isBestMin: false },
  ]

  if (compareBiens.length < 2) return null

  return (
    <div className="fixed inset-0 bg-navy/55 z-[210] flex items-start justify-center pt-10 overflow-y-auto">
      <div className="bg-surface rounded-2xl max-w-3xl w-full mx-4 mb-10 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-navy/10">
          <h2 className="font-serif text-xl text-navy">Comparateur</h2>
          <div className="flex gap-2">
            <button onClick={clearCompare} className="text-xs border border-navy/15 px-3 py-1.5 rounded-lg text-navy/60 hover:border-navy/30 transition-colors">
              Tout effacer
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-navy/07 flex items-center justify-center text-sm hover:bg-navy/15 transition-colors">✕</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-4 text-left text-xs font-medium text-navy/40 uppercase tracking-wider bg-surface"></th>
                {compareBiens.map(b => (
                  <th key={b.id} className="p-4 text-center bg-white border-b border-navy/10">
                    <div className="relative">
                      <button onClick={() => toggleCompare(b.id)}
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-navy/10 text-[10px] hover:bg-red-100 hover:text-red-600 transition-colors">✕</button>
                      {b.photo_url && (
                        <div className="relative w-20 h-14 mx-auto mb-2 rounded-lg overflow-hidden">
                          <Image src={b.photo_url} alt={b.titre} fill className="object-cover" sizes="80px" />
                        </div>
                      )}
                      <div className="font-serif text-sm text-navy">{formatPrix(b.prix, b.type)}</div>
                      <div className="text-xs text-navy/60 mt-0.5 truncate max-w-[140px] mx-auto">{b.titre}</div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ label, fn, isBestMin }) => {
                const vals = compareBiens.map(fn)
                const nums = vals.map(v => parseFloat(v.replace(/\s/g,'').replace('€','').replace('m²','')))
                const validNums = nums.filter(n => !isNaN(n))
                const best = validNums.length > 1 ? (isBestMin ? Math.min(...validNums) : Math.max(...validNums)) : null
                return (
                  <tr key={label} className="border-b border-navy/08 last:border-b-0">
                    <td className="p-3 text-xs font-medium text-navy/50 bg-surface">{label}</td>
                    {vals.map((val, i) => {
                      const isBest = best !== null && !isNaN(nums[i]) && nums[i] === best
                      return (
                        <td key={i} className={`p-3 text-center text-sm bg-white ${isBest ? 'text-location font-bold' : 'text-navy'}`}>
                          {val}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}



