/**
 * lib/emails — Tout ce qui sert à fabriquer et envoyer un email.
 *
 *   escHtml       échappe une valeur utilisateur avant de l'insérer dans le HTML
 *   emailLayout   cadre commun (en-tête logo, carte blanche, pied de page) : la charte
 *                 graphique des emails se modifie ici et nulle part ailleurs
 *   emailButton   bouton d'appel à l'action
 *   sendEmail     envoi via l'API Resend
 *   getDbEmailConfig  config saisie dans l'admin (table email_config)
 */
import { createAdminClient } from '@/lib/supabase/admin'
import { SITE_NAME, SITE_URL, siteEmail } from '@/lib/site'

// ── Échappement ──────────────────────────────────────────────────────────────

/** Échappe les caractères HTML dangereux. Les valeurs non textuelles (hors nombres) donnent ''. */
export function escHtml(s: unknown): string {
  if (typeof s !== 'string' && typeof s !== 'number') return ''
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#x27;')
}

/** Échappe un texte multi-lignes et convertit les retours à la ligne en <br/>. */
export function escHtmlMultiline(s: unknown): string {
  return escHtml(s).replace(/\n/g, '<br/>')
}

/** Validation basique d'une adresse email saisie par un utilisateur. */
export function isEmail(v: unknown): v is string {
  return typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && v.length <= 254
}

// ── Charte ───────────────────────────────────────────────────────────────────

export const EMAIL_COLORS = {
  navy:    '#0F172A',
  primary: '#4F46E5',
  text:    '#334155',
  muted:   '#64748B',
  faint:   '#94A3B8',
  border:  '#E2E0DB',
  bg:      '#F8F7F5',
} as const

const C = EMAIL_COLORS

interface LayoutOptions {
  /** Titre du document (onglet du client mail) */
  title?:   string
  /** Contenu principal, déjà échappé */
  content:  string
  /** Texte du pied de page (HTML déjà échappé). Par défaut : nom du site. */
  footer?:  string
}

/** Cadre commun de tous les emails. */
export function emailLayout({ title, content, footer }: LayoutOptions): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escHtml(title ?? SITE_NAME)}</title>
</head>
<body style="margin:0;padding:0;background:${C.bg};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid ${C.border};">
        <tr>
          <td style="background:${C.navy};padding:24px 32px;">
            <a href="${SITE_URL}" style="text-decoration:none;font-family:Georgia,serif;font-size:24px;color:#FFFFFF;letter-spacing:0.04em;">
              Jazz<span style="color:${C.primary};font-style:italic;">Immo</span>
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            ${content}
          </td>
        </tr>
        <tr>
          <td style="background:${C.bg};padding:20px 32px;border-top:1px solid ${C.border};">
            <p style="margin:0;font-size:11px;color:${C.faint};text-align:center;">
              ${footer ?? `${SITE_NAME} — Plateforme immobilière`}
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

/** Petit intitulé en capitales au-dessus du titre. */
export function emailEyebrow(text: string): string {
  return `<p style="margin:0 0 8px;font-size:13px;color:${C.muted};font-weight:500;text-transform:uppercase;letter-spacing:0.08em;">${text}</p>`
}

/** Titre principal. */
export function emailTitle(html: string): string {
  return `<h1 style="margin:0 0 20px;font-family:Georgia,serif;font-size:22px;color:${C.navy};line-height:1.3;">${html}</h1>`
}

/** Citation d'un message (barre de couleur à gauche). */
export function emailQuote(html: string): string {
  return `<div style="background:${C.bg};border-left:3px solid ${C.primary};border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:24px;">
  <p style="margin:0;font-size:14px;color:${C.text};line-height:1.7;font-style:italic;">${html}</p>
</div>`
}

/**
 * Tableau « libellé : valeur » sur fond gris. Les lignes sans valeur sont omises.
 * Les valeurs sont du HTML déjà échappé (pour permettre des liens mailto:).
 */
export function emailFields(rows: Array<[label: string, valueHtml: string]>, heading?: string): string {
  const lignes = rows
    .filter(([, v]) => v)
    .map(([l, v]) => `<tr><td style="padding-bottom:6px;">
      <span style="font-size:13px;color:${C.muted};">${l}&nbsp;&nbsp;</span>
      <span style="font-size:13px;color:${C.navy};font-weight:600;">${v}</span>
    </td></tr>`)
    .join('')
  return `<table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;">
  ${heading ? `<tr><td style="padding-bottom:10px;"><span style="font-size:12px;color:${C.faint};font-weight:500;text-transform:uppercase;letter-spacing:0.06em;">${heading}</span></td></tr>` : ''}
  <tr><td style="padding:12px 16px;background:${C.bg};border-radius:8px;">
    <table cellpadding="0" cellspacing="0">${lignes}</table>
  </td></tr>
</table>`
}

