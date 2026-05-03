import type { NextConfig } from "next";

// Content Security Policy
// 'unsafe-inline' sur script-src est requis par Next.js (hydratation inline)
// 'unsafe-eval' est requis par MapLibre GL JS (compilation des shaders WebGL)
const ContentSecurityPolicy = [
  "default-src 'self'",
  [
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    // Stripe.js
    "https://js.stripe.com",
    // Google Tag Manager + Analytics
    "https://www.googletagmanager.com",
    "https://www.google-analytics.com",
    // Meta Pixel
    "https://connect.facebook.net",
  ].join(' '),
  [
    "style-src 'self' 'unsafe-inline'",
    // Google Fonts CSS
    "https://fonts.googleapis.com",
    // MapLibre GL CSS (markers, controls, popups)
    "https://cdn.jsdelivr.net",
  ].join(' '),
  // blob: pour les tuiles WebGL de MapLibre ; https: pour les tilesets externes
  "img-src 'self' data: blob: https:",
  // MapLibre crée ses web workers via blob: URL
  "worker-src blob:",
  "child-src blob:",
  // Polices Google Fonts
  "font-src 'self' data: https://fonts.gstatic.com",
  [
    "connect-src 'self'",
    // Supabase REST + Realtime
    "https://*.supabase.co",
    "wss://*.supabase.co",
    // Stripe
    "https://api.stripe.com",
    // Google Analytics
    "https://www.google-analytics.com",
    "https://analytics.google.com",
    // Géocodage (SearchBar)
    "https://nominatim.openstreetmap.org",
    // Tuiles OSM (Plan)
    "https://tile.openstreetmap.org",
    // Tuiles satellite Esri
    "https://server.arcgisonline.com",
    // Tuiles OpenTopoMap (Topo)
    "https://tile.opentopomap.org",
    // Données vectorielles 3D buildings
    "https://tiles.openfreemap.org",
    // Overpass API — données POI (3 serveurs en fallback)
    "https://overpass-api.de",
    "https://overpass.kumi.systems",
    "https://overpass.openstreetmap.ru",
    // OSRM — calcul d'itinéraires (pied, vélo, voiture)
    "https://routing.openstreetmap.de",
  ].join(' '),
  [
    "frame-src",
    // Stripe 3DS
    "https://js.stripe.com",
    "https://hooks.stripe.com",
    // GTM noscript iframe
    "https://www.googletagmanager.com",
  ].join(' '),
  // Interdit les plugins Flash/PDF embarqués
  "object-src 'none'",
  // Empêche l'injection d'une balise <base> malveillante
  "base-uri 'self'",
  // Les formulaires ne peuvent soumettre qu'au site lui-même
  "form-action 'self'",
].join('; ')

const securityHeaders = [
  // Politique de sécurité du contenu (bloque XSS, injections de scripts, iframes pirates)
  { key: 'Content-Security-Policy', value: ContentSecurityPolicy },
  // Empêche le clickjacking (iframe depuis un autre domaine)
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // Empêche le MIME-sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Protection XSS basique (anciens navigateurs)
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  // Contrôle les infos de referrer envoyées aux sites tiers
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Force HTTPS pour 1 an
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // Limite les API navigateur accessibles (pas de géoloc, caméra sans permission explicite)
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
  // Isole le contexte de navigation (protège contre Spectre / ouvertures cross-origin)
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  // Empêche d'autres origines d'embarquer nos ressources en no-cors
  // Note : Cross-Origin-Embedder-Policy omis volontairement — incompatible avec MapLibre (tuiles externes)
  { key: 'Cross-Origin-Resource-Policy', value: 'same-site' },
]

const nextConfig: NextConfig = {
  images: {
    qualities: [75, 90],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
};

export default nextConfig;
