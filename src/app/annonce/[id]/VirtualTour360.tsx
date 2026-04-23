'use client'

import dynamic from 'next/dynamic'

const ReactPhotoSphereViewer = dynamic(
  () =>
    import('react-photo-sphere-viewer').then(
      (mod) => mod.ReactPhotoSphereViewer
    ),
  {
    ssr: false,
    loading: () => <p>Chargement de la visite 360...</p>,
  }
)

interface Props {
  urls: string[]
  titre: string
}

export default function VirtualTour360({ urls, titre }: Props) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  if (!urls.length) return null

  return (
    <>
      {/* Bouton d'ouverture */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2.5 bg-navy text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-primary transition-colors shadow-sm"
      >
        <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
        Visite virtuelle 360°
        {urls.length > 1 && <span className="bg-white/20 text-white text-xs px-1.5 py-0.5 rounded-full">{urls.length}</span>}
      </button>

      {/* Modal viewer */}
      {open && (
        <div className="fixed inset-0 z-[1000] bg-black/95 flex flex-col" onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 flex-shrink-0 border-b border-white/10">
            <div className="flex items-center gap-3">
              <span className="text-white/60 text-sm">{titre} — Visite 360°</span>
              {urls.length > 1 && (
                <div className="flex gap-1.5">
                  {urls.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveIndex(i)}
                      className={`w-2 h-2 rounded-full transition-colors ${i === activeIndex ? 'bg-primary' : 'bg-white/30 hover:bg-white/60'}`}
                    />
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors text-lg"
            >✕</button>
          </div>

          {/* Viewer */}
          <div className="flex-1 min-h-0 relative">
            <Suspense fallback={
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-white/50 text-sm animate-pulse">Chargement du viewer 360°…</div>
              </div>
            }>
              <ReactPhotoSphereViewer
                key={activeIndex}
                src={urls[activeIndex]}
                height="100%"
                width="100%"
                defaultZoomLvl={0}
                navbar={['zoom', 'fullscreen']}
                loadingTxt="Chargement…"
              />
            </Suspense>

            {/* Navigation multi-photos */}
            {urls.length > 1 && (
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
                <button
                  onClick={() => setActiveIndex(i => (i - 1 + urls.length) % urls.length)}
                  className="bg-black/50 text-white rounded-full w-9 h-9 flex items-center justify-center backdrop-blur-sm hover:bg-black/70 transition-colors"
                >‹</button>
                <span className="bg-black/50 text-white text-xs px-3 py-2 rounded-full backdrop-blur-sm">
                  {activeIndex + 1} / {urls.length}
                </span>
                <button
                  onClick={() => setActiveIndex(i => (i + 1) % urls.length)}
                  className="bg-black/50 text-white rounded-full w-9 h-9 flex items-center justify-center backdrop-blur-sm hover:bg-black/70 transition-colors"
                >›</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
