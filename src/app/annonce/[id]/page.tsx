import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { after } from 'next/server'
import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import { formatPrix } from '@/lib/geo'
import type { Metadata } from 'next'
import type { BienPublic } from '@/lib/types'
import PhotoGallery from './PhotoGallery'
import VirtualTour360 from './VirtualTour360'
import ContactForm from './ContactForm'
import ShareButton from './ShareButton'
import QuartierScore from '@/components/annonce/QuartierScore'
import RapportBien from '@/components/annonce/RapportBien'
import PrixEvolutionChart from '@/components/annonce/PrixEvolutionChart'
import SimulateurCredit from '@/components/annonce/SimulateurCredit'
import DemandeVisiteForm from '@/components/annonce/DemandeVisiteForm'
import { genererRapport } from '@/lib/profils'
import { getSiteSettings, getPoiWeights, getScoreSeuils } from '@/lib/siteSettings'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://terranova.fr'

const CAT_ICON: Record<string, string> = {
  appartement: '🏛️', maison: '🌿', bureau: '🏢',
  terrain: '🌱', parking: '🅿️', local: '🏪',
}

const CAT_LABEL: Record<string, string> = {
  appartement: 'Appartement', maison: 'Maison', bureau: 'Bureau',
  terrain: 'Terrain', parking: 'Parking', local: 'Local commercial',
}

