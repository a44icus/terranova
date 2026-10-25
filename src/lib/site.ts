/**
 * lib/site.ts — Identité du site, en un seul endroit.
 *
 * Le dossier s'appelle terranova pour des raisons historiques ; la marque est JazzImmo.
 * Utilisable côté serveur comme côté client (NEXT_PUBLIC_BASE_URL est injectée au build).
 */

export const SITE_NAME   = 'JazzImmo'
export const SITE_DOMAIN = 'JazzImmo.fr'

/** URL publique du site, sans slash final. */
export const SITE_URL = (process.env.NEXT_PUBLIC_BASE_URL || `https://${SITE_DOMAIN}`).replace(/\/+$/, '')

/** Adresse email sur le domaine du site, ex. siteEmail('contact') → contact@JazzImmo.fr */
export function siteEmail(local: string): string {
  return `${local}@${SITE_DOMAIN}`
}
