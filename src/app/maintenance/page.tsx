import { getSiteSettings } from '@/lib/siteSettings'

export default async function MaintenancePage() {
  const s = await getSiteSettings()

  return (
    <div className="min-h-screen bg-[#F8F7F5] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">

        {/* Logo */}
        <h1 className="font-serif text-4xl text-navy mb-2">
          Terra<span className="text-primary italic">nova</span>
        </h1>

        {/* Icône */}
        <div className="text-6xl my-8">🛠️</div>

        {/* Titre */}
        <h2 className="font-serif text-2xl text-navy mb-4">
          Site en maintenance
        </h2>

        {/* Message personnalisé */}
        <p className="text-navy/60 text-sm leading-relaxed mb-8">
          {s.maintenance_message || 'Le site est en maintenance, revenez bientôt.'}
        </p>

        {/* Lien admin discret */}
        <a
          href="/auth/login?redirect=/admin"
          className="text-xs text-navy/30 hover:text-navy/50 transition-colors underline underline-offset-2"
        >
          Accès administrateur
        </a>
      </div>
    </div>
  )
}
