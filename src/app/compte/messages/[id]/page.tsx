import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { getConversation } from './actions'
import ReplyForm from '@/components/compte/ReplyForm'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'

function formatDate(d: string) {
  return new Date(d).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default async function MessageThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const data = await getConversation(id)
  if (!data) notFound()

  const { contact, replies, userId } = data
  const bien = Array.isArray(contact.biens) ? contact.biens[0] : contact.biens
  const isVendeur = contact.vendeur_id === userId

  // Mark as read
  if (!contact.lu && isVendeur) {
    const adminClient = createAdminClient()
    await adminClient.from('contacts').update({ lu: true }).eq('id', id)
  }

  return (
    <div className="p-8 max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/compte/messages" className="text-sm text-[#0F172A]/40 hover:text-[#0F172A] flex items-center gap-1 mb-4">
          ← Retour aux messages
        </Link>
        {bien && (
          <div className="bg-white rounded-xl border border-[#0F172A]/08 px-4 py-3 flex items-center gap-3 mb-4">
            <span className="text-lg">🏠</span>
            <div>
              <p className="text-sm font-medium text-[#0F172A]">{bien.titre}</p>
              <p className="text-xs text-[#0F172A]/40">{bien.ville}</p>
            </div>
            <Link href={`/annonce/${contact.bien_id}`} className="ml-auto text-xs text-[#4F46E5] hover:underline">Voir →</Link>
          </div>
        )}
        <h1 className="font-serif text-2xl text-[#0F172A]">
          Conversation avec {isVendeur ? contact.nom : 'le vendeur'}
        </h1>
        <p className="text-xs text-[#0F172A]/40 mt-1">{contact.email}{contact.telephone && ` · ${contact.telephone}`}</p>
      </div>

      {/* Thread */}
      <div className="space-y-4 mb-6">
        {/* Message initial */}
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-[#0F172A]/08 flex items-center justify-center text-sm font-medium text-[#0F172A]/60 flex-shrink-0">
            {contact.nom?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-[#0F172A]">{contact.nom}</span>
              <span className="text-xs text-[#0F172A]/30">{formatDate(contact.created_at)}</span>
            </div>
            <div className="bg-white border border-[#0F172A]/08 rounded-2xl rounded-tl-sm px-4 py-3">
              <p className="text-sm text-[#0F172A]/80 whitespace-pre-wrap">{contact.message}</p>
            </div>
          </div>
        </div>

        {/* Réponses */}
        {replies.map((reply: any) => {
          const isMe = reply.auteur_id === userId
          // Nom affiché : "Vous" si c'est l'utilisateur connecté, sinon le nom du contact initial
          const displayName = isMe ? 'Vous' : contact.nom
          const initials = isMe ? '✓' : (contact.nom?.[0]?.toUpperCase() ?? '?')

          return (
            <div key={reply.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 text-white"
                style={{ background: isMe ? '#4F46E5' : '#0F172A' }}
              >
                {initials}
              </div>
              <div className={`flex-1 flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className={`flex items-center gap-2 mb-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                  <span className="text-sm font-medium text-[#0F172A]">{displayName}</span>
                  <span className="text-xs text-[#0F172A]/30">{formatDate(reply.created_at)}</span>
                </div>
                <div
                  className={`px-4 py-3 rounded-2xl max-w-[85%] ${isMe ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
                  style={{
                    background: isMe ? '#4F46E5' : 'white',
                    border: isMe ? 'none' : '1px solid rgba(15,23,42,0.08)',
                  }}
                >
                  <p className={`text-sm whitespace-pre-wrap ${isMe ? 'text-white' : 'text-[#0F172A]/80'}`}>
                    {reply.contenu}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Reply form */}
      <ReplyForm contactId={id} />
    </div>
  )
}
