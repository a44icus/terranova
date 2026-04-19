'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/auth/reset-password',
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl text-navy">
            Terra<span className="text-primary italic">nova</span>
          </h1>
          <p className="text-sm text-navy/50 mt-2">Réinitialisation du mot de passe</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-navy/10 p-8">

          {success ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-7 h-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="font-serif text-xl text-navy">Vérifiez votre boîte mail</h2>
              <p className="text-sm text-navy/60">
                Un lien de réinitialisation a été envoyé à{' '}
                <strong className="text-navy">{email}</strong>.
                Pensez à vérifier vos spams si vous ne le trouvez pas.
              </p>
              <Link
                href="/auth/login"
                className="inline-block mt-2 text-sm text-primary hover:underline font-medium"
              >
                ← Retour à la connexion
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">

              <p className="text-sm text-navy/60">
                Saisissez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-navy/60 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="vous@exemple.fr"
                  className="w-full border border-navy/15 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white rounded-lg py-3 text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {loading ? 'Envoi en cours…' : 'Envoyer le lien'}
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
