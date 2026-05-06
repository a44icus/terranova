'use server'

import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

async function checkAdmin() {
  await requireAdmin()
}

export async function uploadHeroPhoto(_prevState: string | null, formData: FormData): Promise<string | null> {
  try {
    await checkAdmin()
    const supabase = createAdminClient()

    const file = formData.get('file') as File
    if (!file || file.size === 0) return 'Fichier manquant'
    if (file.size > 8 * 1024 * 1024) return 'Fichier trop lourd (max 8 Mo)'

    // ── Validation extension, MIME et magic bytes ─────────────
    const ALLOWED_EXTS  = ['jpg', 'jpeg', 'png', 'webp']
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    if (!ALLOWED_EXTS.includes(ext))  return 'Extension non autorisée (jpg, png, webp uniquement)'
    if (!ALLOWED_TYPES.includes(file.type)) return 'Type MIME non autorisé'

    const arrayBuffer = await file.arrayBuffer()
    const header = Buffer.from(arrayBuffer).subarray(0, 12)
    const isJpeg = header[0] === 0xFF && header[1] === 0xD8
    const isPng  = header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47
    const isWebp = header.toString('ascii', 0, 4) === 'RIFF' && header.toString('ascii', 8, 12) === 'WEBP'
    if (!isJpeg && !isPng && !isWebp) return 'Contenu du fichier invalide (signature non reconnue)'

    const path   = `hero/${Date.now()}.${ext}`
    const buffer = new Uint8Array(arrayBuffer)

    const { error: uploadError } = await supabase.storage
      .from('hero-photos')
      .upload(path, buffer, { contentType: file.type, upsert: false })
    if (uploadError) return `Upload Storage échoué : ${uploadError.message}`

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
    if (error) return `Insertion DB échouée : ${error.message}`

    revalidatePath('/admin/hero')
    revalidatePath('/')
    return null
  } catch (e: any) {
    return e?.message ?? 'Erreur inconnue'
  }
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
