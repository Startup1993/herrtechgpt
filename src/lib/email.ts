import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  return new Resend(key)
}

function fromAddress(): string {
  return process.env.RESEND_FROM_EMAIL ?? 'Herr Tech Support <onboarding@resend.dev>'
}

// Sendet eine Benachrichtigung an alle Admins \u00fcber ein neues Support-Ticket.
// L\u00e4uft still durch, wenn keine Config vorhanden ist.
export async function notifyAdminsNewTicket({
  conversationId,
  userEmail,
}: {
  conversationId: string
  userEmail: string
}): Promise<void> {
  const resend = getResend()
  if (!resend) {
    console.log('[email] RESEND_API_KEY nicht gesetzt — Skip admin notification')
    return
  }

  const admin = createAdminClient()
  // Alle Admin-Profile + deren Auth-Emails holen
  const { data: adminProfiles } = await admin.from('profiles').select('id').eq('role', 'admin')
  if (!adminProfiles || adminProfiles.length === 0) return

  const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const adminIds = new Set(adminProfiles.map((p) => p.id))
  const adminEmails = users
    .filter((u) => adminIds.has(u.id) && u.email)
    .map((u) => u.email!)

  if (adminEmails.length === 0) return

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.herrtechgpt.de'
  const ticketUrl = `${baseUrl}/admin/tickets/${conversationId}`

  try {
    await resend.emails.send({
      from: fromAddress(),
      to: adminEmails,
      subject: `Neues Support-Ticket von ${userEmail}`,
      html: `
        <div style="font-family: -apple-system, system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #B598E2; margin: 0 0 16px;">Neues Support-Ticket</h2>
          <p style="color: #444; font-size: 14px; line-height: 1.6;">
            <strong>${userEmail}</strong> hat den Support-Chat aktiviert und wartet auf eine Antwort.
          </p>
          <p style="margin-top: 24px;">
            <a href="${ticketUrl}"
               style="display: inline-block; background: #B598E2; color: white; padding: 12px 20px;
                      border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
              Ticket \u00f6ffnen \u2192
            </a>
          </p>
          <p style="color: #999; font-size: 12px; margin-top: 32px;">
            Diese E-Mail wurde automatisch von Herr Tech GPT gesendet.
          </p>
        </div>
      `,
    })
  } catch (err) {
    console.error('[email] Resend Fehler:', err)
  }
}
