import { createAdminClient } from '@/lib/supabase/admin'
import { deleteHeroPhoto, toggleHeroPhotoActif, moveHeroPhoto } from './actions'
import UploadForm from './UploadForm'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

export default async function AdminHeroPage() {
  const supabase = createAdminClient()
  const { data: photos, error: tableError } = await supabase
    .from('hero_photos')
    .select('*')
    .order('ordre', { ascending: true })

  return (
    <div className="p-6 sm:p-10 max-w-4xl">

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-2xl text-navy" style={{ fontFamily: "'DM Serif Display', serif" }}>
          Photos de la hero
        </h1>
        <p className="text-sm text-navy/50 mt-1">
          Les photos s'affichent en fondu enchaîné sur la page d'accueil. Activez celles que vous souhaitez montrer.
        </p>
      </div>

      {/* Erreur table manquante */}
      {tableError && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          <strong>Table manquante</strong> — Exécutez d'abord le SQL ci-dessous dans Supabase → SQL Editor.
          <br /><code className="text-xs mt-1 block opacity-70">{tableError.message}</code>
        </div>
      )}

      {/* SQL hint */}
      {(process.env.NODE_ENV !== 'production' || tableError) && (
        <details className="mb-8 bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs">
          <summary className="font-semibold cursor-pointer text-slate-600">SQL — Créer la table & le bucket</summary>
          <pre className="mt-3 text-slate-500 overflow-x-auto whitespace-pre-wrap">{`-- Table
CREATE TABLE hero_photos (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url        text NOT NULL,
  ordre      int  NOT NULL DEFAULT 0,
  actif      boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE hero_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lecture publique"  ON hero_photos FOR SELECT USING (true);
CREATE POLICY "Admin all"         ON hero_photos FOR ALL    USING (true);

-- Storage : créer un bucket public "hero-photos" dans Supabase > Storage`}
          </pre>
        </details>
      )}

      {/* Upload */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-8">
        <h2 className="font-semibold text-sm text-navy mb-4">Ajouter une photo</h2>
        <UploadForm />
        <p className="text-xs text-slate-400 mt-2">JPG, PNG ou WebP · max 8 Mo · recommandé : 1920×1080 px</p>
      </div>

      {/* Liste des photos */}
      {!photos || photos.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-400">
          <div className="text-4xl mb-3">🖼</div>
          <p className="text-sm font-medium">Aucune photo pour l'instant</p>
          <p className="text-xs mt-1">Uploadez votre première photo ci-dessus</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {photos.map((photo, idx) => (
            <div
              key={photo.id}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex items-center gap-0"
              style={{ opacity: photo.actif ? 1 : 0.5 }}
            >
              {/* Aperçu */}
              <div className="relative w-36 h-24 flex-shrink-0">
                <Image
                  src={photo.url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="144px"
                />
              </div>

              {/* Infos */}
              <div className="flex-1 px-5">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${photo.actif ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
                    {photo.actif ? '● Active' : '○ Inactive'}
                  </span>
                  <span className="text-xs text-slate-300">Photo {idx + 1}</span>
                </div>
                <p className="text-xs text-slate-400 truncate max-w-xs">{photo.url.split('/').pop()}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 px-4">

                {/* Réordonner */}
                <div className="flex flex-col gap-1">
                  <form action={moveHeroPhoto.bind(null, photo.id, 'up')}>
                    <button
                      type="submit"
                      disabled={idx === 0}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 disabled:opacity-20 disabled:cursor-not-allowed text-slate-500 transition-colors text-sm"
                      title="Monter"
                    >▲</button>
                  </form>
                  <form action={moveHeroPhoto.bind(null, photo.id, 'down')}>
                    <button
                      type="submit"
                      disabled={idx === photos.length - 1}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 disabled:opacity-20 disabled:cursor-not-allowed text-slate-500 transition-colors text-sm"
                      title="Descendre"
                    >▼</button>
                  </form>
                </div>

                {/* Toggle actif */}
                <form action={toggleHeroPhotoActif.bind(null, photo.id, !photo.actif)}>
                  <button
                    type="submit"
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                      photo.actif
                        ? 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        : 'bg-green-50 text-green-700 hover:bg-green-100'
                    }`}
                  >
                    {photo.actif ? 'Désactiver' : 'Activer'}
                  </button>
                </form>

                {/* Supprimer */}
                <form action={deleteHeroPhoto.bind(null, photo.id, photo.url)}>
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

              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview note */}
      {photos && photos.length > 0 && (
        <div className="mt-6 flex items-start gap-3 bg-indigo-50 border border-indigo-100 rounded-xl p-4">
          <span className="text-lg flex-shrink-0">💡</span>
          <div className="text-xs text-indigo-700">
            <strong>Aperçu :</strong> les photos s'affichent dans l'ordre affiché ici, avec un fondu de 1,8 s toutes les 6 secondes.{' '}
            <a href="/" target="_blank" className="underline font-semibold">Voir la homepage →</a>
          </div>
        </div>
      )}

    </div>
  )
}
