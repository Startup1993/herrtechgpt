import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (!profile || profile.role !== 'admin') return null
  return user
}

export async function POST(req: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const body = (await req.json().catch(() => null)) as {
    stripe_product_id?: string
    label?: string
    access_days?: number
    notes?: string
  } | null

  const productId = body?.stripe_product_id?.trim()
  const label = body?.label?.trim()
  if (!productId || !label) {
    return NextResponse.json({ error: 'Product-ID und Label benötigt' }, { status: 400 })
  }

  const svc = createAdminClient()
  const { error } = await svc.from('skool_stripe_products').upsert(
    {
      stripe_product_id: productId,
      label,
      access_days: body?.access_days ?? 365,
      notes: body?.notes ?? null,
      active: true,
    },
    { onConflict: 'stripe_product_id' }
  )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function PATCH(req: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const body = (await req.json().catch(() => null)) as {
    stripe_product_id?: string
    active?: boolean
    label?: string
    access_days?: number
    notes?: string
  } | null

  const productId = body?.stripe_product_id
  if (!productId) {
    return NextResponse.json({ error: 'Product-ID fehlt' }, { status: 400 })
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (typeof body?.active === 'boolean') patch.active = body.active
  if (typeof body?.label === 'string') patch.label = body.label
  if (typeof body?.access_days === 'number') patch.access_days = body.access_days
  if (typeof body?.notes === 'string') patch.notes = body.notes

  const svc = createAdminClient()
  const { error } = await svc
    .from('skool_stripe_products')
    .update(patch)
    .eq('stripe_product_id', productId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
