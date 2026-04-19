import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Annonce soumise — Terranova',
}

export default async function PublierSuccessPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* Header simple */}
      <header className="bg-[#0F172A] text-white px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="text-xl font-semibold tracking-wide"
          style={{ fontFamily: "'DM Serif Display', serif" }}
        >
          Terra<span className="text-[#818CF8] italic">nova</span>
        </Link>
        <Link
          href="/compte"
          className="text-xs text-white/60 hover:text-white transition-colors"
        >
          Mon compte
        </Link>
      </header>

      {/* Contenu centré */}
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] max-w-md w-full p-10 text-center">

          {/* Icône de succès */}
          <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-[#EEF2FF] flex items-center justify-center">
            <svg
              className="w-10 h-10 text-[#4F46E5]"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>

          {/* Titre */}
          <h1
            className="text-3xl text-[#0F172A] mb-3"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            Votre annonce a été soumise !
          </h1>

          {/* Sous-titre */}
          <p className="text-[#6B7280] text-sm leading-relaxed mb-8">
            Elle sera visible après validation par notre équipe (sous 24h).
            Vous recevrez une confirmation par email dès qu'elle sera publiée.
          </p>

          {/* Boutons */}
          <div className="flex flex-col gap-3">
            <Link
              href="/compte/mes-annonces"
              className="w-full py-3 px-5 rounded-lg bg-[#4F46E5] text-white text-sm font-medium hover:bg-[#4338CA] transition-colors"
            >
              Voir mes annonces
            </Link>
            <Link
              href="/publier"
              className="w-full py-3 px-5 rounded-lg border border-[#E5E7EB] text-[#374151] text-sm font-medium hover:bg-[#F9FAFB] transition-colors"
            >
              Publier une autre annonce
            </Link>
            <Link
              href="/"
              className="text-sm text-[#9CA3AF] hover:text-[#4B5563] transition-colors"
            >
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
