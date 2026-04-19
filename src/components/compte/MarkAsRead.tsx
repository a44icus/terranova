'use client'

import { useTransition } from 'react'
import { markContactAsRead } from '@/app/compte/messages/actions'

export default function MarkAsRead({ contactId }: { contactId: string }) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      await markContactAsRead(contactId)
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="text-[10px] text-navy/40 border border-navy/15 px-2 py-1 rounded-lg hover:border-primary/40 hover:text-primary transition-colors flex-shrink-0 disabled:opacity-40">
      {isPending ? '…' : 'Marquer lu'}
    </button>
  )
}



