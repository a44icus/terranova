/**
 * Cron — Alertes nouveaux biens
 *
 * À appeler toutes les heures (Vercel Cron ou appel HTTP avec CRON_SECRET).
 * Pour chaque alerte active, cherche les biens publiés depuis sa dernière notification
 * (derniere_notif_at, ou sa création) et envoie un email à l'abonné s'il y a un match.
 * Un passage en retard ou sauté ne perd donc rien, et deux passages rapprochés
 * n'envoient pas deux fois les mêmes biens.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkCronAuth } from '@/lib/cronAuth'
import { signalerErreur } from '@/lib/alertesErreurs'
import { escHtml, emailLayout, emailEyebrow, emailTitle, sendEmail, getDbEmailConfig } from '@/lib/emails'
import { SITE_NAME, SITE_URL } from '@/lib/site'

/** Ancienneté maximale d'un bien pour être notifié (évite d'envoyer un historique entier). */
const FENETRE_MAX_MS = 7 * 24 * 60 * 60 * 1000

// GET pour Vercel Cron, POST pour les appels externes
export async function GET(req: NextRequest) { return POST(req) }

export async function POST(req: NextRequest) {
  const refus = checkCronAuth(req, 'new-biens')
  if (refus) return refus

  // Borne haute fixée avant toute lecture : un bien publié pendant l'exécution
  // sera pris au passage suivant au lieu d'être couvert par derniere_notif_at.
  const runAt = new Date()
  const admin = createAdminClient()

  /* Config email saisie dans l'admin (/compte/admin/email) */
  const config = await getDbEmailConfig()
  if (!config?.enabled) {
    return NextResponse.json({ ok: true, skipped: true, reason: 'email non configuré' })
  }

  /* Alertes actives */
  const { data: alertes } = await admin
    .from('alertes')
    .select('*')
    .eq('active', true)

  if (!alertes?.length) {
    return NextResponse.json({ ok: true, sent: 0, reason: 'aucune alerte active' })
  }

  /* Seuil propre à chaque alerte : dernière notification, sinon création, borné à FENETRE_MAX_MS */
  const plancher = runAt.getTime() - FENETRE_MAX_MS
  const seuilDe = (alerte: { derniere_notif_at?: string | null; created_at?: string | null }) => {
    const t = Date.parse(alerte.derniere_notif_at ?? alerte.created_at ?? '')
    return Number.isNaN(t) ? runAt.getTime() - 60 * 60 * 1000 : Math.max(t, plancher)
  }
  const seuilMin = Math.min(...alertes.map(seuilDe))

  /* Biens publiés depuis le plus ancien seuil */
  const { data: nouveauxBiens, error: biensError } = await admin
    .from('biens')
    .select('id, titre, ville, code_postal, type, categorie, prix, surface, pieces, photo_url, publie_at')
    .eq('statut', 'publie')
    .gt('publie_at', new Date(seuilMin).toISOString())
    .lte('publie_at', runAt.toISOString())

  if (biensError) {
    console.error('[Cron new-biens] Lecture des biens impossible:', biensError.message)
    await signalerErreur({ source: 'Cron new-biens', erreur: biensError.message })
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
  if (!nouveauxBiens?.length) {
    return NextResponse.json({ ok: true, sent: 0, reason: 'aucun nouveau bien' })
  }

  let sent = 0

  for (const alerte of alertes) {
    /* Biens qui matchent CETTE alerte, publiés depuis sa dernière notification */
    const seuil = seuilDe(alerte)
    const matches = nouveauxBiens.filter(b => {
      if (Date.parse(b.publie_at) <= seuil) return false
      if (alerte.type     && alerte.type     !== b.type)     return false
      if (alerte.categorie && alerte.categorie !== b.categorie) return false
      if (alerte.ville    && !b.ville.toLowerCase().includes(alerte.ville.toLowerCase())) return false
      if (alerte.prix_max && b.prix > alerte.prix_max)        return false
      if (alerte.surface_min && b.surface && b.surface < alerte.surface_min) return false
      return true
    })

    if (!matches.length) continue

    /* Construire les cartes HTML */
    const cards = matches.map(b => {
      const prixLabel = b.type === 'location'
        ? `${b.prix.toLocaleString('fr-FR')} €/mois`
        : b.prix >= 1_000_000
          ? `${(b.prix / 1_000_000).toFixed(2).replace(/\.?0+$/, '')} M€`
          : `${b.prix.toLocaleString('fr-FR')} €`

      const imgTag = b.photo_url
        ? `<img src="${escHtml(b.photo_url)}" alt="" width="100%" style="height:160px;object-fit:cover;display:block;">`
        : `<div style="height:80px;background:#E8E5E0;display:flex;align-items:center;justify-content:center;font-size:28px;">🏠</div>`

      return `
        <div style="border:1px solid #E2E0DB;border-radius:12px;overflow:hidden;margin-bottom:16px;">
          ${imgTag}
          <div style="padding:16px;">
            <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#0F172A;font-family:Georgia,serif;">${prixLabel}</p>
            <p style="margin:0 0 4px;font-size:13px;color:#0F172A;">${escHtml(b.titre)}</p>
            <p style="margin:0 0 12px;font-size:12px;color:#64748B;">📍 ${escHtml(b.ville)} ${escHtml(b.code_postal ?? '')}</p>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
              ${b.surface ? `<span style="background:#F1F5F9;border-radius:6px;padding:3px 8px;font-size:11px;color:#64748B;">${b.surface} m²</span>` : ''}
              ${b.pieces  ? `<span style="background:#F1F5F9;border-radius:6px;padding:3px 8px;font-size:11px;color:#64748B;">${b.pieces} pièces</span>` : ''}
              <span style="background:${b.type === 'vente' ? '#EDE9FE' : '#E0F2FE'};color:${b.type === 'vente' ? '#4F46E5' : '#0891B2'};border-radius:6px;padding:3px 8px;font-size:11px;font-weight:600;">${b.type === 'vente' ? 'Vente' : 'Location'}</span>
            </div>
            <a href="${SITE_URL}/annonce/${b.id}" style="display:inline-block;background:#4F46E5;color:#FFF;font-size:12px;font-weight:600;padding:8px 16px;border-radius:8px;text-decoration:none;">
              Voir l'annonce →
            </a>
          </div>
        </div>`
    }).join('')

    const nbLabel = matches.length === 1 ? '1 nouveau bien correspond' : `${matches.length} nouveaux biens correspondent`

    const criteres = [
      alerte.type && (alerte.type === 'vente' ? 'Vente' : 'Location'),
      alerte.categorie,
      alerte.ville,
      alerte.prix_max && `max ${alerte.prix_max.toLocaleString('fr-FR')} €`,
      alerte.surface_min && `min ${alerte.surface_min} m²`,
    ].filter(Boolean).map(escHtml).join(' · ') || 'Tous les biens'

    const html = emailLayout({
      content: `
        ${emailEyebrow('Alerte nouveaux biens')}
        ${emailTitle(`🔔 ${nbLabel} à votre alerte`)}
        <p style="margin:0 0 24px;font-size:13px;color:#64748B;">Critères : ${criteres}</p>
        ${cards}`,
      footer: `${SITE_NAME} · <a href="${SITE_URL}/compte/alertes" style="color:#4F46E5;text-decoration:none;">Gérer mes alertes</a>`,
    })

    const criteresLabel = [
      alerte.type && (alerte.type === 'vente' ? 'Vente' : 'Location'),
      alerte.ville,
    ].filter(Boolean).join(' ')

    const res = await sendEmail({
      apiKey:  config.apiKey,
      from:    config.from,
      to:      alerte.email,
      subject: `🏠 ${nbLabel} — ${criteresLabel || SITE_NAME}`,
      html,
    })

    if (res.ok) {
      await admin.from('alertes')
        .update({ derniere_notif_at: runAt.toISOString() })
        .eq('id', alerte.id)
      sent++
    }
  }

  return NextResponse.json({ ok: true, sent, biens: nouveauxBiens.length })
}
