export default function CompteLoading() {
  return (
    <div className="min-h-screen bg-surface animate-pulse">
      {/* Header */}
      <div className="bg-navy h-14" />

      <div className="max-w-5xl mx-auto px-4 py-8 flex gap-8">
        {/* Sidebar nav */}
        <div className="w-52 flex-shrink-0 space-y-1">
          {[1, 2, 3, 4, 5, 6, 7].map(i => (
            <div key={i} className="h-9 bg-navy/08 rounded-lg" />
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-5">
          <div className="h-7 w-40 bg-navy/10 rounded-lg" />
          <div className="bg-white rounded-2xl border border-navy/08 p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-navy/10 flex-shrink-0" />
              <div className="space-y-2">
                <div className="h-5 w-36 bg-navy/10 rounded" />
                <div className="h-3 w-24 bg-navy/06 rounded" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="space-y-1.5">
                  <div className="h-3 w-20 bg-navy/06 rounded" />
                  <div className="h-9 bg-navy/08 rounded-lg" />
                </div>
              ))}
            </div>
            <div className="h-10 w-32 bg-navy/10 rounded-xl mt-2" />
          </div>
        </div>
      </div>
    </div>
  )
}
