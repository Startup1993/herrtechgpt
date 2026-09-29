import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getTemplate } from '@/lib/email-templates/registry'
import {
  renderEmail,
  renderInviteEmail,
  renderNewsletterInviteEmail,
  renderSkoolInviteEmail,
} from '@/lib/email-template'
import { applyVariables } from '@/lib/email-templates/registry'
import { PRODUCTION_URL } from '@/lib/urls'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') return null
  return user
}

// Rendert ein Template mit den (möglicherweise noch ungespeicherten) Form-Werten
// für Live-Preview im Admin-Editor. Variablen werden mit Beispielwerten ersetzt.
export async function POST(request: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const body = await request.json()
  const { key, subject, data } = body as {
    key?: string
    subject?: string
    data?: Record<string, string>
  }

  const def = key ? getTemplate(key) : undefined
  if (!def) return NextResponse.json({ error: 'Unbekannter Template-Key' }, { status: 400 })

  const merged: Record<string, string> = { ...def.defaults.data, ...(data ?? {}) }
  const previewVars = def.preview ?? {}

  let html = ''
  let renderedSubject = subject ?? def.defaults.subject

  switch (key) {
    case 'admin_invite': {
      const loginLink = String(previewVars.loginLink ?? `${PRODUCTION_URL}/auth/callback?token_hash=demo`)
      const firstName = previewVars.firstName ? String(previewVars.firstName) : null
      html = renderInviteEmail({ loginLink, firstName, content: merged })
      renderedSubject = applyVariables(renderedSubject, { loginLink, firstName: firstName ?? '' })
      break
    }
    case 'newsletter_invite': {
      const loginLink = String(previewVars.loginLink ?? `${PRODUCTION_URL}/auth/callback?token_hash=demo`)
      html = renderNewsletterInviteEmail({ loginLink, content: merged })
      renderedSubject = applyVariables(renderedSubject, { loginLink })
      break
    }
    case 'skool_active':
    case 'skool_alumni': {
      const claimLink = String(previewVars.claimLink ?? `${PRODUCTION_URL}/invite/skool/demo`)
      const firstName = previewVars.firstName ? String(previewVars.firstName) : null
      const credits = Number(previewVars.creditsPerMonth ?? 200)
      html = renderSkoolInviteEmail({
        claimLink,
        firstName,
        creditsPerMonth: credits,
        mode: key === 'skool_alumni' ? 'alumni' : 'active',
        content: merged,
      })
      renderedSubject = applyVariables(renderedSubject, {
        claimLink,
        firstName: firstName ?? '',
        creditsPerMonth: credits,
      })
      break
    }
    case 'community_downgrade': {
      const endDate = String(previewVars.endDate ?? '15. Mai 2026')
      const vars = { endDate }
      html = renderEmail({
        heading: applyVariables(merged.heading ?? '', vars),
        intro: applyVariables(merged.intro ?? '', vars),
        cta: {
          label: applyVariables(merged.cta_label ?? '', vars),
          href: `${PRODUCTION_URL}/dashboard/pricing`,
        },
        footerNote: applyVariables(merged.footer_note ?? '', vars),
      })
      renderedSubject = applyVariables(renderedSubject, vars)
      break
    }
    case 'admin_new_ticket': {
      const userEmail = String(previewVars.userEmail ?? 'maria@example.com')
      const vars = { userEmail }
      html = renderEmail({
        heading: applyVariables(merged.heading ?? '', vars),
        intro: applyVariables(merged.intro ?? '', vars),
        cta: { label: applyVariables(merged.cta_label ?? '', vars), href: '#preview' },
      })
      renderedSubject = applyVariables(renderedSubject, vars)
      break
    }
    default:
      return NextResponse.json({ error: 'Render not implemented' }, { status: 400 })
  }

  return NextResponse.json({ html, subject: renderedSubject })
}
