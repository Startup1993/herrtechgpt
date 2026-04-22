import { Resend } from 'resend'
import type { SupabaseClient } from '@supabase/supabase-js'
import { renderEmail } from './email-template'
import { PRODUCTION_URL } from './urls'

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  return new Resend(key)
}

function fromAddress(): string {
  return process.env.RESEND_FROM_EMAIL ?? 'Herr Tech <onboarding@resend.dev>'
}

// Erzeugt einen Magic-Login-Link via Supabase und versendet ihn per Resend.
// Nutzt token_hash statt action_link: wir bauen die Callback-URL selbst und
// verifizieren in /auth/callback via verifyOtp serverseitig. So wird die Session
// direkt als Cookie gesetzt und der User ist nach Klick sofort eingeloggt
// (statt wie beim default-Flow auf der Login-Seite zu landen, weil Supabase
// Tokens im URL-Fragment liefert, das der Server nicht sieht).
export async function sendInvitationEmail(
  admin: SupabaseClient,
  email: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  })
  const hashedToken = data?.properties?.hashed_token
  if (error || !hashedToken) {
    return { ok: false, error: error?.message ?? 'Link-Erstellung fehlgeschlagen' }
  }

  const params = new URLSearchParams({
    token_hash: hashedToken,
    type: 'magiclink',
    next: '/dashboard',
  })
  const loginLink = `${PRODUCTION_URL}/auth/callback?${params.toString()}`

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
    cta: { label: 'Jetzt einloggen', href: loginLink },
    footerNote: `
      Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:<br>
      <span style="word-break:break-all; color:#666;">${loginLink}</span><br><br>
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
