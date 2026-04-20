'use client'

import { useState } from 'react'
import { useMapStore } from '@/store/mapStore'
import { createAlerte } from '@/app/api/alertes/actions'

type State = 'idle' | 'saving' | 'saved' | 'error' | 'login'

export default function SaveSearchButton() {
  const { filtres } = useMapStore()
  const [state, setState] = useState<State>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  // Résume la recherche courante en label lisible
  const parts: string[] = []
  if (filtres.type !== 'all') parts.push(filtres.type === 'vente' ? 'Vente' : 'Location')
  if (filtres.categorie) parts.push(filtres.categorie)
  if (filtres.ville) parts.push(filtres.ville)
  if (filtres.prixMax < 5000000) parts.push(`< ${(filtres.prixMax / 1000).toFixed(0)} k€`)
  if (filtres.surface) parts.push(`${filtres.surface} m²`)
  const label = parts.length ? parts.join(' · ') : 'Tous les biens'

  async function handleSave() {
    setState('saving')
    setErrorMsg('')

    const res = await createAlerte({
      type: filtres.type !== 'all' ? filtres.type : undefined,
      categorie: filtres.categorie || undefined,
      ville: filtres.ville || undefined,
      prix_max: filtres.prixMax < 5000000 ? filtres.prixMax : undefined,
      surface_min: filtres.surface
        ? parseInt(filtres.surface.split('-')[0]) || undefined
        : undefined,
    })

    if (res.error) {
      if (res.error.toLowerCase().includes('auth') || res.error.toLowerCase().includes('email')) {
        setState('login')
      } else {
        setState('error')
        setErrorMsg(res.error)
      }
    } else {
      setState('saved')
      setTimeout(() => setState('idle'), 4000)
    }
  }

  return (
    <div className="px-3 py-2.5 border-b border-navy/10 bg-white">
      {state === 'saved' ? (
        <div className="flex items-center gap-2 w-full py-2 px-3 rounded-lg bg-emerald-50 border border-emerald-200">
          <svg className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
          </svg>
          <span className="text-[11px] font-medium text-emerald-700">
            Alerte créée — vous serez notifié par e-mail
          </span>
        </div>
      ) : state === 'login' ? (
        <div className="text-[11px] text-center text-navy/50 py-1">
          <a href="/auth/login" className="text-primary font-medium hover:underline">Connectez-vous</a>
          {' '}pour sauvegarder cette recherche
        </div>
      ) : (
        <button
          onClick={handleSave}
          disabled={state === 'saving'}
          className="w-full flex items-center gap-2.5 py-2 px-3 rounded-lg border transition-all text-[11px] font-medium
            border-[#4F46E5]/25 text-[#4F46E5] hover:bg-[#4F46E5]/08 disabled:opacity-50"
          style={{ background: 'rgba(79,70,229,0.04)' }}
        >
          {state === 'saving' ? (
            <svg className="w-3.5 h-3.5 animate-spin flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
            </svg>
          )}
          <span className="flex-1 text-left">
            {state === 'saving' ? 'Enregistrement…' : 'Recevoir des alertes pour cette recherche'}
          </span>
        </button>
      )}
      {/* Label de la recherche courante */}
      {state === 'idle' && (
        <p className="text-[10px] text-navy/30 mt-1.5 px-1 truncate">{label}</p>
      )}
      {state === 'error' && (
        <p className="text-[10px] text-red-500 mt-1 px-1">{errorMsg}</p>
      )}
    </div>
  )
}
