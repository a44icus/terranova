'use client'

import { useEffect } from 'react'
import { useMapStore } from '@/store/mapStore'
import { getFavorisDB } from '@/app/api/favoris/actions'

export default function FavorisSync() {
  const setFavorites = useMapStore(s => s.setFavorites)

  useEffect(() => {
    getFavorisDB()
      .then(dbIds => {
        if (dbIds.length > 0) {
          setFavorites(dbIds)
        }
      })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}