/** Lien mailto: prêt à insérer dans emailFields. */
export function emailMailto(email: string): string {
  const e = escHtml(email)
  return `<a href="mailto:${e}" style="color:${C.primary};text-decoration:none;font-weight:500;">${e}</a>`
}

/** Bouton principal ou secondaire. `href` doit être une URL sûre (construite côté serveur). */
export function emailButton(href: string, label: string, variant: 'primary' | 'secondary' = 'primary'): string {
  return variant === 'primary'
    ? `<td style="background:${C.primary};border-radius:10px;"><a href="${href}" style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:10px;">${label}</a></td>`
    : `<td style="border:1px solid ${C.border};border-radius:10px;"><a href="${href}" style="display:inline-block;padding:11px 20px;font-size:13px;font-weight:500;color:${C.navy};text-decoration:none;border-radius:10px;">${label}</a></td>`
}

/** Rangée de boutons (résultats de emailButton). */
export function emailButtons(...buttons: string[]): string {
  return `<table cellpadding="0" cellspacing="0"><tr>${buttons.join('<td style="width:12px;"></td>')}</tr></table>`
}

// ── Envoi ────────────────────────────────────────────────────────────────────

/** Expéditeur par défaut : « JazzImmo <notifications@JazzImmo.fr> ». */
export const DEFAULT_FROM = `${SITE_NAME} <${siteEmail('notifications')}>`

export interface SendEmailOptions {
  to:       string | string[]
  subject:  string
  html:     string
  replyTo?: string
  /** Expéditeur, utilisé avec RESEND_API_KEY. Avec la config admin, c'est son expéditeur qui prime. */
  from?:    string
  /** Clé Resend explicite (test de config, crons). Par défaut : voir resolveSender(). */
  apiKey?:  string
}

interface Sender { apiKey: string; from?: string }

/**
 * Clé et expéditeur à utiliser, dans cet ordre :
 *   1. la config saisie dans l'admin (/compte/admin/email), si elle a une clé et est activée ;
 *   2. la variable d'environnement RESEND_API_KEY.
 * Avec la config admin, on prend aussi son expéditeur : son domaine est celui que la clé
 * a validé chez Resend.
 */
async function resolveSender(): Promise<Sender | null> {
  try {
    const db = await getDbEmailConfig()
    if (db?.enabled) return { apiKey: db.apiKey, from: db.from }
  } catch {
    // table absente ou inaccessible : on passe à la variable d'environnement
  }
  const env = process.env.RESEND_API_KEY
  return env ? { apiKey: env } : null
}

/** true si un email peut être envoyé (config admin activée ou RESEND_API_KEY). */
export async function isEmailConfigured(): Promise<boolean> {
  return (await resolveSender()) !== null
}

export interface SendEmailResult {
  ok:       boolean
  /** true si aucune clé n'est configurée (rien n'a été tenté) */
  skipped?: boolean
  error?:   string
}

/** Envoie un email via l'API Resend. Ne lève jamais : l'échec est dans le résultat. */
export async function sendEmail(opts: SendEmailOptions): Promise<SendEmailResult> {
  const sender: Sender | null = opts.apiKey ? { apiKey: opts.apiKey, from: opts.from } : await resolveSender()
  if (!sender) {
    console.warn(`[Email] Aucune clé Resend, email non envoyé : ${opts.subject}`)
    return { ok: false, skipped: true }
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${sender.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from:     sender.from ?? opts.from ?? DEFAULT_FROM,
        to:       Array.isArray(opts.to) ? opts.to : [opts.to],
        subject:  opts.subject,
        html:     opts.html,
        ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
      }),
    })
    if (!res.ok) {
      const error = await res.text()
      console.error('[Email] Resend error:', res.status, error)
      return { ok: false, error }
    }
    return { ok: true }
  } catch (err) {
    console.error('[Email] Erreur réseau:', err)
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

/** Liste des destinataires admin (ADMIN_EMAILS). */
export function getAdminRecipients(): string[] {
  return (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean)
}

export interface DbEmailConfig {
  apiKey:  string
  from:    string
  enabled: boolean
}

/**
 * Config saisie dans l'admin (/compte/admin/email, table email_config).
 * Retourne null si la table est vide ou sans clé.
 */
export async function getDbEmailConfig(): Promise<DbEmailConfig | null> {
  const { data } = await createAdminClient()
    .from('email_config')
    .select('api_key, from_email, from_name, enabled')
    .eq('id', 1)
    .single()
  if (!data?.api_key) return null
  return {
    apiKey:  data.api_key,
    from:    `${data.from_name || SITE_NAME} <${data.from_email || siteEmail('notifications')}>`,
    enabled: data.enabled === true,
  }
}
