import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const { agentId, nom, email, telephone, message } = await req.json()
    if (!agentId || !nom || !email || !message) {
      return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
    }

    const admin = createAdminClient()
    const [{ data: agent }, { data: userData }] = await Promise.all([
      admin.from('profiles').select('prenom, nom, agence').eq('id', agentId).single(),
      admin.auth.admin.getUserById(agentId),
    ])

    if (!agent) return NextResponse.json({ error: 'Agent introuvable' }, { status: 404 })

    const agentEmail = userData.user?.email
    const agentName = agent.agence || `${agent.prenom} ${agent.nom}`

    if (agentEmail) {
      await resend.emails.send({
        from: 'Terranova <noreply@terranova-beta.vercel.app>',
        to: agentEmail,
        replyTo: email,
        subject: `Nouveau message de ${nom} via Terranova`,
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#0F172A">
            <h2 style="font-size:20px;margin-bottom:4px">Nouveau message</h2>
            <p style="color:#64748B;font-size:14px;margin-bottom:24px">Via votre profil Terranova</p>
            <div style="background:#F8FAFC;border-radius:12px;padding:20px;margin-bottom:20px">
              <p style="margin:0 0 8px"><strong>De :</strong> ${nom}</p>
              <p style="margin:0 0 8px"><strong>Email :</strong> <a href="mailto:${email}">${email}</a></p>
              ${telephone ? `<p style="margin:0 0 8px"><strong>Téléphone :</strong> ${telephone}</p>` : ''}
              <p style="margin:0 0 4px"><strong>Message :</strong></p>
              <p style="margin:0;white-space:pre-wrap;color:#334155">${message}</p>
            </div>
            <a href="mailto:${email}?subject=Re: votre message sur Terranova"
              style="display:inline-block;background:#4F46E5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
              Répondre à ${nom}
            </a>
          </div>
        `,
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
