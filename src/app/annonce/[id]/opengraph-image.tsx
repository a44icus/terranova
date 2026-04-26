import { ImageResponse } from 'next/og'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatPrix } from '@/lib/geo'

export const alt = 'Annonce Terranova'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const CAT_LABEL: Record<string, string> = {
  appartement: 'Appartement', maison: 'Maison', bureau: 'Bureau',
  terrain: 'Terrain', parking: 'Parking', local: 'Local commercial',
}

export default async function OgImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const [{ data: bien }, { data: photo }] = await Promise.all([
    supabase
      .from('biens')
      .select('titre, ville, prix, type, categorie, surface, pieces')
      .eq('id', id)
      .eq('statut', 'publie')
      .maybeSingle(),
    supabase
      .from('photos')
      .select('url')
      .eq('bien_id', id)
      .eq('principale', true)
      .maybeSingle(),
  ])

  const titre    = bien?.titre    ?? 'Annonce immobilière'
  const ville    = bien?.ville    ?? ''
  const prix     = bien ? formatPrix(bien.prix, bien.type) : ''
  const categorie = bien?.categorie ? (CAT_LABEL[bien.categorie] ?? bien.categorie) : ''
  const infos    = [
    bien?.surface ? `${bien.surface} m²` : null,
    bien?.pieces  ? `${bien.pieces} pièce${bien.pieces > 1 ? 's' : ''}` : null,
  ].filter(Boolean).join('  ·  ')
  const typeLabel = bien?.type === 'location' ? 'Location' : 'Vente'
  const hasPhoto  = !!photo?.url

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200, height: 630,
          display: 'flex', position: 'relative',
          fontFamily: 'sans-serif', overflow: 'hidden',
          background: '#0F172A',
        }}
      >
        {/* Photo de fond */}
        {hasPhoto && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo!.url}
            alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.45 }}
          />
        )}

        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(15,23,42,0.92) 0%, rgba(15,23,42,0.6) 50%, rgba(79,70,229,0.3) 100%)',
          display: 'flex',
        }} />

        {/* Contenu */}
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '52px 60px', width: '100%' }}>

          {/* Header : logo + badge type */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 0 }}>
              <span style={{ fontSize: 34, fontWeight: 700, color: 'white', letterSpacing: '0.04em' }}>Terra</span>
              <span style={{ fontSize: 34, fontWeight: 700, color: '#818CF8', fontStyle: 'italic', letterSpacing: '0.04em' }}>nova</span>
            </div>
            <div style={{
              background: bien?.type === 'location' ? '#0891B2' : '#4F46E5',
              color: 'white', fontSize: 14, fontWeight: 700,
              padding: '6px 18px', borderRadius: 20, letterSpacing: '0.06em',
              textTransform: 'uppercase',
              display: 'flex',
            }}>
              {typeLabel}
            </div>
          </div>

          {/* Centre : titre + infos */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {categorie && (
              <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex' }}>
                {categorie}
              </div>
            )}
            <div style={{ fontSize: 46, fontWeight: 700, color: 'white', lineHeight: 1.15, display: 'flex', maxWidth: 800 }}>
              {titre.length > 60 ? titre.slice(0, 60) + '…' : titre}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 4 }}>
              <span style={{ fontSize: 17, color: 'rgba(255,255,255,0.6)', display: 'flex' }}>📍 {ville}</span>
              {infos && <span style={{ fontSize: 17, color: 'rgba(255,255,255,0.45)', display: 'flex' }}>{infos}</span>}
            </div>
          </div>

          {/* Footer : prix + tagline */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex' }}>Prix</div>
              <div style={{ fontSize: 44, fontWeight: 700, color: '#818CF8', display: 'flex' }}>{prix}</div>
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', display: 'flex' }}>
              terranova-beta.vercel.app
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
