'use client'

import { useState, useTransition } from 'react'
import { grantPlan } from './actions'

const PLAN_LABEL: Record<string, string> = {
  gratuit:     'Gratuit',
  pro_mensuel: 'Pro mensuel',
  pro_annuel:  'Pro annuel',
}

const PLAN_STYLE: Record<string, string> = {
  gratuit:     'bg-navy/08 text-navy/50',
  pro_mensuel: 'bg-blue-50 text-blue-600',
  pro_annuel:  'bg-primary/10 text-primary',
}

interface Props {
  userId: string
  currentPlan: string
  expireAt: string | null
}

function addDays(n: number) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString()
}

export default function PlanGrantButton({ userId, currentPlan, expireAt }: Props) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const isExpired = expireAt ? new Date(expireAt) < new Date() : false
  const expireLabel = expireAt
    ? isExpired
      ? `expiré ${new Date(expireAt).toLocaleDateString('fr-FR')}`
      : `jusqu'au ${new Date(expireAt).toLocaleDateString('fr-FR')}`
    : currentPlan !== 'gratuit' ? 'illimité' : null

  function apply(plan: 'gratuit' | 'pro_mensuel' | 'pro_annuel', expireAt: string | null) {
    startTransition(async () => {
      await grantPlan(userId, plan, expireAt)
      setOpen(false)
    })
  }

  return (
    <div className="relative">
      {/* Badge plan actuel */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full transition-all border ${
          open ? 'border-primary/30 ring-2 ring-primary/10' : 'border-transparent hover:border-navy/15'
        } ${PLAN_STYLE[currentPlan] ?? PLAN_STYLE.gratuit}`}
      >
        {currentPlan !== 'gratuit' && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />}
        {PLAN_LABEL[currentPlan] ?? currentPlan}
        {expireLabel && <span className="opacity-60 font-normal">· {expireLabel}</span>}
        <svg className={`w-3 h-3 opacity-50 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Panel débridage */}
      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 bg-white rounded-2xl border border-navy/12 shadow-xl p-4 w-64">
          <p className="text-xs font-semibold text-navy/40 uppercase tracking-wider mb-3">Débridage du plan</p>

          <div className="space-y-1.5 mb-4">
            {/* Gratuit */}
            <button onClick={() => apply('gratuit', null)} disabled={pending}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-navy/04 transition-colors text-left group">
              <span className="text-sm text-navy/70 group-hover:text-navy">Gratuit</span>
              <span className="text-[10px] text-navy/35">Retirer l'accès</span>
            </button>

            {/* Pro 30 jours */}
            <button onClick={() => apply('pro_mensuel', addDays(30))} disabled={pending}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-blue-50 transition-colors text-left group">
              <div>
                <span className="text-sm text-blue-600 font-medium">Pro mensuel</span>
                <span className="text-[10px] text-navy/40 ml-2">30 jours</span>
              </div>
              <span className="text-[10px] text-blue-400">+30 j</span>
            </button>

            {/* Pro 3 mois */}
            <button onClick={() => apply('pro_mensuel', addDays(90))} disabled={pending}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-blue-50 transition-colors text-left group">
              <div>
                <span className="text-sm text-blue-600 font-medium">Pro mensuel</span>
                <span className="text-[10px] text-navy/40 ml-2">3 mois</span>
              </div>
              <span className="text-[10px] text-blue-400">+90 j</span>
            </button>

            {/* Pro 1 an */}
            <button onClick={() => apply('pro_annuel', addDays(365))} disabled={pending}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-primary/05 transition-colors text-left group">
              <div>
                <span className="text-sm text-primary font-medium">Pro annuel</span>
                <span className="text-[10px] text-navy/40 ml-2">1 an</span>
              </div>
              <span className="text-[10px] text-primary/60">+365 j</span>
            </button>

            {/* Pro illimité */}
            <button onClick={() => apply('pro_annuel', null)} disabled={pending}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-primary/05 hover:bg-primary/10 transition-colors text-left group border border-primary/15">
              <span className="text-sm text-primary font-semibold">Pro illimité ⚡</span>
              <span className="text-[10px] text-primary/60">Sans expiration</span>
            </button>
          </div>

          {/* Date personnalisée */}
          <div className="border-t border-navy/08 pt-3">
            <p className="text-[10px] text-navy/35 mb-2">Date personnalisée</p>
            <form onSubmit={e => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              const date = fd.get('date') as string
              const plan = fd.get('plan') as 'pro_mensuel' | 'pro_annuel'
              if (date) apply(plan, new Date(date).toISOString())
            }} className="flex gap-2">
              <select name="plan" className="text-xs border border-navy/12 rounded-lg px-2 py-1.5 flex-shrink-0 focus:outline-none focus:border-primary bg-white">
                <option value="pro_mensuel">Mensuel</option>
                <option value="pro_annuel">Annuel</option>
              </select>
              <input type="date" name="date" min={new Date().toISOString().split('T')[0]}
                className="flex-1 text-xs border border-navy/12 rounded-lg px-2 py-1.5 focus:outline-none focus:border-primary" />
              <button type="submit" disabled={pending}
                className="text-xs bg-navy text-white px-2.5 py-1.5 rounded-lg hover:bg-primary transition-colors flex-shrink-0">
                OK
              </button>
            </form>
          </div>

          {pending && <p className="text-[10px] text-navy/40 text-center mt-2">Mise à jour…</p>}
        </div>
      )}

      {/* Overlay fermeture */}
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
    </div>
  )
}
