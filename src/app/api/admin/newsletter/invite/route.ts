import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { sendInvitationEmail } from '@/lib/invitations'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') return null
  return user
}

export async function POST(request: Request) {
  const adminUser = await requireAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const body = await request.json().catch(() => null) as { ids?: string[] } | null
  const ids = Array.isArray(body?.ids) ? body!.ids.filter((x): x is string => typeof x === 'string') : []
  if (ids.length === 0) {
    return NextResponse.json({ error: 'ids required' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: signups, error: fetchError } = await admin
    .from('newsletter_signups')
    .select('id, email, status')
    .in('id', ids)

  if (fetchError || !signups) {
    return NextResponse.json({ error: fetchError?.message ?? 'Signups nicht gefunden' }, { status: 500 })
  }

  // Bereits existierende Auth-User nachschlagen, um Doppelanlage zu vermeiden.
  const { data: authPage } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const existingByEmail = new Map<string, string>()
  authPage?.users?.forEach((u) => {
    if (u.email) existingByEmail.set(u.email.toLowerCase(), u.id)
  })

  let invited = 0
  let failed = 0
  const errors: Array<{ email: string; error: string }> = []
  const nowIso = new Date().toISOString()

  for (const signup of signups) {
    try {
      const email = signup.email.toLowerCase()
      let userId = existingByEmail.get(email)

      if (!userId) {
        const { data: created, error: createErr } = await admin.auth.admin.createUser({
          email,
          email_confirm: true,
        })
        if (createErr || !created.user) {
          failed += 1
          errors.push({ email, error: createErr?.message ?? 'createUser failed' })
          continue
        }
        userId = created.user.id
      }

      const res = await sendInvitationEmail(admin, email)
      if (!res.ok) {
        failed += 1
        errors.push({ email, error: res.error })
        continue
      }

      await admin
        .from('newsletter_signups')
        .update({ status: 'invited', invited_at: nowIso, invited_user_id: userId })
        .eq('id', signup.id)

      invited += 1
    } catch (err) {
      failed += 1
      errors.push({
        email: signup.email,
        error: err instanceof Error ? err.message : 'Unbekannter Fehler',
      })
    }
  }

  return NextResponse.json({ success: true, invited, failed, errors })
}
