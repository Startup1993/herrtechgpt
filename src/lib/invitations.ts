import { Resend } from 'resend'
import type { SupabaseClient } from '@supabase/supabase-js'
import { renderEmail } from './email-template'

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  return new Resend(key)
}

function fromAddress(): string {
  return process.env.RESEND_FROM_EMAIL ?? 'Herr Tech <onboarding@resend.dev>'
}

// Einladungs-Links gehen IMMER auf die Live-Domain — egal von welcher Umgebung
// der Admin sie verschickt. Verhindert, dass neue User versehentlich auf Staging
// landen und dort Daten anlegen.
const PRODUCTION_URL = 'https://world.herr.tech'

// Erzeugt einen Magic-Login-Link via Supabase und versendet ihn per Resend.
export async function sendInvitationEmail(
  admin: SupabaseClient,
  email: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const redirectTo = `${PRODUCTION_URL}/auth/callback?next=/dashboard`

  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo },
  })
  if (error || !data?.properties?.action_link) {
    return { ok: false, error: error?.message ?? 'Link-Erstellung fehlgeschlagen' }
  }

  const resend = getResend()
  if (!resend) {
    return { ok: false, error: 'RESEND_API_KEY nicht konfiguriert' }
  }

  const html = renderEmail({
    heading: 'Willkommen in der Herr Tech World',
    intro: `
      <p style="margin:0 0 10px;">Du wurdest in die Herr Tech World eingeladen — deiner KI-Plattform für Content, Business &amp; Wachstum.</p>
      <p style="margin:0;">Klick auf den Button unten, um dich einzuloggen. Kein Passwort nötig.</p>
    `,
    cta: { label: 'Jetzt einloggen', href: data.properties.action_link },
    footerNote: `
      Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:<br>
      <span style="word-break:break-all; color:#666;">${data.properties.action_link}</span><br><br>
      Der Link ist zeitlich begrenzt gültig und kann nur einmal verwendet werden.
    `,
    preheader: 'Dein persönlicher Login-Link für Herr Tech World',
  })

  try {
    await resend.emails.send({
      from: fromAddress(),
      to: email,
      subject: 'Dein Zugang zur Herr Tech World',
      html,
    })
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Versand fehlgeschlagen' }
  }

  return { ok: true }
}

// Erhöht Invitation-Zähler + Zeitstempel. Fehler werden geschluckt.
export async function recordInvitationSent(admin: SupabaseClient, userId: string): Promise<void> {
  const { data: profile } = await admin
    .from('profiles')
    .select('invitation_sent_count')
    .eq('id', userId)
    .single()
  const current = profile?.invitation_sent_count ?? 0
  await admin
    .from('profiles')
    .update({
      invitation_sent_count: current + 1,
      invitation_last_sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
}
