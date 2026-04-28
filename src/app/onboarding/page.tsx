'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { UserType } from '@/lib/types'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()

  const [type, setType] = useState<UserType>('particulier')
  const [agence, setAgence] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userName, setUserName] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/auth/login'); return }
      const name = user.user_metadata?.full_name ?? user.user_metadata?.name ?? ''
      setUserName(name.split(' ')[0] ?? '')
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/auth/login'); return }

    const { error: err } = await supabase
      .from('profiles')
      .update({
        type,
        agence: type === 'pro' ? agence || null : null,
      })
      .eq('id', user.id)

    if (err) {
      setError('Une erreur est survenue, veuillez réessayer.')
      setLoading(false)
      return
    }

    router.push('/compte')
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">👋</div>
            <h2 className="font-serif text-3xl text-navy">
              {userName ? `Bienvenue, ${userName} !` : 'Bienvenue !'}
            </h2>
            <p className="text-sm text-navy/50 mt-2">
              Une dernière étape avant d'accéder à votre compte.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-navy/10 p-8">
            <form onSubmit={handleSubmit} className="space-y-6">

              <div>
                <p className="text-sm font-medium text-navy mb-3">Quel type de compte souhaitez-vous ?</p>
                <div className="flex gap-3">
                  {(['particulier', 'pro'] as UserType[]).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`flex-1 py-3 rounded-xl text-sm font-medium border-2 transition-all ${
                        type === t
                          ? 'bg-navy text-white border-navy'
                          : 'bg-white text-navy/60 border-navy/15 hover:border-navy/30'
                      }`}
                    >
                      {t === 'particulier' ? '👤 Particulier' : '🏢 Professionnel'}
                    </button>
                  ))}
                </div>

                <div className={`mt-3 text-xs rounded-xl px-4 py-3 leading-relaxed transition-colors ${
                  type === 'particulier'
                    ? 'bg-navy/04 text-navy/50'
                    : 'bg-primary/06 text-primary/80'
                }`}>
                  {type === 'particulier'
                    ? 'Pour acheter, louer ou vendre votre bien en tant que particulier.'
                    : 'Pour les agents immobiliers, agences et réseaux. Accès aux fonctionnalités pro.'}
                </div>
              </div>

              {type === 'pro' && (
                <div>
                  <label className="block text-xs font-medium text-navy/60 mb-1.5">
                    Nom de l'agence <span className="text-navy/35">(optionnel)</span>
                  </label>
                  <input
                    type="text"
                    value={agence}
                    onChange={e => setAgence(e.target.value)}
                    placeholder="Agence Dupont Immobilier"
                    className="w-full border border-navy/15 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl py-3 text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {loading ? 'Enregistrement…' : 'Accéder à mon compte →'}
              </button>

            </form>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
