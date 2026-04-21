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

export async function GET() {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('core_tools')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(request: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const body = await request.json()
  const {
    id,
    name,
    category,
    tier,
    what_for,
    why_we_use_it,
    alternatives_handled,
    relevant_agents,
    url,
    icon,
    active,
    sort_order,
  } = body

  if (!id || !name || !category || !tier || !what_for) {
    return NextResponse.json(
      { error: 'id, name, category, tier und what_for sind Pflichtfelder' },
      { status: 400 }
    )
  }

  const admin = createAdminClient()

  const { data, error } = await admin
    .from('core_tools')
    .upsert(
      {
        id,
        name,
        category,
        tier,
        what_for,
        why_we_use_it: why_we_use_it ?? null,
        alternatives_handled: alternatives_handled ?? [],
        relevant_agents: relevant_agents ?? [],
        url: url ?? null,
        icon: icon ?? null,
        active: active ?? true,
        sort_order: sort_order ?? 0,
      },
      { onConflict: 'id' }
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
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin.from('core_tools').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
