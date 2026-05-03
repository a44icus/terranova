interface Props {
  title:        string
  description?: string
  action?:      React.ReactNode
}

/** Header de page standardisé pour /compte/* — h1 + description optionnelle + action à droite */
export default function PageHeader({ title, description, action }: Props) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
      <div className="min-w-0">
        <h1 className="font-serif text-2xl sm:text-3xl text-navy mb-1">{title}</h1>
        {description && (
          <p className="text-sm text-navy/50">{description}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}
