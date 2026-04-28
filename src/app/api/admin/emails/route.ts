import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { getTemplate } from '@/lib/email-templates/registry'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') return null
  return user
}

export async function PUT(request: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const body = await request.json()
  const { key, subject, data } = body as {
    key?: string
    subject?: string
    data?: Record<string, string>
  }

  if (!key || !getTemplate(key)) {
    return NextResponse.json({ error: 'Unbekannter Template-Key' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: row, error } = await admin
    .from('email_templates')
    .upsert(
      {
        key,
        subject: subject ?? null,
        data: data ?? {},
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      },
      { onConflict: 'key' },
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(row)
}

export async function DELETE(request: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const key = searchParams.get('key')
  if (!key || !getTemplate(key)) {
    return NextResponse.json({ error: 'Unbekannter Template-Key' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin.from('email_templates').delete().eq('key', key)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
