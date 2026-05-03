import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/* Échappe les caractères spéciaux iCal */
function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

/* Convertit une date ISO en format iCal UTC */
function toIcalDate(iso: string): string {
  return iso.replace(/[-:]/g, '').split('.')[0] + 'Z'
}

/* Coupe les lignes à 75 octets (RFC 5545) */
function fold(line: string): string {
  const chunks: string[] = []
  let i = 0
  while (i < line.length) {
    chunks.push(i === 0 ? line.slice(0, 75) : ' ' + line.slice(i, i + 74))
    i += i === 0 ? 75 : 74
  }
  return chunks.join('\r\n')
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const admin = createAdminClient()
  const { data: visite } = await admin
    .from('visites')
    .select('*, biens(id, titre, ville, adresse)')
    .eq('id', id)
    .single()

  if (!visite) return NextResponse.json({ error: 'Visite introuvable' }, { status: 404 })

  /* Vérifier que l'utilisateur est le vendeur ou le demandeur */
  const isVendeur = visite.vendeur_id === user.id
  const isDemandeur = visite.demandeur_email === user.email
  if (!isVendeur && !isDemandeur) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const bien = visite.biens as any
  const start = new Date(visite.date_souhaitee)
  const end   = new Date(start.getTime() + 60 * 60 * 1000) // +1h

  /* Résumé & description */
  const summary = `Visite — ${bien?.titre ?? 'Bien immobilier'} (${bien?.ville ?? ''})`
  const location = [bien?.adresse, bien?.ville].filter(Boolean).join(', ')
  const descLines = [
    `Demandeur : ${visite.demandeur_nom}`,
    `Email : ${visite.demandeur_email}`,
    visite.demandeur_tel ? `Tél : ${visite.demandeur_tel}` : null,
    visite.creneau ? `Créneau : ${visite.creneau}` : null,
    visite.message ? `Message : ${visite.message}` : null,
  ].filter(Boolean).join('\n')

  const now  = toIcalDate(new Date().toISOString())
  const uid  = `visite-${id}@terranova.fr`
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://terranova.fr'

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Terranova//Visites//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${toIcalDate(start.toISOString())}`,
    `DTEND:${toIcalDate(end.toISOString())}`,
    `SUMMARY:${esc(summary)}`,
    location ? `LOCATION:${esc(location)}` : null,
    `DESCRIPTION:${esc(descLines)}`,
    `URL:${baseUrl}/annonce/${bien?.id ?? ''}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean) as string[]

  const ical = lines.map(fold).join('\r\n')

  return new NextResponse(ical, {
    headers: {
      'Content-Type':        'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="visite-${id.slice(0, 8)}.ics"`,
      'Cache-Control':       'no-store',
    },
  })
}
