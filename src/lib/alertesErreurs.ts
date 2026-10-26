/**
 * lib/alertesErreurs.ts — Prévenir les admins par email quand quelque chose casse en production.
 *
 * Utilisé par src/instrumentation.ts (toute erreur serveur non rattrapée) et directement
 * par les points critiques qui rattrapent leurs erreurs (webhook Stripe, crons).
 * Anti-avalanche : une même erreur n'est signalée qu'une fois par 15 min et par instance,
 * et 20 emails maximum par heure.
 */
import { emailLayout, emailEyebrow, emailTitle, escHtml, sendEmail, getAdminRecipients } from '@/lib/emails'
import { SITE_NAME } from '@/lib/site'

const FENETRE_MS     = 15 * 60_000
const MAX_PAR_HEURE  = 20
const dejaSignalees  = new Map<string, number>()
let compteurHeure    = { debut: Date.now(), n: 0 }

export interface ErreurASignaler {
  /** D'où vient l'erreur, ex. « webhook Stripe », « cron new-biens », « GET /annonces » */
  source:   string
  erreur:   unknown
  /** Contexte non sensible (pas de données personnelles) */
  details?: Record<string, string | number | undefined>
}

export async function signalerErreur({ source, erreur, details }: ErreurASignaler): Promise<void> {
  try {
    if (process.env.NODE_ENV !== 'production') return

    const message = erreur instanceof Error ? erreur.message : String(erreur)
    const cle = `${source}|${message.slice(0, 200)}`
    const maintenant = Date.now()

    if ((dejaSignalees.get(cle) ?? 0) > maintenant - FENETRE_MS) return
    if (maintenant - compteurHeure.debut > 3_600_000) compteurHeure = { debut: maintenant, n: 0 }
    if (compteurHeure.n >= MAX_PAR_HEURE) return
    dejaSignalees.set(cle, maintenant)
    compteurHeure.n++

    const destinataires = getAdminRecipients()
    if (!destinataires.length) return

    const pile = erreur instanceof Error && erreur.stack ? erreur.stack.split('\n').slice(0, 8).join('\n') : ''
    const lignes = Object.entries(details ?? {})
      .filter(([, v]) => v !== undefined && v !== '')
      .map(([k, v]) => `<tr><td style="padding:2px 12px 2px 0;color:#64748B;font-size:12px;">${escHtml(k)}</td><td style="font-size:12px;color:#0F172A;">${escHtml(String(v))}</td></tr>`)
      .join('')

    await sendEmail({
      to: destinataires,
      subject: `⚠️ Erreur ${SITE_NAME} — ${source}`,
      html: emailLayout({
        content: `
          ${emailEyebrow('Erreur en production')}
          ${emailTitle(escHtml(source))}
          <p style="margin:0 0 16px;font-size:14px;color:#B91C1C;font-family:monospace;">${escHtml(message)}</p>
          ${lignes ? `<table style="margin-bottom:16px;">${lignes}</table>` : ''}
          ${pile ? `<pre style="font-size:11px;background:#F8F7F5;padding:12px;border-radius:8px;overflow:auto;white-space:pre-wrap;">${escHtml(pile)}</pre>` : ''}
          <p style="margin:16px 0 0;font-size:12px;color:#94A3B8;">Les erreurs identiques sont regroupées pendant 15 minutes. Détails complets dans les logs Vercel.</p>`,
        footer: `${SITE_NAME} — alerte automatique`,
      }),
    })
  } catch (err) {
    // Ne jamais faire échouer la requête à cause de l'alerte elle-même
    console.error('[alertesErreurs] envoi impossible:', err)
  }
}
