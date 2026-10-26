import type { MetadataRoute } from 'next'
import { SITE_NAME } from '@/lib/site'

/** Manifeste PWA : permet d'« installer » le site sur l'écran d'accueil d'un téléphone. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} – L'immobilier autrement`,
    short_name: SITE_NAME,
    description: 'Carte interactive des annonces immobilières, contact direct sans intermédiaire.',
    lang: 'fr',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#F8FAFC',
    theme_color: '#0F172A',
    icons: [
      { src: '/api/icone?taille=192', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/api/icone?taille=512', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/api/icone?taille=512', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Carte', url: '/carte' },
      { name: 'Publier une annonce', url: '/publier' },
      { name: 'Mon compte', url: '/compte' },
    ],
  }
}
