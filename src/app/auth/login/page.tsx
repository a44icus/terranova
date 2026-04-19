'use client'

import { Suspense, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email ou mot de passe incorrect')
      setLoading(false)
      return
    }

    router.push(redirect)
    router.refresh()
  }

  return (
    <form onSubmit={handleLogin} className="space-y-5">

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

      <div>
        <label className="block text-xs font-medium text-navy/60 mb-2">
          Mot de passe
        </label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          placeholder="••••••••"
          className="w-full border border-navy/15 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      <div className="flex justify-end -mt-2">
        <Link href="/auth/forgot-password" className="text-xs text-primary hover:underline">
          Mot de passe oublié ?
        </Link>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-navy text-white rounded-lg py-3 text-sm font-medium hover:bg-primary transition-colors disabled:opacity-50"
      >
        {loading ? 'Connexion…' : 'Se connecter'}
      </button>

    </form>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl text-navy">
            Terra<span className="text-primary italic">nova</span>
          </h1>
          <p className="text-sm text-navy/50 mt-2">Connectez-vous à votre compte</p>
        </div>

        {/* Carte */}
        <div className="bg-white rounded-2xl shadow-sm border border-navy/10 p-8">
          <Suspense fallback={<div className="h-48 animate-pulse bg-navy/05 rounded-xl" />}>
            <LoginForm />
          </Suspense>

          <div className="mt-6 text-center text-sm text-navy/50">
            Pas encore de compte ?{' '}
            <Link href="/auth/register" className="text-primary hover:underline font-medium">
              S'inscrire
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}
