'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { grantPlan } from './actions'
import type { PlanType } from '@/lib/types'

type GrantablePlan = 'gratuit' | 'pro_mensuel' | 'pro_annuel' | 'agence_mensuel' | 'agence_annuel'

const PLAN_STYLE: Record<string, string> = {
  gratuit:        'bg-navy/08 text-navy/50',
  pro_mensuel:    'bg-blue-50 text-blue-600',
  pro_annuel:     'bg-blue-50 text-blue-700',
  agence_mensuel: 'bg-primary/10 text-primary',
  agence_annuel:  'bg-primary/15 text-primary',
}

interface Props {
  userId: string
  currentPlan: string
  expireAt: string | null
  planLabels?: Record<string, string>
}

function addDays(n: number) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString()
}

export default function PlanGrantButton({ userId, currentPlan, expireAt, planLabels }: Props) {
  const label = (plan: string, suffix?: string) => {
    const base = planLabels?.[plan] ?? {
      gratuit: 'Gratuit', pro_mensuel: 'Pro', pro_annuel: 'Pro',
      agence_mensuel: 'Agence', agence_annuel: 'Agence',
    }[plan] ?? plan
    return suffix ? `${base} ${suffix}` : base
  }

  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open || !btnRef.current) return
    const r = btnRef.current.getBoundingClientRect()
    setPanelPos({ top: r.bottom + 6, left: r.left })
  }, [open])

  const isExpired = expireAt ? new Date(expireAt) < new Date() : false
  const expireLabel = expireAt
    ? isExpired
      ? `expiré ${new Date(expireAt).toLocaleDateString('fr-FR')}`
      : `jusqu'au ${new Date(expireAt).toLocaleDateString('fr-FR')}`
    : currentPlan !== 'gratuit' ? 'illimité' : null

  function apply(plan: GrantablePlan, expireAt: string | null) {
    startTransition(async () => {
      await grantPlan(userId, plan, expireAt)
      setOpen(false)
    })
  }

  const currentLabel = (() => {
    const base = planLabels?.[currentPlan]
    if (base) {
      if (currentPlan === 'pro_mensuel')    return `${base} (mensuel)`
      if (currentPlan === 'pro_annuel')     return `${base} (annuel)`
      if (currentPlan === 'agence_mensuel') return `${base} (mensuel)`
      if (currentPlan === 'agence_annuel')  return `${base} (annuel)`
      return base
    }
    return currentPlan
  })()

  return (
    <div className="relative">
      {/* Badge plan actuel */}
      <button
        ref={btnRef}
        onClick={() => setOpen(o => !o)}
        className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full transition-all border ${
          open ? 'border-primary/30 ring-2 ring-primary/10' : 'border-transparent hover:border-navy/15'
        } ${PLAN_STYLE[currentPlan] ?? PLAN_STYLE.gratuit}`}
      >
        {currentPlan !== 'gratuit' && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />}
        {currentLabel}
        {expireLabel && <span className="opacity-60 font-normal">· {expireLabel}</span>}
        <svg className={`w-3 h-3 opacity-50 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Panel débridage */}
      {open && (
        <div className="fixed z-50 bg-white rounded-2xl border border-navy/12 shadow-xl p-4 w-72"
          style={{ top: panelPos.top, left: panelPos.left }}>
          <p className="text-xs font-semibold text-navy/40 uppercase tracking-wider mb-3">Débridage du plan</p>

          <div className="space-y-1 mb-4">
            {/* Gratuit */}
            <button onClick={() => apply('gratuit', null)} disabled={pending}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-navy/04 transition-colors text-left group">
              <span className="text-sm text-navy/70 group-hover:text-navy">{label('gratuit')}</span>
              <span className="text-[10px] text-navy/35">Retirer l'accès</span>
            </button>

            {/* ── Pro ── */}
            <div className="border-t border-navy/06 pt-1 mt-1">
              <p className="text-[10px] font-semibold text-blue-500 uppercase tracking-wider px-3 pb-1">{label('pro_mensuel')}</p>
              <button onClick={() => apply('pro_mensuel', addDays(30))} disabled={pending}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl hover:bg-blue-50 transition-colors text-left">
                <span className="text-sm text-blue-600">Mensuel — 30 jours</span>
                <span className="text-[10px] text-blue-400">+30 j</span>
              </button>
              <button onClick={() => apply('pro_mensuel', addDays(90))} disabled={pending}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl hover:bg-blue-50 transition-colors text-left">
                <span className="text-sm text-blue-600">Mensuel — 3 mois</span>
                <span className="text-[10px] text-blue-400">+90 j</span>
              </button>
              <button onClick={() => apply('pro_annuel', addDays(365))} disabled={pending}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl hover:bg-blue-50 transition-colors text-left">
                <span className="text-sm text-blue-700 font-medium">Annuel — 1 an</span>
                <span className="text-[10px] text-blue-400">+365 j</span>
              </button>
              <button onClick={() => apply('pro_annuel', null)} disabled={pending}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl hover:bg-blue-50 border border-blue-100 transition-colors text-left">
                <span className="text-sm text-blue-700 font-semibold">Annuel ⚡ illimité</span>
                <span className="text-[10px] text-blue-400">∞</span>
              </button>
            </div>

            {/* ── Agence ── */}
            <div className="border-t border-navy/06 pt-1 mt-1">
              <p className="text-[10px] font-semibold text-primary uppercase tracking-wider px-3 pb-1">{label('agence_mensuel')}</p>
              <button onClick={() => apply('agence_mensuel', addDays(30))} disabled={pending}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl hover:bg-primary/05 transition-colors text-left">
                <span className="text-sm text-primary">Mensuel — 30 jours</span>
                <span className="text-[10px] text-primary/50">+30 j</span>
              </button>
              <button onClick={() => apply('agence_mensuel', addDays(90))} disabled={pending}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl hover:bg-primary/05 transition-colors text-left">
                <span className="text-sm text-primary">Mensuel — 3 mois</span>
                <span className="text-[10px] text-primary/50">+90 j</span>
              </button>
              <button onClick={() => apply('agence_annuel', addDays(365))} disabled={pending}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl hover:bg-primary/05 transition-colors text-left">
                <span className="text-sm text-primary font-medium">Annuel — 1 an</span>
                <span className="text-[10px] text-primary/50">+365 j</span>
              </button>
              <button onClick={() => apply('agence_annuel', null)} disabled={pending}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-primary/05 hover:bg-primary/10 border border-primary/15 transition-colors text-left">
                <span className="text-sm text-primary font-semibold">Annuel 🏆 illimité</span>
                <span className="text-[10px] text-primary/50">∞</span>
              </button>
            </div>
          </div>

          {/* Date personnalisée */}
          <div className="border-t border-navy/08 pt-3">
            <p className="text-[10px] text-navy/35 mb-2">Date personnalisée</p>
            <form onSubmit={e => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              const date = fd.get('date') as string
              const plan = fd.get('plan') as GrantablePlan
              if (date) apply(plan, new Date(date).toISOString())
            }} className="flex gap-2">
              <select name="plan" className="text-xs border border-navy/12 rounded-lg px-2 py-1.5 flex-shrink-0 focus:outline-none focus:border-primary bg-white">
                <option value="pro_mensuel">{label('pro_mensuel')} mensuel</option>
                <option value="pro_annuel">{label('pro_annuel')} annuel</option>
                <option value="agence_mensuel">{label('agence_mensuel')} mensuel</option>
                <option value="agence_annuel">{label('agence_annuel')} annuel</option>
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

      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
    </div>
  )
}
