import type { ReactNode } from 'react'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <SiteHeader />

      {/* Contenu */}
      <main className="flex-1">
        {children}
      </main>

      <SiteFooter />
    </div>
  )
}
