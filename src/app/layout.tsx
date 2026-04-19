import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Terranova – Immobilier en France',
  description: 'Trouvez et publiez des biens immobiliers partout en France',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/maplibre-gl@3.6.2/dist/maplibre-gl.css" />
      </head>
      <body className="font-sans bg-surface text-navy">
        {children}
      </body>
    </html>
  )
}