import { Resend } from 'resend'
import type { SupabaseClient } from '@supabase/supabase-js'
import { renderCoachingInviteEmail, renderEmail } from '@/lib/email-template'
import { applyVariables } from '@/lib/email-templates/registry'
import { loadTemplate } from '@/lib/email-templates/load'
import { PRODUCTION_URL } from '@/lib/urls'

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  return new Resend(key)
}

function fromAddress(): string {
  return process.env.RESEND_FROM_EMAIL ?? 'Herr Tech <onboarding@resend.dev>'
}

/**
 * Coaching-Einladung: Magic-Link direkt auf /dashboard/coaching.
 * Template 'coaching_invite' ist unter /admin/emails editierbar.
 */
export async function sendCoachingInviteEmail(
  admin: SupabaseClient,
  email: string,
  opts: { firstName?: string | null; coachName?: string | null },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email })
  const hashedToken = data?.properties?.hashed_token
  if (error || !hashedToken) {
    return { ok: false, error: error?.message ?? 'Link-Erstellung fehlgeschlagen' }
  }
  const params = new URLSearchParams({ token_hash: hashedToken, type: 'magiclink', next: '/dashboard/coaching' })
  const loginLink = `${PRODUCTION_URL}/auth/confirm?${params.toString()}`

  const resend = getResend()
  if (!resend) return { ok: false, error: 'RESEND_API_KEY nicht konfiguriert' }

  const tpl = await loadTemplate('coaching_invite', admin)
  const vars = { loginLink, firstName: opts.firstName ?? '', coachName: opts.coachName ?? 'dein Coach' }
  const html = renderCoachingInviteEmail({ loginLink, firstName: opts.firstName, coachName: opts.coachName, content: tpl.data })

  try {
    await resend.emails.send({ from: fromAddress(), to: email, subject: applyVariables(tpl.subject, vars), html })
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Versand fehlgeschlagen' }
  }
  return { ok: true }
}

/**
 * Blocker-Alarm an den Coach, wenn der Kunde "Hier hänge ich" drückt.
 * Template 'coaching_blocker_alert'. Ohne Coach-Mail geht die Mail an alle Admins.
 */
export async function sendBlockerAlert(
  admin: SupabaseClient,
  input: { clientName: string; message: string; enrollmentId: string; coachEmail?: string | null },
): Promise<void> {
  const resend = getResend()
  if (!resend) return

  let recipients: string[] = input.coachEmail ? [input.coachEmail] : []
  if (!recipients.length) {
    const { data: admins } = await admin.from('profiles').select('id').eq('role', 'admin')
    const ids = (admins ?? []).map((a) => a.id as string)
    if (ids.length) {
      const { data: users } = await admin.auth.admin.listUsers({ perPage: 1000 })
      recipients = (users?.users ?? []).filter((u) => ids.includes(u.id) && u.email).map((u) => u.email as string)
    }
  }
  if (!recipients.length) return

  const tpl = await loadTemplate('coaching_blocker_alert', admin)
  const vars = { clientName: input.clientName, message: input.message }
  const href = `${PRODUCTION_URL}/admin/coaching/${input.enrollmentId}`
  const html = renderEmail({
    heading: applyVariables(tpl.data.heading ?? '', vars),
    intro: applyVariables(tpl.data.intro ?? '', vars),
    cta: { label: applyVariables(tpl.data.cta_label ?? '', vars), href },
    footerNote: applyVariables(tpl.data.footer_note ?? '', vars),
  })
  try {
    await resend.emails.send({ from: fromAddress(), to: recipients, subject: applyVariables(tpl.subject, vars), html })
  } catch (err) {
    console.error('[coaching] Blocker-Alarm fehlgeschlagen:', err)
  }
}

/**
 * Antwort des Coaches an den Kunden (aus dem Cockpit-Verlauf).
 * Template 'coaching_coach_reply'. Landet beim Kunden mit Link ins Dashboard.
 */
export async function sendCoachReplyEmail(
  admin: SupabaseClient,
  input: { to: string; firstName: string; coachName: string; message: string; replyTo?: string | null },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const resend = getResend()
  if (!resend) return { ok: false, error: 'RESEND_API_KEY nicht konfiguriert' }
  const tpl = await loadTemplate('coaching_coach_reply', admin)
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const vars = {
    firstName: esc(input.firstName),
    coachName: esc(input.coachName),
    message: esc(input.message).replace(/\n/g, '<br>'),
    replyTo: esc(input.replyTo ?? '').replace(/\n/g, ' '),
  }
  let intro = applyVariables(tpl.data.intro ?? '', vars)
  // Ohne Bezugstext den Satz „Du hattest geschrieben: „““ nicht stehen lassen.
  if (!input.replyTo) intro = intro.replace(/Du hattest geschrieben:\s*<em>„“<\/em><br><br>/, '')
  const html = renderEmail({
    heading: applyVariables(tpl.data.heading ?? '', vars),
    intro,
    cta: { label: applyVariables(tpl.data.cta_label ?? '', vars), href: `${PRODUCTION_URL}/dashboard/coaching` },
    footerNote: applyVariables(tpl.data.footer_note ?? '', vars),
  })
  try {
    await resend.emails.send({ from: fromAddress(), to: input.to, subject: applyVariables(tpl.subject, vars), html })
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Versand fehlgeschlagen' }
  }
  return { ok: true }
}
