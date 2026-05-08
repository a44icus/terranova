import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const MOTIFS_PROFIL = ['faux_pro', 'arnaque', 'contenu_inapproprie', 'autre'] as const
const MOTIFS_ANNONCE = ['prix_suspect', 'photos_fausses', 'bien_inexistant', 'arnaque', 'doublon', 'autre'] as const
const TOUS_MOTIFS = [...new Set([...MOTIFS_PROFIL, ...MOTIFS_ANNONCE])]

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Connexion requise pour signaler.' }, { status: 401 })
  }

  const body = await request.json()
  const { reported_user_id, bien_id, motif, message } = body

  if (!reported_user_id || !motif) {
    return NextResponse.json({ error: 'Données manquantes.' }, { status: 400 })
  }
  if (!TOUS_MOTIFS.includes(motif)) {
    return NextResponse.json({ error: 'Motif invalide.' }, { status: 400 })
  }
  if (reported_user_id === user.id) {
    return NextResponse.json({ error: 'Vous ne pouvez pas vous signaler vous-même.' }, { status: 400 })
  }

  const { error } = await supabase.from('signalements').insert({
    reporter_id: user.id,
    reported_user_id,
    bien_id: bien_id ?? null,
    motif,
    message: message?.trim() || null,
  })

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Vous avez déjà signalé ceci.' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Erreur lors de l\'envoi.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
