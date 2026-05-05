'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean)
  const isAdmin =
    user.user_metadata?.role === 'admin' ||
    user.app_metadata?.role === 'admin' ||
    adminEmails.includes(user.email ?? '')
  if (!isAdmin) throw new Error('Accès refusé')
}

export async function uploadHeroPhoto(formData: FormData) {
  await checkAdmin()
  const supabase = createAdminClient()

  const file = formData.get('file') as File
  if (!file || file.size === 0) throw new Error('Fichier manquant')
  if (file.size > 8 * 1024 * 1024) throw new Error('Fichier trop lourd (max 8 Mo)')

  const ext         = file.name.split('.').pop() ?? 'jpg'
  const path        = `hero/${Date.now()}.${ext}`
  const arrayBuffer = await file.arrayBuffer()
  const buffer      = new Uint8Array(arrayBuffer)

  const { error: uploadError } = await supabase.storage
    .from('hero-photos')
    .upload(path, buffer, { contentType: file.type, upsert: false })
  if (uploadError) throw new Error(`Upload échoué : ${uploadError.message}`)

  const { data: { publicUrl } } = supabase.storage
    .from('hero-photos')
    .getPublicUrl(path)

  // Ordre = max existant + 1
  const { data: existing } = await supabase
    .from('hero_photos')
    .select('ordre')
    .order('ordre', { ascending: false })
    .limit(1)
    .single()
  const ordre = (existing?.ordre ?? 0) + 1

  const { error } = await supabase.from('hero_photos').insert({ url: publicUrl, ordre, actif: true })
  if (error) throw new Error(`Insertion échouée : ${error.message}`)

  revalidatePath('/admin/hero')
  revalidatePath('/')
}

export async function deleteHeroPhoto(id: string, url: string) {
  await checkAdmin()
  const supabase = createAdminClient()

  // Extraire le chemin relatif depuis l'URL publique
  const match = url.match(/hero-photos\/(.+)$/)
  if (match) {
    await supabase.storage.from('hero-photos').remove([match[1]])
  }

  const { error } = await supabase.from('hero_photos').delete().eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/admin/hero')
  revalidatePath('/')
}

export async function toggleHeroPhotoActif(id: string, actif: boolean) {
  await checkAdmin()
  const supabase = createAdminClient()
  const { error } = await supabase.from('hero_photos').update({ actif }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/hero')
  revalidatePath('/')
}

export async function moveHeroPhoto(id: string, direction: 'up' | 'down') {
  await checkAdmin()
  const supabase = createAdminClient()

  // Récupérer toutes les photos triées
  const { data: photos } = await supabase
    .from('hero_photos')
    .select('id, ordre')
    .order('ordre', { ascending: true })
  if (!photos) return

  const idx = photos.findIndex(p => p.id === id)
  if (idx === -1) return

  const swapIdx = direction === 'up' ? idx - 1 : idx + 1
  if (swapIdx < 0 || swapIdx >= photos.length) return

  const a = photos[idx]
  const b = photos[swapIdx]

  // Swap des ordres
  await supabase.from('hero_photos').update({ ordre: b.ordre }).eq('id', a.id)
  await supabase.from('hero_photos').update({ ordre: a.ordre }).eq('id', b.id)

  revalidatePath('/admin/hero')
  revalidatePath('/')
}
