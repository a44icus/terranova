'use client'

import { useMapStore } from '@/store/mapStore'
import { useFiltersUrlSync } from '@/hooks/useFiltersUrlSync'
import Filters from './Filters'
import BienList from './BienList'

export default function Sidebar() {
  const { sidebarOpen } = useMapStore()
  useFiltersUrlSync()

  return (
    <div
      className="flex-shrink-0 bg-surface border-r border-navy/10 flex flex-col overflow-hidden transition-all duration-300"
      style={{ width: sidebarOpen ? 360 : 0, opacity: sidebarOpen ? 1 : 0 }}
    >
      <div className="flex flex-col overflow-hidden h-full" style={{ minWidth: 360 }}>
        <Filters />
        <BienList />
      </div>
    </div>
  )
}



