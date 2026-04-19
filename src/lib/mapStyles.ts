export const STYLE_STREET = {
  version: 8 as const,
  sources: {
    'osm-tiles': {
      type: 'raster' as const,
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      maxzoom: 19, // résolution max des tuiles disponibles
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [{ id: 'osm-tiles', type: 'raster' as const, source: 'osm-tiles', minzoom: 0, maxzoom: 24 }],
}

export const STYLE_SATELLITE = {
  version: 8 as const,
  sources: {
    satellite: {
      type: 'raster' as const,
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
      tileSize: 256,
      maxzoom: 18, // résolution max des tuiles Esri
      attribution: '© Esri',
    },
  },
  layers: [{ id: 'satellite', type: 'raster' as const, source: 'satellite', minzoom: 0, maxzoom: 24 }],
}

export const STYLE_TOPO = {
  version: 8 as const,
  sources: {
    topo: {
      type: 'raster' as const,
      tiles: ['https://tile.opentopomap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      maxzoom: 17, // résolution max des tuiles OpenTopoMap
      attribution: '© OpenTopoMap',
    },
  },
  layers: [{ id: 'topo', type: 'raster' as const, source: 'topo', minzoom: 0, maxzoom: 24 }],
}

export type MapStyleKey = 'street' | 'satellite' | 'topo'
export const MAP_STYLES: Record<MapStyleKey, { version: 8; sources: Record<string, unknown>; layers: unknown[] }> = {
  street: STYLE_STREET,
  satellite: STYLE_SATELLITE,
  topo: STYLE_TOPO,
}
