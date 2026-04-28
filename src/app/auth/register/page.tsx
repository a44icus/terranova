'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { UserType } from '@/lib/types'
import GoogleAuthButton from '@/components/auth/GoogleAuthButton'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    type: 'particulier' as UserType,
    nom: '',
    prenom: '',
    email: '',
    password: '',
    telephone: '',
    agence: '',
  })

  function update(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          nom: form.nom,
          prenom: form.prenom,
          type: form.type,
        },
        emailRedirectTo: `${location.origin}/auth/callback`,
      }
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Mettre à jour les champs supplémentaires
    if (data.user) {
      // Attendre que le trigger ait créé le profil
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          nom: form.nom,
          prenom: form.prenom,
          type: form.type,
          telephone: form.telephone || null,
          agence: form.type === 'pro' ? form.agence || null : null,
        })
    }

    setSuccess(true)
  }

  if (success) {
    return (
      <div className="w-full max-w-md text-center">
        <div className="text-5xl mb-4">📬</div>
        <h2 className="font-serif text-2xl text-navy mb-3">Vérifiez votre email</h2>
        <p className="text-sm text-navy/60">
          Un lien de confirmation a été envoyé à <strong>{form.email}</strong>.
          Cliquez dessus pour activer votre compte.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">

      <div className="text-center mb-8">
        <h2 className="font-serif text-3xl text-navy">Inscription</h2>
        <p className="text-sm text-navy/50 mt-2">Créez votre compte gratuitement</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-navy/10 p-8">

          <GoogleAuthButton label="S'inscrire avec Google" />

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-navy/10" />
            <span className="text-xs text-navy/35">ou</span>
            <div className="flex-1 h-px bg-navy/10" />
          </div>

          {/* Type de compte */}
          <div className="flex gap-3 mb-6">
            {(['particulier', 'pro'] as UserType[]).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => update('type', t)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                  form.type === t
                    ? 'bg-navy text-white border-navy'
                    : 'bg-white text-navy/60 border-navy/15 hover:border-navy/30'
                }`}
              >
                {t === 'particulier' ? '👤 Particulier' : '🏢 Professionnel'}
              </button>
            ))}
          </div>

          <form onSubmit={handleRegister} className="space-y-4">

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-navy/60 mb-1.5">Prénom</label>
                <input
                  type="text" required value={form.prenom}
                  onChange={e => update('prenom', e.target.value)}
                  className="w-full border border-navy/15 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-navy/60 mb-1.5">Nom</label>
                <input
                  type="text" required value={form.nom}
                  onChange={e => update('nom', e.target.value)}
                  className="w-full border border-navy/15 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            {form.type === 'pro' && (
              <div>
                <label className="block text-xs font-medium text-navy/60 mb-1.5">Nom de l'agence</label>
                <input
                  type="text" value={form.agence}
                  onChange={e => update('agence', e.target.value)}
                  placeholder="Agence Dupont Immobilier"
                  className="w-full border border-navy/15 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-navy/60 mb-1.5">Email</label>
              <input
                type="email" required value={form.email}
                onChange={e => update('email', e.target.value)}
                placeholder="vous@exemple.fr"
                className="w-full border border-navy/15 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-navy/60 mb-1.5">Téléphone</label>
              <input
                type="tel" value={form.telephone}
                onChange={e => update('telephone', e.target.value)}
                placeholder="06 00 00 00 00"
                className="w-full border border-navy/15 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-navy/60 mb-1.5">Mot de passe</label>
              <input
                type="password" required value={form.password}
                onChange={e => update('password', e.target.value)}
                placeholder="8 caractères minimum"
                minLength={8}
                className="w-full border border-navy/15 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white rounded-lg py-3 text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? 'Création du compte…' : 'Créer mon compte'}
            </button>

          </form>

          <div className="mt-6 text-center text-sm text-navy/50">
            Déjà un compte ?{' '}
            <Link href="/auth/login" className="text-primary hover:underline font-medium">
              Se connecter
            </Link>
          </div>

        </div>

      <p className="text-center text-xs text-navy/35 mt-4">
        En créant un compte vous acceptez nos conditions d'utilisation
      </p>

    </div>
  )
}