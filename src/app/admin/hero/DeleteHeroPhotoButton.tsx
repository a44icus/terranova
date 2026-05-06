'use client'

import { deleteHeroPhoto } from './actions'

interface Props {
  id: string
  url: string
}

export default function DeleteHeroPhotoButton({ id, url }: Props) {
  return (
    <form action={deleteHeroPhoto.bind(null, id, url)}>
      <button
        type="submit"
        className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-colors"
        title="Supprimer"
        onClick={(e) => {
          if (!confirm('Supprimer définitivement cette photo ?')) e.preventDefault()
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
        </svg>
      </button>
    </form>
  )
}
