export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  return haversineKm(lat1, lng1, lat2, lng2) * 1000
}

export function metersToLngDeg(m: number, lat: number): number {
  return m / (111320 * Math.cos(lat * Math.PI / 180))
}

export function metersToLatDeg(m: number): number {
  return m / 110540
}

export function pointInPolygon(point: [number, number], polygon: [number, number][]): boolean {
  const [x, y] = point
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1]
    const xj = polygon[j][0], yj = polygon[j][1]
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)
    if (intersect) inside = !inside
  }
  return inside
}

export function makeCircle(lat: number, lng: number, radiusM: number, steps = 64): [number, number][] {
  const coords: [number, number][] = []
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * 2 * Math.PI
    coords.push([
      lng + Math.cos(angle) * metersToLngDeg(radiusM, lat),
      lat + Math.sin(angle) * metersToLatDeg(radiusM),
    ])
  }
  return coords
}

export function formatDist(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`
}

export function formatRadius(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(0)} km` : `${m} m`
}

export function formatPrix(prix: number, type: 'vente' | 'location'): string {
  if (type === 'location') return `${prix.toLocaleString('fr-FR')} €/mois`
  if (prix >= 1000000) return `${(prix / 1000000).toFixed(2).replace(/\.?0+$/, '')} M€`
  return `${prix.toLocaleString('fr-FR')} €`
}

export function formatPrixCourt(prix: number, type: 'vente' | 'location'): string {
  if (type === 'location') return `${prix.toLocaleString('fr-FR')}€/m`
  if (prix >= 1000000) return `${(prix / 1000000).toFixed(1)}M€`
  return `${Math.round(prix / 1000)}k€`
}