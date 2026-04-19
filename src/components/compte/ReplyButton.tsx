'use client'

import { useState } from 'react'

interface Props {
  toEmail: string
  toName: string
  bienTitre?: string
}

export default function ReplyButton({ toEmail, toName, bienTitre }: Props) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')

  const subject = bienTitre
    ? `Re: votre demande concernant "${bienTitre}"`
    : 'Re: votre demande immobilière'

  function sendReply() {
    const body = message.trim() || ''
    const mailto = `mailto:${toEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.open(mailto)
    setOpen(false)
    setMessage('')
  }

  return (
    <div>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="text-xs bg-navy text-white px-3 py-1.5 rounded-lg hover:bg-primary transition-colors"
        >
          ↩ Répondre
        </button>
      ) : (
        <div className="mt-3 border border-navy/12 rounded-xl overflow-hidden bg-surface">
          <div className="px-3 py-2 border-b border-navy/08 text-xs text-navy/50">
            À : <span className="font-medium text-navy">{toName}</span> &lt;{toEmail}&gt;
          </div>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Votre réponse…"
            autoFocus
            rows={4}
            className="w-full text-sm px-3 py-2.5 bg-transparent focus:outline-none resize-none placeholder:text-navy/25"
          />
          <div className="flex justify-end gap-2 px-3 py-2 border-t border-navy/08">
            <button onClick={() => { setOpen(false); setMessage('') }}
              className="text-xs text-navy/50 hover:text-navy transition-colors">
              Annuler
            </button>
            <button onClick={sendReply}
              className="text-xs bg-navy text-white px-4 py-1.5 rounded-lg hover:bg-primary transition-colors">
              Ouvrir dans ma messagerie →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}



