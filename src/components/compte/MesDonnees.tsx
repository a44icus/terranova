'use client'

import { useState } from 'react'
import { supprimerMonCompte } from '@/app/compte/profil/rgpd-actions'

/** Section « Mes données » du profil : export (RGPD art. 20) et suppression du compte (art. 17). */
export default function MesDonnees() {
  const [ouvert, setOuvert]           = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [enCours, setEnCours]         = useState(false)
  const [erreur, setErreur]           = useState('')

  async function supprimer() {
    setEnCours(true)
    setErreur('')
    // En cas de succès, l'action redirige vers l'accueil
    const res = await supprimerMonCompte(confirmation)
    if (res?.error) setErreur(res.error)
    setEnCours(false)
  }

  return (
    <section className="mt-8 space-y-4" aria-labelledby="mes-donnees-titre">
      <h2 id="mes-donnees-titre" className="font-serif text-xl text-navy">Mes données</h2>

      <div className="bg-white rounded-2xl border border-navy/08 p-5">
        <p className="text-sm font-medium text-navy mb-1">Télécharger mes données</p>
        <p className="text-xs text-navy/50 mb-3">
          Profil, annonces, favoris, alertes, messages et visites, dans un fichier JSON.
        </p>
        <a href="/api/compte/export" download
          className="inline-block border border-navy/15 text-navy/70 px-4 py-2 rounded-lg text-sm font-medium hover:border-navy/30 transition-colors">
          Télécharger
        </a>
      </div>

      <div className="border border-red-200 rounded-2xl p-5 bg-red-50">
        <p className="text-sm font-medium text-red-800 mb-1">Supprimer mon compte</p>
        <p className="text-xs text-red-700/80 mb-3">
          Supprime définitivement votre compte, vos annonces, photos, favoris, alertes et messages,
          et résilie votre abonnement. Cette action est irréversible.
        </p>
        {!ouvert ? (
          <button onClick={() => setOuvert(true)}
            className="text-sm font-medium text-red-700 border border-red-300 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors">
            Supprimer mon compte…
          </button>
        ) : (
          <div className="space-y-3">
            <label htmlFor="confirmation-suppression" className="block text-xs text-red-800">
              Tapez <strong>SUPPRIMER</strong> pour confirmer
            </label>
            <input id="confirmation-suppression" value={confirmation} onChange={e => setConfirmation(e.target.value)}
              autoComplete="off"
              className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-red-500" />
            {erreur && <p className="text-xs text-red-700" role="alert">{erreur}</p>}
            <div className="flex gap-2">
              <button onClick={supprimer} disabled={enCours || confirmation.trim().toUpperCase() !== 'SUPPRIMER'}
                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-40 transition-colors">
                {enCours ? 'Suppression…' : 'Supprimer définitivement'}
              </button>
              <button onClick={() => { setOuvert(false); setConfirmation(''); setErreur('') }}
                className="px-4 py-2 rounded-lg text-sm text-navy/60 hover:text-navy transition-colors">
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
