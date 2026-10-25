import type { Metadata } from 'next'
import GameClient from './GameClient'

export const metadata: Metadata = {
  title: 'Le Cartographe Fantôme — Escape game | JazzImmo',
  description: 'Un escape game sur carte 3D : suivez la piste du Cartographe autour du monde et résolvez cinq énigmes pour vous évader.',
  robots: { index: false, follow: false }, // page ludique, hors indexation SEO
}

export default function JeuPage() {
  return <GameClient />
}
