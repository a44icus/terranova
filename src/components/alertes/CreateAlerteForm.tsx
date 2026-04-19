'use client'
import { useState, useTransition } from 'react'
import { createAlerte } from '@/app/api/alertes/actions'

const TYPES = [{ value: '', label: 'Tout' }, { value: 'vente', label: 'Vente' }, { value: 'location', label: 'Location' }]
const CATS = [
  { value: '', label: 'Toutes' },
  { value: 'appartement', label: 'Appartement' },
  { value: 'maison', label: 'Maison' },
  { value: 'bureau', label: 'Bureau' },
  { value: 'terrain', label: 'Terrain' },
]

export default function CreateAlerteForm({ userEmail }: { userEmail: string }) {
  const [pending, startTransition] = useTransition()
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ type: '', categorie: '', ville: '', prix_max: '', surface_min: '' })

  function update(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  function handleSubmit() {
    setError('')
    startTransition(async () => {
      const res = await createAlerte({
        type: form.type || undefined,
        categorie: form.categorie || undefined,
        ville: form.ville || undefined,
        prix_max: form.prix_max ? parseInt(form.prix_max) : undefined,
        surface_min: form.surface_min ? parseInt(form.surface_min) : undefined,
      })
      if (res.error) { setError(res.error); return }
      setSuccess(true)
      setForm({ type: '', categorie: '', ville: '', prix_max: '', surface_min: '' })
      setTimeout(() => setSuccess(false), 3000)
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-[#0F172A]/50 mb-1.5">Type</label>
          <select value={form.type} onChange={e => update('type', e.target.value)}
            className="w-full border border-[#0F172A]/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4F46E5]">
            {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#0F172A]/50 mb-1.5">Catégorie</label>
          <select value={form.categorie} onChange={e => update('categorie', e.target.value)}
            className="w-full border border-[#0F172A]/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4F46E5]">
            {CATS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#0F172A]/50 mb-1.5">Ville</label>
          <input type="text" value={form.ville} onChange={e => update('ville', e.target.value)}
            placeholder="Paris, Lyon…"
            className="w-full border border-[#0F172A]/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4F46E5]" />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#0F172A]/50 mb-1.5">Prix max (€)</label>
          <input type="number" value={form.prix_max} onChange={e => update('prix_max', e.target.value)}
            placeholder="300000"
            className="w-full border border-[#0F172A]/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4F46E5]" />
        </div>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
      {success && <p className="text-xs text-green-600">✓ Alerte créée ! Vous serez notifié par email.</p>}

      <button onClick={handleSubmit} disabled={pending}
        className="bg-[#4F46E5] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#4338CA] transition-colors disabled:opacity-40">
        {pending ? 'Création…' : '🔔 Créer l\'alerte'}
      </button>
    </div>
  )
}



