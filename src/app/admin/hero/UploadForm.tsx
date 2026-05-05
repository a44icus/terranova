'use client'

import { useActionState } from 'react'
import { uploadHeroPhoto } from './actions'

export default function UploadForm() {
  const [error, action, pending] = useActionState(uploadHeroPhoto, null)

  return (
    <form action={action} className="flex flex-col sm:flex-row items-start gap-3">
      <input
        type="file"
        name="file"
        accept="image/jpeg,image/png,image/webp"
        required
        className="text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 file:font-semibold file:text-xs hover:file:bg-indigo-100 transition-all"
      />
      <button
        type="submit"
        disabled={pending}
        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors whitespace-nowrap"
      >
        {pending ? 'Upload en cours…' : 'Uploader'}
      </button>

      {error && (
        <div className="w-full mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2">
          ❌ {error}
        </div>
      )}
    </form>
  )
}
