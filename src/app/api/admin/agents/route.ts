import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

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
  const { agent_id, name, description, emoji, system_prompt, is_active } = body

  if (!agent_id) return NextResponse.json({ error: 'agent_id required' }, { status: 400 })

  const admin = createAdminClient()

  const { data, error } = await admin
    .from('agent_configs')
    .upsert(
      { agent_id, name, description, emoji, system_prompt, is_active, updated_at: new Date().toISOString() },
      { onConflict: 'agent_id' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const agent_id = searchParams.get('agent_id')
  if (!agent_id) return NextResponse.json({ error: 'agent_id required' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin.from('agent_configs').delete().eq('agent_id', agent_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
