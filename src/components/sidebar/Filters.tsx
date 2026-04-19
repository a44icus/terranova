'use client'

import { useMapStore } from '@/store/mapStore'
import type { DpeClasse } from '@/lib/types'
import RayonFilter from './RayonFilter'

const DPE_COLORS: Record<DpeClasse, string> = {
  A: '#2E7D32', B: '#558B2F', C: '#9E9D24',
  D: '#F9A825', E: '#EF6C00', F: '#D84315', G: '#B71C1C',
}

const OPTIONS = [
  { value: 'parking',   label: 'Parking'   },
  { value: 'terrasse',  label: 'Terrasse'  },
  { value: 'cave',      label: 'Cave'      },
  { value: 'gardien',   label: 'Gardien'   },
  { value: 'piscine',   label: 'Piscine'   },
  { value: 'ascenseur', label: 'Ascenseur' },
  { value: 'jardin',    label: 'Jardin'    },
  { value: 'meuble',    label: 'Meublé'    },
]

const DEPARTEMENTS = [
  { value: '01', label: '01 – Ain' }, { value: '02', label: '02 – Aisne' },
  { value: '03', label: '03 – Allier' }, { value: '06', label: '06 – Alpes-Mar.' },
  { value: '13', label: '13 – Bouches-du-Rhône' }, { value: '14', label: '14 – Calvados' },
  { value: '21', label: '21 – Côte-d\'Or' }, { value: '25', label: '25 – Doubs' },
  { value: '31', label: '31 – Haute-Garonne' }, { value: '33', label: '33 – Gironde' },
  { value: '34', label: '34 – Hérault' }, { value: '35', label: '35 – Ille-et-Vilaine' },
  { value: '38', label: '38 – Isère' }, { value: '44', label: '44 – Loire-Atl.' },
  { value: '45', label: '45 – Loiret' }, { value: '51', label: '51 – Marne' },
  { value: '54', label: '54 – Meurthe-et-M.' }, { value: '57', label: '57 – Moselle' },
  { value: '59', label: '59 – Nord' }, { value: '60', label: '60 – Oise' },
  { value: '62', label: '62 – Pas-de-Calais' }, { value: '67', label: '67 – Bas-Rhin' },
  { value: '69', label: '69 – Rhône' }, { value: '75', label: '75 – Paris' },
  { value: '76', label: '76 – Seine-Mar.' }, { value: '77', label: '77 – Seine-et-M.' },
  { value: '78', label: '78 – Yvelines' }, { value: '80', label: '80 – Somme' },
  { value: '83', label: '83 – Var' }, { value: '84', label: '84 – Vaucluse' },
  { value: '91', label: '91 – Essonne' }, { value: '92', label: '92 – Hauts-de-Seine' },
  { value: '93', label: '93 – Seine-Saint-Denis' }, { value: '94', label: '94 – Val-de-Marne' },
  { value: '95', label: '95 – Val-d\'Oise' },
]

