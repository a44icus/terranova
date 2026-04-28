import { createAdminClient } from '@/lib/supabase/admin'
import { startImpersonation, changeUserType } from './actions'
import Link from 'next/link'

const TYPE_LABEL: Record<string, string> = {
  pro: 'Pro',
  particulier: 'Particulier',
}
const TYPE_STYLE: Record<string, string> = {
  pro: 'bg-primary/10 text-primary',
  particulier: 'bg-navy/08 text-navy/60',
}

export default async function AdminUtilisateursPage() {
  const admin = createAdminClient()

  const { data: profiles } = await admin
    .from('profiles')
    .select('id, prenom, nom, email, type, annonces_actives, created_at, reseau_id, reseaux(nom)')
    .order('created_at', { ascending: false })
    .limit(500)

  const pros = profiles?.filter(p => p.type === 'pro') ?? []
  const particuliers = profiles?.filter(p => p.type !== 'pro') ?? []

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-[#0F172A] mb-1">Utilisateurs</h1>
        <p className="text-sm text-[#0F172A]/50">
          {profiles?.length ?? 0} comptes · Cliquez sur <strong>Simuler</strong> pour voir le compte d'un utilisateur.
        </p>
      </div>

      {/* Pros */}
      <section className="mb-10">
        <h2 className="text-xs font-semibold text-[#0F172A]/40 uppercase tracking-widest mb-3">
          Professionnels ({pros.length})
        </h2>
        <div className="bg-white rounded-2xl border border-[#0F172A]/08 overflow-hidden">
          {pros.length === 0 ? (
            <p className="text-sm text-[#0F172A]/40 text-center py-10">Aucun pro</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#0F172A]/06 text-[#0F172A]/40 text-xs font-medium">
                  <th className="text-left px-5 py-3">Nom</th>
                  <th className="text-left px-5 py-3 hidden sm:table-cell">Email</th>
                  <th className="text-left px-5 py-3 hidden md:table-cell">Réseau</th>
                  <th className="text-center px-5 py-3 hidden sm:table-cell">Annonces</th>
                  <th className="text-left px-5 py-3 hidden lg:table-cell">Inscrit le</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {pros.map((p: any) => (
                  <tr key={p.id} className="border-b border-[#0F172A]/06 last:border-b-0 hover:bg-[#0F172A]/02 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-semibold flex-shrink-0">
                          {p.prenom?.[0]?.toUpperCase()}{p.nom?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-[#0F172A]">{p.prenom} {p.nom}</div>
                          <div className="text-xs text-[#0F172A]/40 sm:hidden">{p.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[#0F172A]/60 hidden sm:table-cell">
                      <a href={`mailto:${p.email}`} className="hover:text-primary transition-colors">{p.email}</a>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      {p.reseaux?.nom ? (
                        <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{p.reseaux.nom}</span>
                      ) : (
                        <span className="text-xs text-[#0F172A]/30">Indépendant</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center hidden sm:table-cell">
                      <span className="font-medium text-[#0F172A]">{p.annonces_actives ?? 0}</span>
                    </td>
                    <td className="px-5 py-3.5 text-[#0F172A]/40 text-xs hidden lg:table-cell">
                      {new Date(p.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center gap-2 justify-end flex-wrap">
                        <Link href={`/annonces?vendeur=${p.id}`} target="_blank"
                          className="text-xs border border-[#0F172A]/15 px-3 py-1.5 rounded-lg hover:border-[#0F172A]/30 text-[#0F172A]/50 transition-colors">
                          Annonces
                        </Link>
                        <Link href={`/vendeur/${p.id}`} target="_blank"
                          className="text-xs border border-[#0F172A]/15 px-3 py-1.5 rounded-lg hover:border-[#0F172A]/30 text-[#0F172A]/50 transition-colors">
                          Fiche
                        </Link>
                        <form action={changeUserType.bind(null, p.id, 'particulier')}>
                          <button type="submit"
                            className="text-xs border border-amber-200 text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-colors">
                            → Particulier
                          </button>
                        </form>
                        <form action={startImpersonation.bind(null, p.id)}>
                          <button type="submit"
                            className="text-xs bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary/80 transition-colors font-medium">
                            Simuler
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Particuliers */}
      <section>
        <h2 className="text-xs font-semibold text-[#0F172A]/40 uppercase tracking-widest mb-3">
          Particuliers ({particuliers.length})
        </h2>
        <div className="bg-white rounded-2xl border border-[#0F172A]/08 overflow-hidden">
          {particuliers.length === 0 ? (
            <p className="text-sm text-[#0F172A]/40 text-center py-10">Aucun particulier</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#0F172A]/06 text-[#0F172A]/40 text-xs font-medium">
                  <th className="text-left px-5 py-3">Nom</th>
                  <th className="text-left px-5 py-3 hidden sm:table-cell">Email</th>
                  <th className="text-left px-5 py-3 hidden lg:table-cell">Inscrit le</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {particuliers.map((p: any) => (
                  <tr key={p.id} className="border-b border-[#0F172A]/06 last:border-b-0 hover:bg-[#0F172A]/02 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-navy/10 text-navy/60 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                          {p.prenom?.[0]?.toUpperCase()}{p.nom?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-[#0F172A]">{p.prenom} {p.nom}</div>
                          <div className="text-xs text-[#0F172A]/40 sm:hidden">{p.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[#0F172A]/60 hidden sm:table-cell">
                      <a href={`mailto:${p.email}`} className="hover:text-primary transition-colors">{p.email}</a>
                    </td>
                    <td className="px-5 py-3.5 text-[#0F172A]/40 text-xs hidden lg:table-cell">
                      {new Date(p.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <form action={changeUserType.bind(null, p.id, 'pro')}>
                          <button type="submit"
                            className="text-xs border border-green-200 text-green-700 bg-green-50 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors">
                            → Pro
                          </button>
                        </form>
                        <form action={startImpersonation.bind(null, p.id)}>
                          <button type="submit"
                            className="text-xs bg-navy text-white px-3 py-1.5 rounded-lg hover:bg-primary transition-colors font-medium">
                            Simuler
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  )
}
