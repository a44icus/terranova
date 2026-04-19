'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [sessionReady, setSessionReady] = useState(false)

  // Supabase injecte le token dans le hash de l'URL et gère l'échange
  // automatiquement via onAuthStateChange. On attend la session pour
  // s'assurer que updateUser sera autorisé.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setSessionReady(true)
      }
    })

    // Vérifier si une session existe déjà (token déjà échangé)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }

    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setTimeout(() => router.push('/compte'), 2000)
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl text-navy">
            Terra<span className="text-primary italic">nova</span>
          </h1>
          <p className="text-sm text-navy/50 mt-2">Nouveau mot de passe</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-navy/10 p-8">

          {success ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-7 h-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="font-serif text-xl text-navy">Mot de passe mis à jour !</h2>
              <p className="text-sm text-navy/60">
                Votre mot de passe a bien été modifié. Vous allez être redirigé vers votre compte…
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">

              {!sessionReady && (
                <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-lg px-4 py-3">
                  Vérification du lien en cours…
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-navy/60 mb-2">
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="6 caractères minimum"
                  disabled={!sessionReady}
                  className="w-full border border-navy/15 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors disabled:opacity-50 disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-navy/60 mb-2">
                  Confirmer le mot de passe
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                  placeholder="••••••••"
                  disabled={!sessionReady}
                  className="w-full border border-navy/15 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors disabled:opacity-50 disabled:bg-gray-50"
                />
                {confirm && password !== confirm && (
                  <p className="text-xs text-red-500 mt-1.5">Les mots de passe ne correspondent pas.</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !sessionReady}
                className="w-full bg-primary text-white rounded-lg py-3 text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {loading ? 'Mise à jour…' : 'Mettre à jour le mot de passe'}
              </button>

            </form>
          )}

        </div>

        {!success && (
          <div className="mt-5 text-center text-sm text-navy/50">
            <Link href="/auth/login" className="text-primary hover:underline font-medium">
              ← Retour à la connexion
            </Link>
          </div>
        )}

      </div>
    </div>
  )
}
