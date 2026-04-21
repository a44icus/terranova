'use client'

interface Props {
  message: string
  type?: 'success' | 'error' | 'info'
  onClose?: () => void
}

export default function Toast({ message, type = 'info', onClose }: Props) {
  const colors = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-[#0F172A]',
  }

  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 ${colors[type]} text-white px-5 py-3 rounded-xl text-sm shadow-lg flex items-center gap-3 z-50`}>
      <span>{message}</span>
      {onClose && (
        <button onClick={onClose} className="text-white/60 hover:text-white ml-2">✕</button>
      )}
    </div>
  )
}
