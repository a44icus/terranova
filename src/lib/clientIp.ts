/**
 * Extrait l'IP réelle du client. Module pur, utilisable depuis le middleware.
 *
 * Sur Vercel, x-real-ip est injecté par l'infrastructure (non-spoofable depuis le client).
 * Sinon, on prend le DERNIER IP de x-forwarded-for (le plus proche de notre edge),
 * ce qui limite le spoofing à condition que le proxy de confiance soit le dernier maillon.
 *
 * Retourne '' si aucune IP n'est identifiable : à chaque appelant de décider quoi en faire.
 */
export function getClientIp(req: { headers: Headers }): string {
  const xRealIp = req.headers.get('x-real-ip')?.trim()
  if (xRealIp) return xRealIp
  const xff = req.headers.get('x-forwarded-for')
  if (xff) {
    const last = xff.split(',').at(-1)?.trim()
    if (last) return last
  }
  return ''
}
