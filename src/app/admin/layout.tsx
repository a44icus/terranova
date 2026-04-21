import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const ADMIN_NAV = [
  { href: '/admin/annonces',         label: 'Annonces en attente', icon: '⏳' },
  { href: '/admin/annonces/toutes',  label: 'Toutes les annonces', icon: '🏠' },
  { href: '/admin/map-ads',          label: 'Pubs sur la carte',   icon: '📍' },  // ← NOUVEAU
  { href: '/admin/reglages',         label: 'Réglages du site',    icon: '🔧' },
  { href: '/admin/parametres',       label: 'Plans & Stripe',      icon: '💳' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean)
  const isAdmin =
    user.user_metadata?.role === 'admin' ||
    user.app_metadata?.role === 'admin' ||
    adminEmails.includes(user.email ?? '')

  if (!isAdmin) redirect('/')

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 flex flex-col" style={{ background: '#0F172A' }}>
        {/* Logo */}
        <div className="h-14 flex items-center px-6 border-b border-white/10">
          <Link href="/" className="font-serif text-[22px] tracking-wide text-white">
            Terra<span className="italic" style={{ color: '#4F46E5' }}>nova</span>
          </Link>
          <span className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded text-white/60 border border-white/20 uppercase tracking-wider">
            Admin
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 pt-4">
          {ADMIN_NAV.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-0.5 text-white/60 hover:bg-white/08 hover:text-white transition-all"
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <Link
            href="/compte"
            className="block text-center text-xs text-white/40 hover:text-white/70 py-1.5 transition-colors"
          >
            ← Mon compte
          </Link>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 bg-[#F8FAFC] min-h-screen">
        {children}
      </main>
    </div>
  )
}
