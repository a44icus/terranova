import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PublierForm from '@/components/PublierForm'
import Link from 'next/link'
import { getPlanConfig, getEffectivePlan } from '@/lib/plan'
import type { PlanType } from '@/lib/types'

export default async function PublierPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login?redirect=/publier')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Vérification de la limite côté serveur
  const planConfig = await getPlanConfig()
  const effectivePlan = getEffectivePlan(
    profile?.plan as PlanType ?? 'gratuit',
    profile?.plan_expire_at
  )
  const limite = planConfig[effectivePlan]
  const annoncesActives = profile?.annonces_actives ?? 0
  const limitAtteinte = annoncesActives >= limite.annonces

  if (limitAtteinte) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <div className="bg-[#0F172A] text-white px-6 py-4 flex items-center justify-between">
          <h1 className="font-serif text-xl">Publier un bien</h1>
          <Link href="/compte" className="text-white/50 hover:text-white text-sm">✕ Annuler</Link>
        </div>

        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="font-serif text-2xl text-[#0F172A] mb-2">Limite atteinte</h2>
          <p className="text-[#0F172A]/60 text-sm mb-2">
            Votre plan <strong>{effectivePlan === 'gratuit' ? 'Gratuit' : effectivePlan === 'pro_mensuel' ? 'Pro Mensuel' : 'Pro Annuel'}</strong> autorise{' '}
            <strong>{limite.annonces} annonce{limite.annonces > 1 ? 's' : ''}</strong> simultanée{limite.annonces > 1 ? 's' : ''}.
          </p>
          <p className="text-[#0F172A]/60 text-sm mb-8">
            Vous avez actuellement <strong>{annoncesActives} annonce{annoncesActives > 1 ? 's' : ''} active{annoncesActives > 1 ? 's' : ''}</strong>.
            Archivez une annonce existante ou passez à un plan supérieur.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/compte/plan"
              className="bg-[#4F46E5] text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-[#4338CA] transition-colors"
            >
              ⭐ Passer Pro →
            </Link>
            <Link
              href="/compte/mes-annonces"
              className="border border-[#0F172A]/15 text-[#0F172A]/70 px-6 py-3 rounded-xl text-sm font-medium hover:border-[#0F172A]/30 transition-colors"
            >
              Gérer mes annonces
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return <PublierForm profile={profile} />
}
