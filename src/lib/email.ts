import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
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

/**
 * Benachrichtigt einen User darüber, dass er seinen Community-Status verloren
 * hat und sein Abo am Periodenende ausläuft. Enthält Link zum Re-Abschluss
 * zu den neuen (Alumni/Basic-)Preisen.
 */
export async function notifyCommunityDowngrade({
  userId,
  periodEnd,
}: {
  userId: string
  periodEnd: string
}): Promise<void> {
  const resend = getResend()
  if (!resend) {
    console.log('[email] RESEND_API_KEY nicht gesetzt — Skip community-downgrade mail')
    return
  }

  const admin = createAdminClient()
  const { data: authUser } = await admin.auth.admin.getUserById(userId)
  const email = authUser?.user?.email
  if (!email) {
    console.warn('[email] community-downgrade: keine Email für user', userId)
    return
  }

  const endDate = new Date(periodEnd).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  const html = renderEmail({
    heading: 'Deine Community-Mitgliedschaft ist beendet',
    intro: `Hey,<br><br>dein Zugang zum KI Marketing Club wurde beendet.<br><br>Dein bestehendes Abo läuft noch bis zum <strong>${endDate}</strong> weiter — bis dahin hast du vollen Zugriff auf Herr Tech GPT und die KI Toolbox.<br><br>Danach endet das Abo automatisch. Du kannst jederzeit zu den regulären Alumni-Preisen neu abschließen. Dein Classroom-Zugang bleibt als Alumni lebenslang erhalten.`,
    cta: {
      label: 'Neuen Plan wählen',
      href: `${PRODUCTION_URL}/dashboard/pricing`,
    },
    footerNote: 'Keine Sorge — du verlierst keine Daten. Wir freuen uns, wenn du dabei bleibst.',
  })

  try {
    await resend.emails.send({
      from: fromAddress(),
      to: email,
      subject: 'Deine Community-Mitgliedschaft ist beendet',
      html,
    })
  } catch (err) {
    console.error('[email] community-downgrade send failed:', err)
  }
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

  const ticketUrl = `${PRODUCTION_URL}/admin/tickets/${conversationId}`

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
