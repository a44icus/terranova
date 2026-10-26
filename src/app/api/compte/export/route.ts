/**
 * GET /api/compte/export
 * Droit à la portabilité (RGPD art. 20) : toutes les données de l'utilisateur connecté,
 * dans un fichier JSON téléchargeable.
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getImpersonatedId } from '@/lib/impersonation'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  if (await getImpersonatedId()) {
    return NextResponse.json({ error: 'Indisponible pendant une consultation de compte' }, { status: 403 })
  }

  const admin = createAdminClient()
  const uid = user.id
  // Une table absente ou en erreur ne bloque pas l'export : elle est simplement vide
  const lire = async (table: string, colonne: string) => {
    const { data } = await admin.from(table).select('*').eq(colonne, uid)
    return data ?? []
  }

  const [
    profil, biens, favoris, alertes, recherches,
    contactsEnvoyes, contactsRecus, visitesDemandees, visitesRecues, avis,
  ] = await Promise.all([
    admin.from('profiles').select('*').eq('id', uid).maybeSingle().then(r => r.data),
    lire('biens', 'user_id'),
    lire('favoris', 'user_id'),
    lire('alertes', 'user_id'),
    lire('recherches', 'user_id'),
    lire('contacts', 'acheteur_id'),
    lire('contacts', 'vendeur_id'),
    lire('visites', 'demandeur_id'),
    lire('visites', 'vendeur_id'),
    lire('avis_agents', 'auteur_id'),
  ])

  const bienIds = biens.map((b: { id: string }) => b.id)
  const { data: photos } = bienIds.length
    ? await admin.from('photos').select('bien_id, url, ordre, is_360, created_at').in('bien_id', bienIds)
    : { data: [] }

  // Les identifiants techniques Stripe ne sont pas des données utiles à l'utilisateur
  const profilExport: Record<string, unknown> = { ...(profil ?? {}) }
  delete profilExport.stripe_customer_id
  delete profilExport.stripe_subscription_id

  const exportJson = {
    exporte_le: new Date().toISOString(),
    compte: { email: user.email, cree_le: user.created_at, derniere_connexion: user.last_sign_in_at },
    profil: profilExport,
    annonces: biens,
    photos: photos ?? [],
    favoris,
    alertes,
    recherches,
    messages: { envoyes: contactsEnvoyes, recus: contactsRecus },
    visites: { demandees: visitesDemandees, recues: visitesRecues },
    avis_rediges: avis,
  }

  return new NextResponse(JSON.stringify(exportJson, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="mes-donnees-${new Date().toISOString().slice(0, 10)}.json"`,
      'Cache-Control': 'no-store',
    },
  })
}
