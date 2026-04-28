import { stopImpersonation } from '@/app/admin/utilisateurs/actions'

interface Props {
  name: string
}

export default function ImpersonationBanner({ name }: Props) {
  return (
    <div className="bg-amber-400 text-amber-900 px-4 py-2 flex items-center justify-between gap-4 text-sm font-medium z-50">
      <div className="flex items-center gap-2">
        <span className="text-base">👁</span>
        <span>
          Mode simulation — vous voyez le compte de <strong>{name}</strong>
        </span>
      </div>
      <form action={stopImpersonation}>
        <button type="submit"
          className="text-xs bg-amber-900 text-amber-50 px-3 py-1.5 rounded-lg hover:bg-amber-800 transition-colors font-semibold whitespace-nowrap">
          Arrêter →
        </button>
      </form>
    </div>
  )
}
