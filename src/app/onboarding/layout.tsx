import type { ReactNode } from 'react'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </main>
      <SiteFooter />
    </div>
  )
}
