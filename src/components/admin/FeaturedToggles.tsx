'use client'
import { useTransition } from 'react'
import { toggleCoupDeCoeur, toggleFeatured } from '@/app/admin/annonces/actions'

interface Props {
  bienId: string
  coupDeCoeur: boolean
  featured: boolean
}

export default function FeaturedToggles({ bienId, coupDeCoeur, featured }: Props) {
  const [pending, startTransition] = useTransition()

  return (
    <div className="flex gap-1.5">
      <button
        onClick={() => startTransition(() => { toggleCoupDeCoeur(bienId, !coupDeCoeur) })}
        disabled={pending}
        title={coupDeCoeur ? 'Retirer coup de cœur' : 'Marquer coup de cœur'}
        className="text-sm px-2 py-1 rounded-lg border transition-all disabled:opacity-40"
        style={coupDeCoeur
          ? { background: '#FEF9C3', borderColor: '#D97706', color: '#92400E' }
          : { background: '#F8FAFC', borderColor: '#E2E8F0', color: '#94A3B8' }
        }
      >
        ⭐
      </button>
      <button
        onClick={() => startTransition(() => { toggleFeatured(bienId, !featured) })}
        disabled={pending}
        title={featured ? 'Retirer mise en avant' : 'Mettre en avant'}
        className="text-sm px-2 py-1 rounded-lg border transition-all disabled:opacity-40"
        style={featured
          ? { background: '#EEF2FF', borderColor: '#4F46E5', color: '#4F46E5' }
          : { background: '#F8FAFC', borderColor: '#E2E8F0', color: '#94A3B8' }
        }
      >
        🔝
      </button>
    </div>
  )
}



