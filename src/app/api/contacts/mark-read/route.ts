import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { contactId } = await req.json()
    if (!contactId) return NextResponse.json({ error: 'Missing contactId' }, { status: 400 })

    // Vérifie que l'utilisateur connecté est bien le vendeur de ce contact
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: contact } = await supabase
      .from('contacts')
      .select('id, vendeur_id')
      .eq('id', contactId)
      .single()

    if (!contact || contact.vendeur_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update via admin client (bypass RLS)
    const { error } = await createAdminClient()
      .from('contacts')
      .update({ lu: true })
      .eq('id', contactId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
