import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { sendAdminInviteForUser } from '@/lib/admin-invite'

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

  const body = await request.json().catch(() => null) as { userId?: string } | null
  if (!body?.userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  const admin = createAdminClient()
  const { data: target, error } = await admin.auth.admin.getUserById(body.userId)
  if (error || !target?.user?.email) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
  if (target.user.last_sign_in_at) {
    return NextResponse.json({ error: 'Nutzer hat sich bereits eingeloggt' }, { status: 400 })
  }

  // Tier-aware Mail-Auswahl: alumni → Skool-Alumni-Mail (Classroom-Hinweis),
  // premium → Skool-Active-Mail, basic → Magic-Link.
  const result = await sendAdminInviteForUser(admin, body.userId)
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 })

  const { data: profile } = await admin
    .from('profiles')
    .select('invitation_sent_count, invitation_last_sent_at')
    .eq('id', body.userId)
    .single()

  return NextResponse.json({
    success: true,
    invite_type: result.type,
    invitation_sent_count: profile?.invitation_sent_count ?? 1,
    invitation_last_sent_at: profile?.invitation_last_sent_at,
  })
}
