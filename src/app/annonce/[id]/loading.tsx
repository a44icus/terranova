export default function AnnonceLoading() {
  return (
    <div className="min-h-screen bg-surface animate-pulse">
      {/* Header */}
      <div className="bg-navy h-14" />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex gap-2 mb-6">
          <div className="h-3 w-16 bg-navy/10 rounded" />
          <div className="h-3 w-2 bg-navy/10 rounded" />
          <div className="h-3 w-20 bg-navy/10 rounded" />
          <div className="h-3 w-2 bg-navy/10 rounded" />
          <div className="h-3 w-40 bg-navy/10 rounded" />
        </div>

        {/* Photo principale */}
        <div className="w-full rounded-2xl bg-navy/10" style={{ height: 420 }} />

        {/* Thumbnails */}
        <div className="flex gap-2 mt-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="rounded-xl bg-navy/08 flex-shrink-0" style={{ width: 80, height: 60 }} />
          ))}
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Left */}
          <div className="lg:col-span-2 space-y-5">
            {/* Title card */}
            <div className="bg-white rounded-2xl p-6 border border-navy/08 space-y-3">
              <div className="flex gap-2">
                <div className="h-6 w-16 bg-navy/10 rounded-full" />
                <div className="h-6 w-24 bg-navy/10 rounded-full" />
              </div>
              <div className="h-8 w-3/4 bg-navy/10 rounded-lg" />
              <div className="h-4 w-1/2 bg-navy/08 rounded" />
              <div className="pt-4 border-t border-navy/06">
                <div className="h-10 w-40 bg-navy/10 rounded-lg" />
                <div className="h-3 w-24 bg-navy/06 rounded mt-2" />
              </div>
            </div>

            {/* Caractéristiques */}
            <div className="bg-white rounded-2xl p-6 border border-navy/08">
              <div className="h-4 w-32 bg-navy/10 rounded mb-5" />
              <div className="grid grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="flex gap-2.5">
                    <div className="h-5 w-5 bg-navy/08 rounded flex-shrink-0 mt-0.5" />
                    <div className="space-y-1.5">
                      <div className="h-2.5 w-16 bg-navy/06 rounded" />
                      <div className="h-3.5 w-12 bg-navy/10 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl p-6 border border-navy/08 space-y-2">
              <div className="h-4 w-24 bg-navy/10 rounded mb-4" />
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-3 bg-navy/06 rounded" style={{ width: i === 5 ? '60%' : '100%' }} />
              ))}
            </div>
          </div>

          {/* Right */}
          <div>
            <div className="bg-white rounded-2xl p-6 border border-navy/08 space-y-3">
              <div className="h-4 w-40 bg-navy/10 rounded mb-4" />
              <div className="grid grid-cols-2 gap-3">
                <div className="h-9 bg-navy/08 rounded-lg" />
                <div className="h-9 bg-navy/08 rounded-lg" />
              </div>
              <div className="h-9 bg-navy/08 rounded-lg" />
              <div className="h-20 bg-navy/08 rounded-lg" />
              <div className="h-10 bg-navy/12 rounded-xl" />
              <div className="pt-4 border-t border-navy/06 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-navy/10 flex-shrink-0" />
                <div className="space-y-1.5">
                  <div className="h-3.5 w-24 bg-navy/10 rounded" />
                  <div className="h-2.5 w-16 bg-navy/06 rounded" />
                </div>
              </div>
              <div className="h-10 bg-navy/06 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
