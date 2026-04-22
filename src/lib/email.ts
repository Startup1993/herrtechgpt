import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { renderEmail } from './email-template'

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  return new Resend(key)
}

function fromAddress(): string {
  return process.env.RESEND_FROM_EMAIL ?? 'Herr Tech <onboarding@resend.dev>'
}

function baseUrl(): string {
  return (process.env.NEXT_PUBLIC_BASE_URL ?? 'https://herr.tech').replace(/\/$/, '')
}

// Sendet eine Benachrichtigung an alle Admins über ein neues Support-Ticket.
// Läuft still durch, wenn keine Config vorhanden ist.
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
  const { data: adminProfiles } = await admin.from('profiles').select('id').eq('role', 'admin')
  if (!adminProfiles || adminProfiles.length === 0) return

  const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const adminIds = new Set(adminProfiles.map((p) => p.id))
  const adminEmails = users
    .filter((u) => adminIds.has(u.id) && u.email)
    .map((u) => u.email!)

  if (adminEmails.length === 0) return

  const ticketUrl = `${baseUrl()}/admin/tickets/${conversationId}`

  const html = renderEmail({
    heading: 'Neues Support-Ticket',
    intro: `
      <p style="margin:0;"><strong>${escapeHtml(userEmail)}</strong> hat den Support-Chat aktiviert und wartet auf eine Antwort.</p>
    `,
    cta: { label: 'Ticket öffnen', href: ticketUrl },
    preheader: `Neues Support-Ticket von ${userEmail}`,
  })

  try {
    await resend.emails.send({
      from: fromAddress(),
      to: adminEmails,
      subject: `Neues Support-Ticket von ${userEmail}`,
      html,
    })
  } catch (err) {
    console.error('[email] Resend Fehler:', err)
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