const OPTIONS_LABELS: Record<string, string> = {
  parking: 'Parking', terrasse: 'Terrasse', balcon: 'Balcon',
  cave: 'Cave', piscine: 'Piscine', jardin: 'Jardin',
  ascenseur: 'Ascenseur', gardien: 'Gardien', interphone: 'Interphone',
  digicode: 'Digicode', fibre: 'Fibre optique', alarme: 'Alarme',
  climatisation: 'Climatisation', cheminee: 'Cheminée',
  double_vitrage: 'Double vitrage', parquet: 'Parquet',
}

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: bien } = await supabase
    .from('biens')
    .select('titre, ville, prix, type, description')
    .eq('id', id)
    .eq('statut', 'publie')
    .single()

  if (!bien) return { title: 'Annonce introuvable – Terranova' }

  const prix = formatPrix(bien.prix, bien.type)
  const title = `${bien.titre} – ${bien.ville} | Terranova`
  const description = bien.description
    ? bien.description.slice(0, 160)
    : `${bien.type === 'vente' ? 'Vente' : 'Location'} à ${bien.ville} — ${prix}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/annonce/${id}`,
      siteName: 'Terranova',
      locale: 'fr_FR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function AnnoncePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: bien }, { data: photos }, { data: { user } }] = await Promise.all([
    supabase.from('biens').select('*').eq('id', id).eq('statut', 'publie').single(),
    supabase.from('photos').select('*').eq('bien_id', id).order('ordre'),
    supabase.auth.getUser(),
  ])

  if (!bien) notFound()

  // Incrémenter vues uniquement en production (évite les faux comptages en dev)
  if (process.env.NODE_ENV === 'production') {
    const _admin = createAdminClient()
    const _today = new Date().toISOString().slice(0, 10)
    after(async () => {
      await Promise.all([
        // Incrément atomique SQL — évite les race conditions read-then-write
        _admin.rpc('increment_bien_vues', { p_bien_id: id }),
        _admin.rpc('increment_vue_stat',  { p_bien_id: id, p_date: _today }),
      ]).catch(() => {})
    })
  }

  // Fetch settings + vendeur + biens similaires + email vendeur en parallèle
  const adminClient = createAdminClient()
  const [{ data: vendeur }, { data: similaires }, { data: vendeurAuthData }, siteSettings] = await Promise.all([
    supabase
      .from('profiles')
      .select('prenom, nom, type, agence, avatar_url, logo_url')
      .eq('id', bien.user_id)
      .single(),
    supabase
      .from('biens_publics')
      .select('*')
      .eq('categorie', bien.categorie)
      .eq('ville', bien.ville)
      .neq('id', id)
      .order('featured', { ascending: false })
      .limit(4),
    adminClient.auth.admin.getUserById(bien.user_id),
    getSiteSettings(),
  ])

  const vendeurEmail = vendeurAuthData?.user?.email
  const vendeurNom = [vendeur?.prenom, vendeur?.nom].filter(Boolean).join(' ')

  const prix = formatPrix(bien.prix, bien.type)
  const icon = CAT_ICON[bien.categorie] ?? '🏠'
  const sortedPhotos = (photos ?? [])
    .sort((a: any, b: any) => (b.principale ? 1 : 0) - (a.principale ? 1 : 0) || a.ordre - b.ordre)
  const photoUrls: string[] = sortedPhotos.filter((p: any) => !p.is_360).map((p: any) => p.url)
  const tour360Urls: string[] = sortedPhotos.filter((p: any) => p.is_360).map((p: any) => p.url)

  const rapport = genererRapport({
    type: bien.type,
    categorie: bien.categorie,
    prix: bien.prix,
    surface: bien.surface,
    pieces: bien.pieces,
    chambres: bien.chambres,
    sdb: bien.sdb,
    nb_wc: bien.nb_wc,
    surface_terrain: bien.surface_terrain,
    etage: bien.etage,
    nb_etages: bien.nb_etages,
    annee_construction: bien.annee_construction,
    dpe: bien.dpe,
    ges: bien.ges,
    conso_energie: bien.conso_energie,
    depenses_energie_min: bien.depenses_energie_min,
    depenses_energie_max: bien.depenses_energie_max,
    fibre: bien.fibre,
    meuble: bien.meuble,
    neuf: bien.neuf,
    coup_de_coeur: bien.coup_de_coeur,
    options: bien.options ?? [],
    ville: bien.ville,
    code_postal: bien.code_postal,
  })

  return (
    <div className="min-h-screen bg-surface">
      <SiteHeader />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-xs text-navy/40 mb-6 flex items-center gap-1.5 flex-wrap">
          <Link href="/" className="hover:text-primary transition-colors">Accueil</Link>
          <span>›</span>
          <span>{bien.ville}</span>
          <span>›</span>
          <span className="text-navy/70">{CAT_LABEL[bien.categorie] ?? bien.categorie}</span>
          <span>›</span>
          <span className="text-navy/70 truncate max-w-[200px]">{bien.titre}</span>
        </nav>

        {/* Photo gallery */}
        <PhotoGallery photos={photoUrls} icon={icon} titre={bien.titre} />
        {tour360Urls.length > 0 && (
          <div className="mt-3">
            <VirtualTour360 urls={tour360Urls} titre={bien.titre} />
          </div>
        )}

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">

          {/* ── Left column ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Title + badges + prix */}
            <div className="bg-white rounded-2xl p-6 border border-navy/08">
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="text-xs font-semibold px-3 py-1 rounded-full text-white"
                  style={{ background: bien.type === 'vente' ? '#4F46E5' : '#0891B2' }}>
                  {bien.type === 'vente' ? 'Vente' : 'Location'}
                </span>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-navy/08 text-navy/60">
                  {CAT_LABEL[bien.categorie] ?? bien.categorie}
                </span>
                {bien.neuf && <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-700">Neuf</span>}
                {bien.coup_de_coeur && <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-100 text-amber-700">❤ Coup de cœur</span>}
                {bien.exclusif && <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-100 text-purple-700">Exclusif</span>}
                {bien.meuble && <span className="text-xs font-semibold px-3 py-1 rounded-full bg-navy/06 text-navy/50">Meublé</span>}
              </div>

              <h1 className="font-serif text-3xl text-navy leading-tight mb-2">
                {bien.titre}
              </h1>

              <p className="text-sm text-navy/50 mb-4">
                📍 {bien.approx
                  ? `${bien.ville} ${bien.code_postal} — localisation approximative`
                  : [bien.adresse, bien.complement, bien.ville, bien.code_postal].filter(Boolean).join(', ')
                }
              </p>

              {/* Description */}
              {bien.description && (
                <p className="mb-5 text-sm text-navy/65 leading-relaxed whitespace-pre-line">
                  {bien.description}
                </p>
              )}

              {/* Prix */}
              <div className="pt-5 border-t border-navy/06 flex items-end justify-between gap-4 flex-wrap">
                <div>
                  <div className="font-serif text-4xl text-navy">
                    {prix}
                  </div>
                  {bien.surface && bien.type === 'vente' && (
                    <div className="text-sm text-navy/40 mt-1">
                      {Math.round(bien.prix / bien.surface).toLocaleString('fr-FR')} €/m²
                    </div>
                  )}
                </div>
                <ShareButton titre={bien.titre} prix={prix} />
              </div>
            </div>

            {/* Caractéristiques */}
            <div className="bg-white rounded-2xl p-6 border border-navy/08">
              <h2 className="font-medium text-navy mb-5">Caractéristiques</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-5">
                {bien.surface && <Fact icon="📐" label="Surface habitable" value={`${bien.surface} m²`} />}
                {(bien.pieces ?? 0) > 0 && <Fact icon="🚪" label="Pièces" value={String(bien.pieces)} />}
                {(bien.sdb ?? 0) > 0 && <Fact icon="🚿" label="Salles de bain" value={String(bien.sdb)} />}
                {(bien.chambres ?? 0) > 0 && <Fact icon="🛏️" label="Chambres" value={String(bien.chambres)} />}
                {(bien.nb_wc ?? 0) > 0 && <Fact icon="🚽" label="WC" value={String(bien.nb_wc)} />}
                {bien.surface_terrain && <Fact icon="🌿" label="Surface terrain" value={`${bien.surface_terrain} m²`} />}
                {bien.fibre && <Fact icon="🌐" label="Fibre optique" value="Déployée" />}
                {bien.etage !== null && bien.etage !== undefined && (
                  <Fact icon="🏢" label="Étage"
                    value={bien.nb_etages ? `${bien.etage} / ${bien.nb_etages}` : String(bien.etage)} />
                )}
                {bien.nb_etages && <Fact icon="🏗️" label="Nombre d'étages" value={String(bien.nb_etages)} />}
                {bien.annee_construction && <Fact icon="📅" label="Année de construction" value={String(bien.annee_construction)} />}
                {bien.departement && <Fact icon="🗺" label="Département" value={bien.departement} />}
              </div>

            </div>

            {/* Score quartier */}
            {bien.lat && bien.lng && (
              <QuartierScore
                lat={bien.lat}
                lng={bien.lng}
                storedScore={bien.score_quartier ?? null}
                poiWeights={getPoiWeights(siteSettings)}
                seuils={getScoreSeuils(siteSettings)}
              />
            )}

            {/* Performance énergétique */}
            {(bien.dpe || bien.ges) && (
              <div className="bg-white rounded-2xl p-5 border border-navy/08">
                <h2 className="font-medium text-navy mb-4">Performance énergétique</h2>

                {(() => {
                  const LABELS = ['A','B','C','D','E','F','G']
                  // Couleurs officielles étiquette énergie (vert → rouge)
                  const COLORS_DPE = ['#2A9B45','#4EB153','#C3D529','#F5D000','#F0A500','#E05A1B','#C0201A']
                  // Couleurs officielles étiquette GES (bleu clair → noir)
                  const COLORS_GES = ['#9DD4E8','#76B8D8','#4D9DC4','#2E7BAE','#1B5C94','#0F3D72','#071E45']
                  // Largeurs progressives pour simuler les flèches officielles DPE
                  const WIDTHS = [52, 62, 72, 82, 92, 102, 112]

                  const DpeArrows = ({
                    active, value, unit, title, colors,
                  }: { active: string; value?: number | null; unit: string; title: string; colors: string[] }) => (
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-semibold text-navy/40 uppercase tracking-wider mb-2">{title}</p>
                      <div className="flex flex-col gap-px">
                        {LABELS.map((l, i) => {
                          const isActive = l === active
                          const color = colors[i]
                          const w = WIDTHS[i]
                          // Forme chevron via clip-path
                          return (
                            <div key={l} className="flex items-center gap-2 h-6">
                              <div
                                className="flex items-center justify-between pl-2 pr-3 h-full text-[11px] font-bold transition-opacity"
                                style={{
                                  width: w,
                                  background: color,
                                  opacity: isActive ? 1 : 0.18,
                                  clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%)',
                                  color: 'white',
                                  flexShrink: 0,
                                }}
                              >
                                {l}
                              </div>
                              {isActive && value && (
                                <span className="text-[11px] font-semibold text-navy whitespace-nowrap">
                                  {value} <span className="font-normal text-navy/50">{unit}</span>
                                </span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )

                  return (
                    <div className="flex gap-6 flex-wrap">
                      {bien.dpe && (
                        <DpeArrows active={bien.dpe} value={bien.conso_energie} unit="kWh/m².an" title="Énergie" colors={COLORS_DPE} />
                      )}
                      {bien.ges && (
                        <DpeArrows active={bien.ges} value={bien.emissions_co2} unit="kgCO2/m².an" title="Climat" colors={COLORS_GES} />
                      )}
                    </div>
                  )
                })()}

                {/* Dépenses annuelles */}
                {bien.depenses_energie_min && bien.depenses_energie_max && (
                  <div className="mt-4 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
                    <span className="text-sm">💡</span>
                    <div>
                      <span className="text-xs font-semibold text-amber-900">
                        Entre {bien.depenses_energie_min.toLocaleString('fr-FR')} € et {bien.depenses_energie_max.toLocaleString('fr-FR')} €/an
                      </span>
                      <span className="text-[10px] text-amber-600 ml-1.5">estimés</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Options */}
            {(bien.options as string[])?.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-navy/08">
                <h2 className="font-medium text-navy mb-4">Équipements & options</h2>
                <div className="flex flex-wrap gap-2">
                  {(bien.options as string[]).map(opt => (
                    <span key={opt} className="text-xs px-3 py-1.5 rounded-full bg-navy/06 text-navy/70 font-medium">
                      ✓ {OPTIONS_LABELS[opt] ?? opt}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Rapport intelligent */}
            <RapportBien rapport={rapport} />


            {/* Graphique évolution prix */}
            {bien.surface && bien.surface > 0 && (
              <div className="mt-6">
                <PrixEvolutionChart
                  ville={bien.ville}
                  codePostal={bien.code_postal}
                  categorie={bien.categorie}
                  currentPrixM2={Math.round(bien.prix / bien.surface)}
                />
              </div>
            )}


            {/* Meta */}
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-navy/30 px-1">
              {bien.ref_agence && <span>Réf. {bien.ref_agence}</span>}
              {bien.publie_at && <span>Publié le {new Date(bien.publie_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>}
              {bien.expire_at && <span>Expire le {new Date(bien.expire_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>}
              <span>👁 {(bien.vues ?? 0) + 1} vue{((bien.vues ?? 0) + 1) > 1 ? 's' : ''}</span>
              <span>♥ {bien.favoris_count ?? 0} favori{(bien.favoris_count ?? 0) > 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* ── Right column ── */}
          <div>
            <div className="sticky top-20 space-y-4">

              {/* Voir sur la carte */}
              <Link href={`/carte?bien=${bien.id}`}
                className="group flex items-center justify-center gap-2.5 w-full px-5 py-3 rounded-2xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm font-semibold transition-all shadow-lg shadow-[#4F46E5]/25 hover:-translate-y-0.5">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
                  <line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>
                </svg>
                Voir sur la carte
                <svg className="transition-transform group-hover:translate-x-0.5" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </Link>

              {/* Contact card */}
              <div className="bg-white rounded-2xl p-6 border border-navy/08">
                <h2 className="font-medium text-navy mb-4">Contacter l'annonceur</h2>
                <ContactForm
                  bienId={bien.id}
                  vendeurId={bien.user_id}
                  bienTitre={bien.titre}
                  vendeurEmail={vendeurEmail}
                  vendeurNom={vendeurNom}
                  delaiReponse={siteSettings.contact_delai_reponse}
                  antispamMinutes={siteSettings.contact_antispam_minutes}
                />

                {/* Vendor */}
                {vendeur && (
                  <div className="mt-5 pt-5 border-t border-navy/06 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex-shrink-0 overflow-hidden relative flex items-center justify-center"
                      style={{ background: vendeur.logo_url ? 'white' : 'linear-gradient(135deg, #4F46E5, #3730a3)', border: vendeur.logo_url ? '1px solid rgba(15,23,42,0.1)' : 'none' }}>
                      {vendeur.logo_url
                        ? <img src={vendeur.logo_url} alt="" className="w-full h-full object-contain p-1" />
                        : vendeur.avatar_url
                          ? <Image src={vendeur.avatar_url} alt="" fill className="object-cover" sizes="40px" />
                          : <span className="text-white text-sm font-semibold">
                              {(vendeur.prenom?.[0] ?? '').toUpperCase()}{(vendeur.nom?.[0] ?? '').toUpperCase()}
                            </span>
                      }
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-navy">{vendeur.prenom} {vendeur.nom}</div>
                      <div className="text-xs text-navy/40">
                        {vendeur.agence ?? (vendeur.type === 'pro' ? 'Professionnel' : 'Particulier')}
                      </div>
                    </div>
                    <Link
                      href={`/vendeur/${bien.user_id}`}
                      className="text-xs text-[#4F46E5] hover:underline flex-shrink-0"
                    >
                      Voir le profil →
                    </Link>
                  </div>
                )}

              </div>

              {/* Simulateur de crédit (vente uniquement) */}
              {bien.type === 'vente' && bien.prix > 0 && (
                <SimulateurCredit prixBien={bien.prix} />
              )}

              {/* Demande de visite */}
              <DemandeVisiteForm
                bienId={bien.id}
                vendeurId={bien.user_id}
                bienTitre={bien.titre}
                userId={user?.id}
              />
            </div>
          </div>
        </div>

        {/* ── Biens similaires ── */}
        {(similaires ?? []).length > 0 && (
          <section className="mt-16">
            <h2 className="font-serif text-2xl text-navy mb-6">
              Biens similaires à {bien.ville}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {(similaires as BienPublic[]).map(b => (
                <SimilaireCard key={b.id} bien={b} />
              ))}
            </div>
          </section>
        )}
      </div>
      <SiteFooter />
    </div>
  )
}

// ── Composants internes ─────────────────────────────────────────

function Fact({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="text-lg leading-none mt-0.5 flex-shrink-0">{icon}</span>
      <div>
        <div className="text-xs text-navy/40 mb-0.5">{label}</div>
        <div className="text-sm font-medium text-navy">{value}</div>
      </div>
    </div>
  )
}

const CAT_ICON_SIMILAIRE: Record<string, string> = {
  appartement: '🏛️', maison: '🌿', bureau: '🏢',
  terrain: '🌱', parking: '🅿️', local: '🏪',
}

const DPE_COLORS_SIM: Record<string, string> = {
  A: '#2E7D32', B: '#558B2F', C: '#9E9D24',
  D: '#F9A825', E: '#EF6C00', F: '#D84315', G: '#B71C1C',
}

function SimilaireCard({ bien }: { bien: BienPublic }) {
  const prix = formatPrix(bien.prix, bien.type)
  const icon = CAT_ICON_SIMILAIRE[bien.categorie] ?? '🏠'

  return (
    <Link href={`/annonce/${bien.id}`}
      className="bg-white rounded-2xl overflow-hidden border border-navy/08 hover:border-primary/40 hover:-translate-y-0.5 transition-all block group">
      {/* Photo */}
      <div className="relative h-36 bg-gradient-to-br from-[#e0ddd8] to-[#c8c4bc] overflow-hidden">
        {bien.photo_url
          ? <Image src={bien.photo_url} alt={bien.titre} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" />
          : <div className="w-full h-full flex items-center justify-center text-4xl opacity-20">{icon}</div>
        }
        <span className="absolute top-2 left-2 text-xs font-semibold px-2 py-0.5 rounded text-white"
          style={{ background: bien.type === 'vente' ? '#4F46E5' : '#0891B2' }}>
          {bien.type === 'vente' ? 'Vente' : 'Location'}
        </span>
      </div>
      {/* Infos */}
      <div className="p-3">
        <div className="font-serif text-base text-navy leading-tight">
          {prix}
        </div>
        <div className="text-xs font-medium text-navy mt-0.5 truncate">{bien.titre}</div>
        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-navy/50">
          {bien.surface && <span>{bien.surface} m²</span>}
          {(bien.pieces ?? 0) > 0 && <span>{bien.pieces} p.</span>}
          {bien.dpe && (
            <span className="ml-auto text-white font-bold px-1.5 py-0.5 rounded text-[9px]"
              style={{ background: DPE_COLORS_SIM[bien.dpe] }}>
              {bien.dpe}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}