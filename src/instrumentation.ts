import type { Instrumentation } from 'next'

/**
 * Toute erreur serveur non rattrapée (pages, routes API, actions serveur) est signalée
 * par email aux admins (ADMIN_EMAILS). Voir lib/alertesErreurs.ts.
 */
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  // L'envoi d'email passe par Supabase et fetch Node : runtime Node uniquement
  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  const { signalerErreur } = await import('@/lib/alertesErreurs')
  await signalerErreur({
    source: `${request.method} ${context.routePath}`,
    erreur: err,
    details: {
      // Chemin sans la query string, qui peut contenir des jetons
      chemin: request.path.split('?')[0],
      type:   context.routeType,
      digest: (err as { digest?: string }).digest,
    },
  })
}
