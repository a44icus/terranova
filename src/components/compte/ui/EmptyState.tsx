interface Props {
  icon?:       string
  title:       string
  description?: string
  action?:     React.ReactNode
}

/** État vide standardisé — icône + texte + CTA optionnel */
export default function EmptyState({ icon = '∅', title, description, action }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-navy/08 py-14 px-6 text-center">
      <div className="text-4xl mb-3 opacity-40">{icon}</div>
      <p className="text-sm text-navy/50 mb-1">{title}</p>
      {description && <p className="text-xs text-navy/30 mb-4">{description}</p>}
      {action && <div className="mt-4 inline-block">{action}</div>}
    </div>
  )
}
