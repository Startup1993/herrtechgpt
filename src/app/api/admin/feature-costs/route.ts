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
    .from('feature_credit_costs')
    .select('*')
    .order('category', { ascending: true })
    .order('label', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(request: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const body = await request.json()
  const { feature, label, credits_per_unit, unit, category, description, active } = body

  if (!feature || !label || credits_per_unit == null || !unit) {
    return NextResponse.json(
      { error: 'feature, label, credits_per_unit, unit sind Pflichtfelder' },
      { status: 400 }
    )
  }

  const admin = createAdminClient()

  const { data, error } = await admin
    .from('feature_credit_costs')
    .upsert(
      {
        feature,
        label,
        credits_per_unit,
        unit,
        category: category ?? null,
        description: description ?? null,
        active: active ?? true,
      },
      { onConflict: 'feature' }
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
  const feature = searchParams.get('feature')
  if (!feature) return NextResponse.json({ error: 'feature required' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin.from('feature_credit_costs').delete().eq('feature', feature)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
