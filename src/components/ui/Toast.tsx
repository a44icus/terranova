'use client'
 
import { useMapStore } from '@/store/mapStore'
 
export default function Toast() {
  const toast = useMapStore(s => s.toast)
  if (!toast) return null
  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-navy text-white px-5 py-2.5 rounded-full text-sm z-[300] shadow-lg animate-fade-in whitespace-nowrap">
      {toast}
    </div>
  )
}
 


