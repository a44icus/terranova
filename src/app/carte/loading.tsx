export default function CarteLoading() {
  return (
    <div className="flex flex-col h-screen overflow-hidden animate-pulse">
      {/* Header */}
      <div className="bg-navy h-14 flex-shrink-0" />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar skeleton */}
        <div className="w-80 flex-shrink-0 bg-white border-r border-navy/08 flex flex-col p-4 gap-3">
          {/* Search bar */}
          <div className="h-10 bg-navy/08 rounded-xl" />

          {/* Filters row */}
          <div className="flex gap-2">
            <div className="h-8 w-20 bg-navy/06 rounded-full" />
            <div className="h-8 w-24 bg-navy/06 rounded-full" />
            <div className="h-8 w-16 bg-navy/06 rounded-full" />
          </div>

          {/* Bien cards */}
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bg-navy/04 rounded-xl p-3 space-y-2">
              <div className="h-28 bg-navy/08 rounded-lg" />
              <div className="h-4 w-3/4 bg-navy/08 rounded" />
              <div className="h-3 w-1/2 bg-navy/06 rounded" />
              <div className="h-5 w-1/3 bg-navy/10 rounded" />
            </div>
          ))}
        </div>

        {/* Map skeleton */}
        <div className="flex-1 bg-navy/04" />
      </div>
    </div>
  )
}
