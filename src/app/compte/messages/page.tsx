import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import MarkAsRead from '@/components/compte/MarkAsRead'
import Link from 'next/link'
import StopPropagationWrapper from '@/components/compte/StopPropagationWrapper'

export default async function MessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const adminClient = createAdminClient()

  // Fetch contacts with reply counts
  const { data: contacts } = await adminClient
    .from('contacts')
    .select('*, biens(titre, ville, type, prix), contact_replies(count)')
    .eq('vendeur_id', user.id)
    .order('created_at', { ascending: false })

  const nonLus = contacts?.filter(c => !c.lu).length ?? 0

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="font-serif text-2xl text-navy">Messages</h1>
        <p className="text-sm text-navy/50 mt-0.5">
          {contacts?.length ?? 0} message{(contacts?.length ?? 0) > 1 ? 's' : ''}
          {nonLus > 0 && (
            <span className="ml-2 bg-[#e74c3c] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {nonLus} non lu{nonLus > 1 ? 's' : ''}
            </span>
          )}
        </p>
      </div>

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
                        {!contact.lu && (
                          <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                        )}
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
                  <span className="text-xs text-[#4F46E5] font-medium group-hover:underline">
                    Voir la conversation →
                  </span>
                </div>
              </Link>

              {/* Coordonnées EN DEHORS du Link */}
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
    </div>
  )
}