export default function Filters() {
  const {
    filtres,
    setFiltreType, setFiltreCategorie, setFiltrePrixMax,
    setFiltreSurface, setFiltrePieces,
    toggleFiltreOption, toggleFiltreDpe,
    setFiltreVille, setFiltreDepartement,
    resetFiltres,
  } = useMapStore()

  const hasActiveFilters = filtres.type !== 'all' || filtres.categorie ||
    filtres.surface || filtres.pieces > 0 || filtres.options.size > 0 ||
    filtres.dpe.size > 0 || filtres.ville || filtres.departement

  return (
    <div className="flex-shrink-0 border-b border-navy/10">
      {/* Type */}
      <div className="p-3 border-b border-navy/10">
        <div className="flex bg-navy/06 rounded-lg p-0.5 gap-0.5">
          {(['all', 'vente', 'location'] as const).map(t => (
            <button key={t} onClick={() => setFiltreType(t)}
              className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-all ${filtres.type === t ? 'bg-white text-navy shadow-sm' : 'text-navy/50 hover:text-navy'}`}>
              {t === 'all' ? 'Tout' : t === 'vente' ? 'Vente' : 'Location'}
            </button>
          ))}
        </div>
      </div>

      {/* Ville + Département */}
      <div className="p-3 border-b border-navy/10 space-y-2">
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-navy/30 text-xs">🏙</span>
          <input
            type="text"
            value={filtres.ville}
            onChange={e => setFiltreVille(e.target.value)}
            placeholder="Ville (ex: Paris, Lyon…)"
            className="w-full border border-navy/12 bg-white rounded-md pl-7 pr-7 py-1.5 text-xs text-navy placeholder-navy/35 focus:outline-none focus:border-primary transition-colors"
          />
          {filtres.ville && (
            <button onClick={() => setFiltreVille('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-navy/30 hover:text-navy text-xs">✕</button>
          )}
        </div>
        <div className="relative">
          <select
            value={filtres.departement}
            onChange={e => setFiltreDepartement(e.target.value)}
            className="w-full border border-navy/12 bg-white rounded-md px-2 py-1.5 text-xs text-navy appearance-none cursor-pointer focus:outline-none focus:border-primary transition-colors"
          >
            <option value="">Tous les départements</option>
            {DEPARTEMENTS.map(d => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-navy/30 text-[10px] pointer-events-none">▾</span>
        </div>
      </div>

      {/* Rayon géographique */}
      <div className="p-3 border-b border-navy/10">
        <h3 className="text-[10px] font-semibold text-[#0F172A]/40 uppercase tracking-wider mb-2">📍 Rayon géographique</h3>
        <RayonFilter />
      </div>

      {/* Catégorie + Surface */}
      <div className="p-3 flex gap-2 border-b border-navy/10">
        <select value={filtres.categorie} onChange={e => setFiltreCategorie(e.target.value as any)}
          className="flex-1 border border-navy/12 bg-white rounded-md px-2 py-1.5 text-xs text-navy appearance-none cursor-pointer focus:outline-none focus:border-primary">
          <option value="">Tous types</option>
          <option value="appartement">Appartement</option>
          <option value="maison">Maison</option>
          <option value="bureau">Bureau / Local</option>
          <option value="terrain">Terrain</option>
          <option value="parking">Parking</option>
        </select>
        <select value={filtres.surface} onChange={e => setFiltreSurface(e.target.value)}
          className="flex-1 border border-navy/12 bg-white rounded-md px-2 py-1.5 text-xs text-navy appearance-none cursor-pointer focus:outline-none focus:border-primary">
          <option value="">Toutes surfaces</option>
          <option value="0-40">&lt; 40 m²</option>
          <option value="40-80">40 – 80 m²</option>
          <option value="80-150">80 – 150 m²</option>
          <option value="150-9999">&gt; 150 m²</option>
        </select>
      </div>

      {/* Prix */}
      <div className="px-3 pt-2.5 pb-2 border-b border-navy/10">
        <div className="flex justify-between text-[11px] text-navy/50 mb-1.5">
          <span>Budget max</span>
          <span className="font-medium text-navy">
            {filtres.prixMax >= 1000000
              ? `${(filtres.prixMax / 1000000).toFixed(1).replace('.0', '')} M€`
              : `${filtres.prixMax.toLocaleString('fr-FR')} €`}
          </span>
        </div>
        <input type="range" min="100000" max="5000000" step="50000"
          value={filtres.prixMax} onChange={e => setFiltrePrixMax(parseInt(e.target.value))}
          className="w-full accent-primary" />
      </div>

      {/* Pièces */}
      <div className="px-3 pt-2 pb-2.5 border-b border-navy/10">
        <div className="text-[11px] font-medium text-navy/40 uppercase tracking-wider mb-2">Pièces</div>
        <div className="flex gap-1.5">
          {[0, 1, 2, 3, 4].map(n => (
            <button key={n} onClick={() => setFiltrePieces(n)}
              className={`flex-1 h-7 rounded-md text-xs font-medium border transition-all ${filtres.pieces === n ? 'bg-navy text-white border-navy' : 'bg-white text-navy/60 border-navy/15 hover:border-navy/30'}`}>
              {n === 0 ? 'Tous' : n === 4 ? '4+' : n}
            </button>
          ))}
        </div>
      </div>

      {/* Options */}
      <div className="px-3 pt-2 pb-2.5 border-b border-navy/10">
        <div className="text-[11px] font-medium text-navy/40 uppercase tracking-wider mb-2">Options</div>
        <div className="flex flex-wrap gap-1.5">
          {OPTIONS.map(o => (
            <button key={o.value} onClick={() => toggleFiltreOption(o.value)}
              className={`px-2.5 py-1 rounded-full text-[11px] border transition-all ${filtres.options.has(o.value) ? 'bg-navy text-white border-navy' : 'bg-white text-navy/60 border-navy/15 hover:border-navy/30'}`}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* DPE */}
      <div className="px-3 pt-2 pb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[11px] font-medium text-navy/40 uppercase tracking-wider">DPE</div>
          {hasActiveFilters && (
            <button onClick={resetFiltres}
              className="text-[10px] text-primary hover:underline font-medium">
              Réinitialiser
            </button>
          )}
        </div>
        <div className="flex gap-1.5">
          {(Object.keys(DPE_COLORS) as DpeClasse[]).map(d => (
            <button key={d} onClick={() => toggleFiltreDpe(d)}
              style={{ background: DPE_COLORS[d], outline: filtres.dpe.has(d) ? '2px solid #0F172A' : 'none', outlineOffset: '2px' }}
              className={`w-8 h-7 rounded-md text-white text-[11px] font-bold transition-all ${filtres.dpe.has(d) ? 'scale-110' : 'opacity-70 hover:opacity-100'}`}>
              {d}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}



