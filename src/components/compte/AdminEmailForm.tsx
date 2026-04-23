'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Config {
  api_key: string | null
  from_email: string
  from_name: string
  enabled: boolean
}

interface Props {
  initial: Config
}

export default function AdminEmailForm({ initial }: Props) {
  const supabase = createClient()
  const [form, setForm] = useState<Config>(initial)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  function update(field: keyof Config, value: unknown) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSave() {
    setSaving(true)
    setMsg(null)
    const { error } = await supabase
      .from('email_config')
      .update({
        api_key:    form.api_key || null,
        from_email: form.from_email,
        from_name:  form.from_name,
        enabled:    form.enabled,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1)
    setSaving(false)
    setMsg(error
      ? { type: 'error', text: error.message }
      : { type: 'success', text: 'Configuration sauvegardée.' }
    )
  }

  async function handleTest() {
    setTesting(true)
    setMsg(null)
    try {
      const res = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: form.api_key, from_email: form.from_email, from_name: form.from_name }),
      })
      const data = await res.json()
      setMsg(data.ok
        ? { type: 'success', text: 'Email de test envoyé avec succès.' }
        : { type: 'error', text: data.error ?? 'Échec de l\'envoi.' }
      )
    } catch {
      setMsg({ type: 'error', text: 'Erreur réseau.' })
    } finally {
      setTesting(false)
    }
  }

  const inputCls = "w-full border border-navy/15 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors bg-white"
  const labelCls = "block text-xs font-medium text-navy/55 mb-1.5"

  return (
    <div className="space-y-5">
      {msg && (
        <div className={`text-sm rounded-xl px-4 py-3 ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {msg.text}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-navy/08 p-5 space-y-4">
        <h2 className="text-xs font-medium text-navy/50 uppercase tracking-wider">Resend</h2>

        <div>
          <label className={labelCls}>Clé API Resend</label>
          <input
            type="password"
            value={form.api_key ?? ''}
            onChange={e => update('api_key', e.target.value || null)}
            placeholder="re_xxxxxxxxxxxx"
            autoComplete="new-password"
            className={inputCls}
          />
          <p className="text-[11px] text-navy/35 mt-1">
            Obtenez votre clé sur <span className="text-primary">resend.com/api-keys</span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Nom expéditeur</label>
            <input type="text" value={form.from_name} onChange={e => update('from_name', e.target.value)} className={inputCls} placeholder="Terranova" />
          </div>
          <div>
            <label className={labelCls}>Email expéditeur</label>
            <input type="email" value={form.from_email} onChange={e => update('from_email', e.target.value)} className={inputCls} placeholder="no-reply@terranova.fr" />
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-navy/08 hover:bg-navy/02 transition-colors">
          <input type="checkbox" checked={form.enabled} onChange={e => update('enabled', e.target.checked)} className="accent-primary w-4 h-4" />
          <div>
            <p className="text-sm font-medium text-navy">Activer les envois d'emails</p>
            <p className="text-xs text-navy/40">Les alertes prix seront envoyées dès que la queue est traitée.</p>
          </div>
        </label>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleTest}
          disabled={testing || !form.api_key}
          className="px-5 py-2.5 border border-navy/15 text-navy/60 rounded-xl text-sm font-medium hover:border-navy/30 transition-colors disabled:opacity-40"
        >
          {testing ? 'Envoi…' : 'Tester la connexion'}
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 bg-primary text-white rounded-xl py-2.5 text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-40"
        >
          {saving ? 'Sauvegarde…' : 'Sauvegarder'}
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
        <p className="text-xs font-medium text-amber-900">Variable d'environnement alternative</p>
        <p className="text-xs text-amber-700">
          Vous pouvez aussi définir <code className="bg-amber-100 px-1 rounded">RESEND_API_KEY</code> dans votre <code className="bg-amber-100 px-1 rounded">.env.local</code>.
          La clé DB a priorité si les deux sont présentes.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-navy/08 p-5">
        <h2 className="text-xs font-medium text-navy/50 uppercase tracking-wider mb-3">Déclencher manuellement</h2>
        <p className="text-xs text-navy/50 mb-3">
          Traite la queue des alertes prix sans attendre le cron.
          Nécessite <code className="bg-navy/05 px-1 rounded">CRON_SECRET</code> dans vos variables d'env.
        </p>
        <CronTrigger />
      </div>
    </div>
  )
}

function CronTrigger() {
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function run() {
    setRunning(true)
    setResult(null)
    const secret = prompt('Entrez le CRON_SECRET :')
    if (!secret) { setRunning(false); return }
    try {
      const res = await fetch('/api/cron/price-alerts', {
        method: 'POST',
        headers: { 'x-cron-secret': secret },
      })
      const data = await res.json()
      setResult(JSON.stringify(data, null, 2))
    } catch (e: any) {
      setResult(e.message)
    } finally {
      setRunning(false)
    }
  }

  return (
    <div>
      <button
        onClick={run}
        disabled={running}
        className="px-4 py-2 text-xs font-medium border border-navy/15 text-navy/60 rounded-lg hover:border-navy/30 transition-colors disabled:opacity-40"
      >
        {running ? 'Traitement…' : 'Lancer manuellement'}
      </button>
      {result && (
        <pre className="mt-3 text-[10px] bg-navy/04 rounded-xl p-3 text-navy/60 font-mono overflow-x-auto">{result}</pre>
      )}
    </div>
  )
}
