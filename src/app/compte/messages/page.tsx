import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { getViewUserId } from '@/lib/impersonation'
import MarkAsRead from '@/components/compte/MarkAsRead'
import MarkChercheurContactRead from '@/components/compte/MarkChercheurContactRead'
import Link from 'next/link'
import StopPropagationWrapper from '@/components/compte/StopPropagationWrapper'
import PageHeader from '@/components/compte/ui/PageHeader'
import EmptyState from '@/components/compte/ui/EmptyState'

interface Props {
  searchParams: Promise<{ tab?: string }>
}

export default async function MessagesPage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { tab: rawTab } = await searchParams
  const adminClient = createAdminClient()
  const viewId = await getViewUserId() ?? user.id

  // Check if user has a chercheur profile
  const { data: recherche } = await adminClient
    .from('recherches')
    .select('id, actif')
    .eq('user_id', viewId)
    .single()

  const hasRecherche = !!recherche
  const tab = rawTab === 'recherche' && hasRecherche ? 'recherche' : 'annonces'

  // Fetch vendeur contacts (buyer→seller)
  const { data: contacts } = await adminClient
    .from('contacts')
    .select('*, biens(titre, ville, type, prix), contact_replies(count)')
    .eq('vendeur_id', viewId)
    .order('created_at', { ascending: false })

  // Fetch chercheur contacts (seller→buyer) only if needed
  const { data: contactsChercheur } = tab === 'recherche'
    ? await adminClient
        .from('contacts_chercheurs')
        .select('*')
        .eq('chercheur_id', viewId)
        .order('created_at', { ascending: false })
    : { data: null }

  const nonLusVendeur = contacts?.filter(c => !c.lu).length ?? 0
  const nonLusChercheur = contactsChercheur?.filter(c => !c.lu).length ?? 0

  // Count unread chercheur contacts for badge (even when on annonces tab)
  const { count: unreadChercheurCount } = hasRecherche && tab === 'annonces'
    ? await adminClient
        .from('contacts_chercheurs')
        .select('id', { count: 'exact', head: true })
        .eq('chercheur_id', viewId)
        .eq('lu', false)
    : { count: null }

  const chercheurBadge = tab === 'recherche' ? nonLusChercheur : (unreadChercheurCount ?? 0)

  return (
    <div className="p-4 sm:p-8 max-w-3xl">
      <PageHeader title="Messages" />

      {/* Tabs — only show if user has a chercheur profile */}
      {hasRecherche && (
        <div className="flex gap-1 mb-6 bg-navy/04 rounded-xl p-1">
          <Link
            href="/compte/messages?tab=annonces"
            className={`flex-1 text-center py-2 rounded-lg text-sm font-medium transition-all relative ${tab === 'annonces' ? 'bg-white text-navy shadow-sm' : 'text-navy/50 hover:text-navy'}`}
          >
            Mes annonces
            {nonLusVendeur > 0 && (
              <span className="ml-1.5 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {nonLusVendeur}
              </span>
            )}
          </Link>
          <Link
            href="/compte/messages?tab=recherche"
            className={`flex-1 text-center py-2 rounded-lg text-sm font-medium transition-all ${tab === 'recherche' ? 'bg-white text-navy shadow-sm' : 'text-navy/50 hover:text-navy'}`}
          >
            Ma recherche
            {chercheurBadge > 0 && (
              <span className="ml-1.5 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {chercheurBadge}
              </span>
            )}
          </Link>
        </div>
      )}

      {/* ── Onglet Annonces (vendeur reçoit des acheteurs) ── */}
      {tab === 'annonces' && (
        <>
          <p className="text-sm text-navy/50 mb-4">
            {contacts?.length ?? 0} message{(contacts?.length ?? 0) > 1 ? 's' : ''}
            {nonLusVendeur > 0 && (
              <span className="ml-2 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {nonLusVendeur} non lu{nonLusVendeur > 1 ? 's' : ''}
              </span>
            )}
          </p>

          {!contacts?.length ? (
            <div className="bg-white rounded-2xl border border-navy/08 py-16 text-center">
              <div className="text-4xl mb-3">✉</div>
              <p className="text-sm text-navy/50">Aucun message reçu pour l'instant</p>
            </div>
          ) : (
            <div className="space-y-3">
              {contacts.map((contact: any) => {
                const replyCount = contact.contact_replies?.[0]?.count ?? 0
                return (
                  <div key={contact.id}
                    className={`bg-white rounded-2xl border overflow-hidden transition-all group ${!contact.lu ? 'border-primary/30 shadow-sm' : 'border-navy/08'}`}>
                    <Link href={`/compte/messages/${contact.id}`} className="block p-5 hover:bg-surface/60 transition-colors">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-navy text-white flex items-center justify-center text-sm font-medium flex-shrink-0">
                            {contact.nom?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-navy">{contact.nom}</span>
                              {!contact.lu && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                              {replyCount > 0 && (
                                <span className="text-[10px] bg-navy/08 text-navy/60 px-1.5 py-0.5 rounded-full font-medium">
                                  {replyCount} réponse{replyCount > 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-navy/45">
                              {new Date(contact.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!contact.lu && (
                            <StopPropagationWrapper>
                              <MarkAsRead contactId={contact.id} />
                            </StopPropagationWrapper>
                          )}
                        </div>
                      </div>

                      {contact.biens && (
                        <div className="bg-surface rounded-lg px-3 py-2 mb-3 text-xs text-navy/60">
                          📌 Re: <span className="font-medium text-navy">{contact.biens.titre}</span> · {contact.biens.ville}
                        </div>
                      )}

                      <p className="text-sm text-navy/80 leading-relaxed mb-3 line-clamp-2">{contact.message}</p>

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-navy/06">
                        <span className="text-xs text-primary font-medium group-hover:underline">
                          Voir la conversation →
                        </span>
                      </div>
                    </Link>

                    <div className="flex gap-4 text-xs text-navy/50 px-5 pb-4">
                      <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 hover:text-primary transition-colors">
                        ✉ {contact.email}
                      </a>
                      {contact.telephone && (
                        <a href={`tel:${contact.telephone}`} className="flex items-center gap-1.5 hover:text-primary transition-colors">
                          📞 {contact.telephone}
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ── Onglet Recherche (chercheur reçoit des vendeurs) ── */}
      {tab === 'recherche' && (
        <>
          <p className="text-sm text-navy/50 mb-4">
            {contactsChercheur?.length ?? 0} vendeur{(contactsChercheur?.length ?? 0) > 1 ? 's' : ''} vous ont contacté
            {nonLusChercheur > 0 && (
              <span className="ml-2 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {nonLusChercheur} non lu{nonLusChercheur > 1 ? 's' : ''}
              </span>
            )}
          </p>

          {!contactsChercheur?.length ? (
            <div className="bg-white rounded-2xl border border-navy/08 py-16 text-center">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-sm text-navy/50">Aucun vendeur ne vous a encore contacté</p>
              <p className="text-xs text-navy/35 mt-1">Votre profil chercheur est visible sur <a href="/chercheurs" className="text-primary hover:underline">/chercheurs</a></p>
            </div>
          ) : (
            <div className="space-y-3">
              {contactsChercheur.map((contact: any) => (
                <div key={contact.id}
                  className={`bg-white rounded-2xl border p-5 transition-all ${!contact.lu ? 'border-primary/30 shadow-sm' : 'border-navy/08'}`}>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#3B6B3E] text-white flex items-center justify-center text-sm font-medium flex-shrink-0">
                        {contact.vendeur_nom?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-navy">{contact.vendeur_nom}</span>
                          {!contact.lu && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                        </div>
                        <div className="text-xs text-navy/45">
                          {new Date(contact.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                    {!contact.lu && (
                      <StopPropagationWrapper>
                        <MarkChercheurContactRead contactId={contact.id} />
                      </StopPropagationWrapper>
                    )}
                  </div>

                  <p className="text-sm text-navy/80 leading-relaxed mb-3">{contact.message}</p>

                  <div className="flex flex-wrap gap-4 text-xs text-navy/50 pt-3 border-t border-navy/06">
                    <a href={`mailto:${contact.vendeur_email}`} className="flex items-center gap-1.5 hover:text-primary transition-colors">
                      ✉ {contact.vendeur_email}
                    </a>
                    {contact.vendeur_tel && (
                      <a href={`tel:${contact.vendeur_tel}`} className="flex items-center gap-1.5 hover:text-primary transition-colors">
                        📞 {contact.vendeur_tel}
                      </a>
                    )}
                    <a href={`mailto:${contact.vendeur_email}?subject=Re: votre bien sur Terranova`}
                      className="ml-auto flex items-center gap-1 text-primary font-medium hover:underline">
                      Répondre par email →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
