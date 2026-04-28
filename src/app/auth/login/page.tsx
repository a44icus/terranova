'use client'

import { Suspense, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import GoogleAuthButton from '@/components/auth/GoogleAuthButton'

/** Valide que le chemin de redirection est interne (pas d'open-redirect) */
function safeRedirect(raw: string | null): string {
  if (!raw) return '/'
  // Doit commencer par '/' mais pas '//' (qui serait interprété comme URL externe)
  if (raw.startsWith('/') && !raw.startsWith('//')) return raw
  return '/'
}

const MAX_ATTEMPTS = 5        // tentatives avant verrouillage
const LOCKOUT_MS   = 30_000  // 30 secondes

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = safeRedirect(searchParams.get('redirect'))

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [lockedUntil, setLockedUntil] = useState<number | null>(null)

  const attempts = useRef(0)
  const supabase = createClient()

  function remainingSeconds() {
    if (!lockedUntil) return 0
    return Math.ceil((lockedUntil - Date.now()) / 1000)
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()

    // Vérifier le verrouillage
    if (lockedUntil && Date.now() < lockedUntil) {
      setError(`Trop de tentatives. Réessayez dans ${remainingSeconds()} secondes.`)
      return
    }

    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      attempts.current += 1
      if (attempts.current >= MAX_ATTEMPTS) {
        const until = Date.now() + LOCKOUT_MS
        setLockedUntil(until)
        attempts.current = 0
        // Mettre à jour le message après chaque seconde
        const interval = setInterval(() => {
          const secs = Math.ceil((until - Date.now()) / 1000)
          if (secs <= 0) {
            clearInterval(interval)
            setLockedUntil(null)
            setError('')
          } else {
            setError(`Trop de tentatives. Réessayez dans ${secs} secondes.`)
          }
        }, 1000)
        setError(`Trop de tentatives. Réessayez dans ${LOCKOUT_MS / 1000} secondes.`)
      } else {
        setError('Email ou mot de passe incorrect')
      }
      setLoading(false)
      return
    }

    attempts.current = 0
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
        disabled={loading || (!!lockedUntil && Date.now() < lockedUntil)}
        className="w-full bg-navy text-white rounded-lg py-3 text-sm font-medium hover:bg-primary transition-colors disabled:opacity-50"
      >
        {loading ? 'Connexion…' : 'Se connecter'}
      </button>

    </form>
  )
}

export default function LoginPage() {
  return (
    <div className="w-full max-w-md">

      <div className="text-center mb-8">
        <h2 className="font-serif text-3xl text-navy">Connexion</h2>
        <p className="text-sm text-navy/50 mt-2">Connectez-vous à votre compte</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-navy/10 p-8">
        <GoogleAuthButton label="Continuer avec Google" />

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-navy/10" />
          <span className="text-xs text-navy/35">ou</span>
          <div className="flex-1 h-px bg-navy/10" />
        </div>

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
  )
}
