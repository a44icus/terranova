import type { NextConfig } from "next";

// Content Security Policy
// 'unsafe-inline' sur script-src est requis par Next.js (hydratation inline)
// 'unsafe-eval' est requis par MapLibre GL JS (compilation des shaders WebGL)
const ContentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
  "style-src 'self' 'unsafe-inline'",
  // blob: pour les tuiles WebGL de MapLibre ; https: pour les tilesets externes (OSM, IGN…)
  "img-src 'self' data: blob: https:",
  // wss: pour les abonnements Supabase Realtime
  [
    "connect-src 'self'",
    "https://*.supabase.co",
    "wss://*.supabase.co",
    "https://api.stripe.com",
    "https://nominatim.openstreetmap.org",
  ].join(' '),
  "font-src 'self' data:",
  // Stripe.js a besoin d'iframes pour le 3DS
  "frame-src https://js.stripe.com https://hooks.stripe.com",
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
]

const nextConfig: NextConfig = {
  images: {
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
