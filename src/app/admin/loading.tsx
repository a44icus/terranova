export default function AdminLoading() {
  return (
    <div className="flex h-screen overflow-hidden animate-pulse">
      {/* Sidebar nav */}
      <div className="w-56 flex-shrink-0 bg-navy flex flex-col gap-1 p-3 pt-16">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
          <div key={i} className="h-9 bg-white/08 rounded-lg" />
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto bg-surface p-8 space-y-6">
        {/* Title */}
        <div className="h-8 w-48 bg-navy/10 rounded-lg" />

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-navy/08 space-y-3">
              <div className="h-3 w-20 bg-navy/08 rounded" />
              <div className="h-7 w-16 bg-navy/12 rounded-lg" />
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-navy/08 overflow-hidden">
          <div className="p-5 border-b border-navy/06">
            <div className="h-5 w-32 bg-navy/10 rounded" />
          </div>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="flex gap-4 items-center px-5 py-3.5 border-b border-navy/04">
              <div className="h-10 w-10 bg-navy/08 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-48 bg-navy/10 rounded" />
                <div className="h-2.5 w-32 bg-navy/06 rounded" />
              </div>
              <div className="h-6 w-20 bg-navy/06 rounded-full" />
              <div className="h-7 w-16 bg-navy/08 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
