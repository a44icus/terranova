'use client'
import { useState, useTransition, useRef } from 'react'
import { sendReply } from '@/app/compte/messages/[id]/actions'

export default function ReplyForm({ contactId }: { contactId: string }) {
  const [text, setText] = useState('')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleSubmit() {
    if (!text.trim()) return
    setError('')
    startTransition(async () => {
      const res = await sendReply(contactId, text)
      if (res.error) { setError(res.error); return }
      setText('')
      textareaRef.current?.focus()
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-[#0F172A]/08 p-4">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit() }}
        placeholder="Votre réponse… (Ctrl+Entrée pour envoyer)"
        rows={3}
        className="w-full text-sm text-[#0F172A] resize-none focus:outline-none placeholder:text-[#0F172A]/30"
      />
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#0F172A]/06">
        <span className="text-[11px] text-[#0F172A]/25">Ctrl+Entrée pour envoyer</span>
        <button
          onClick={handleSubmit}
          disabled={pending || !text.trim()}
          className="bg-[#4F46E5] text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-[#4338CA] transition-colors disabled:opacity-40"
        >
          {pending ? 'Envoi…' : 'Répondre →'}
        </button>
      </div>
    </div>
  )
}



