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
    .from('plans')
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
    tier,
    name,
    description,
    price_basic_cents,
    price_community_cents,
    price_yearly_basic_cents,
    price_yearly_community_cents,
    credits_per_month,
    ablefy_product_basic,
    ablefy_product_community,
    ablefy_product_yearly_basic,
    ablefy_product_yearly_community,
    features,
    sort_order,
    active,
  } = body

  if (!id || !tier || !name || price_basic_cents == null || price_community_cents == null || credits_per_month == null) {
    return NextResponse.json(
      { error: 'id, tier, name, price_basic_cents, price_community_cents, credits_per_month sind Pflichtfelder' },
      { status: 400 }
    )
  }

  if (!['S', 'M', 'L'].includes(tier)) {
    return NextResponse.json({ error: 'tier muss S, M oder L sein' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data, error } = await admin
    .from('plans')
    .upsert(
      {
        id,
        tier,
        name,
        description: description ?? null,
        price_basic_cents,
        price_community_cents,
        price_yearly_basic_cents: price_yearly_basic_cents ?? null,
        price_yearly_community_cents: price_yearly_community_cents ?? null,
        credits_per_month,
        ablefy_product_basic: ablefy_product_basic ?? null,
        ablefy_product_community: ablefy_product_community ?? null,
        ablefy_product_yearly_basic: ablefy_product_yearly_basic ?? null,
        ablefy_product_yearly_community: ablefy_product_yearly_community ?? null,
        features: features ?? [],
        sort_order: sort_order ?? 0,
        active: active ?? true,
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
  const { error } = await admin.from('plans').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
