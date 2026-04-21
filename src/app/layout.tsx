import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import { getSiteSettings } from '@/lib/siteSettings'
import CookieBanner from '@/components/ui/CookieBanner'

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings()
  return {
    title: `${s.nom_site} – Immobilier en France`,
    description: s.meta_description || s.slogan,
    openGraph: s.og_image_url ? {
      images: [{ url: s.og_image_url, width: 1200, height: 630 }],
    } : undefined,
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const s = await getSiteSettings()

  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/maplibre-gl@3.6.2/dist/maplibre-gl.css" />

        {/* ── Google Tag Manager ── */}
        {s.gtm_id && (
          <Script id="gtm" strategy="afterInteractive">{`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${s.gtm_id}');
          `}</Script>
        )}

        {/* ── Google Analytics 4 (seulement si pas de GTM pour éviter le double comptage) ── */}
        {s.ga4_id && !s.gtm_id && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${s.ga4_id}`} strategy="afterInteractive" />
            <Script id="ga4" strategy="afterInteractive">{`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${s.ga4_id}');
            `}</Script>
          </>
        )}

        {/* ── Meta Pixel ── */}
        {s.pixel_meta_id && (
          <Script id="meta-pixel" strategy="afterInteractive">{`
            !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
            n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
            document,'script','https://connect.facebook.net/en_US/fbevents.js');
            fbq('init','${s.pixel_meta_id}');fbq('track','PageView');
          `}</Script>
        )}

        {/* ── Matomo ── */}
        {s.matomo_url && s.matomo_site_id && (
          <Script id="matomo" strategy="afterInteractive">{`
            var _paq=window._paq=window._paq||[];
            _paq.push(['trackPageView']);_paq.push(['enableLinkTracking']);
            (function(){var u="${s.matomo_url.replace(/\/$/, '')}/";
            _paq.push(['setTrackerUrl',u+'matomo.php']);
            _paq.push(['setSiteId','${s.matomo_site_id}']);
            var d=document,g=d.createElement('script'),s=d.getElementsByTagName('script')[0];
            g.async=true;g.src=u+'matomo.js';s.parentNode.insertBefore(g,s);})();
          `}</Script>
        )}
      </head>
      <body className="font-sans bg-surface text-navy">
        {/* GTM noscript */}
        {s.gtm_id && (
          <noscript>
            <iframe src={`https://www.googletagmanager.com/ns.html?id=${s.gtm_id}`}
              height="0" width="0" style={{ display: 'none', visibility: 'hidden' }} />
          </noscript>
        )}
        {children}
        {s.cookies_banniere && (
          <CookieBanner texte={s.cookies_texte || 'Nous utilisons des cookies pour améliorer votre expérience.'} />
        )}
      </body>
    </html>
  )
}
