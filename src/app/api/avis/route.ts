import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { agentId, note, commentaire } = body

  if (typeof agentId !== 'string' || !agentId)
    return NextResponse.json({ error: 'agentId requis' }, { status: 400 })
  if (typeof note !== 'number' || note < 1 || note > 5 || !Number.isInteger(note))
    return NextResponse.json({ error: 'note invalide (1-5)' }, { status: 400 })
  if (agentId === user.id)
    return NextResponse.json({ error: 'Vous ne pouvez pas vous noter vous-même' }, { status: 400 })

  const admin = createAdminClient()

  // Vérifie que l'agent existe
  const { data: agent } = await admin.from('profiles').select('prenom, nom').eq('id', agentId).single()
  if (!agent) return NextResponse.json({ error: 'Agent introuvable' }, { status: 404 })

  // Vérifie si l'utilisateur a déjà laissé un avis
  const { count } = await admin
    .from('avis_agents')
    .select('id', { count: 'exact', head: true })
    .eq('agent_id', agentId)
    .eq('auteur_id', user.id)

  if ((count ?? 0) > 0)
    return NextResponse.json({ error: 'Vous avez déjà laissé un avis pour cet agent' }, { status: 409 })

  // Récupère le nom de l'auteur
  const { data: auteurProfile } = await admin
    .from('profiles')
    .select('prenom, nom')
    .eq('id', user.id)
    .single()
  const auteurNom = [auteurProfile?.prenom, auteurProfile?.nom].filter(Boolean).join(' ') || 'Utilisateur'

  const { error } = await admin.from('avis_agents').insert({
    agent_id:    agentId,
    auteur_id:   user.id,
    auteur_nom:  auteurNom,
    note,
    commentaire: commentaire ? String(commentaire).trim().slice(0, 1000) : null,
  })

  if (error) {
    console.error('[avis]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const avisId = searchParams.get('id')
  if (!avisId) return NextResponse.json({ error: 'id requis' }, { status: 400 })

  const admin = createAdminClient()
  await admin.from('avis_agents').delete().eq('id', avisId).eq('auteur_id', user.id)

  return NextResponse.json({ ok: true })
}
