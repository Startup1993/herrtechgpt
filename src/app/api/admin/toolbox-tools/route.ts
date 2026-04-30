import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Hilfs-Funktion: nach jeder Toolbox-Mutation Cache-Pfade invalidieren.
 * Sonst sieht der User den alten Coming-Soon/Published-Status weiter
 * (Layout + Toolbox-Page sind in Next 16 standardmäßig gecached).
 */
function invalidateToolboxCache() {
  revalidatePath('/dashboard', 'layout')
  revalidatePath('/dashboard/ki-toolbox')
  revalidatePath('/admin/content/toolbox')
}

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return user
}

export async function GET() {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('toolbox_tools')
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
    title,
    subtitle,
    description,
    href,
    icon_name,
    icon_bg,
    sort_order,
    coming_soon,
    published,
  } = body

  if (!id || !title || !description) {
    return NextResponse.json(
      { error: 'id, title und description sind Pflichtfelder' },
      { status: 400 },
    )
  }

  const admin = createAdminClient()

  let finalSortOrder = sort_order
  if (typeof finalSortOrder !== 'number') {
    const { data: maxRow } = await admin
      .from('toolbox_tools')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle()
    finalSortOrder = (maxRow?.sort_order ?? 0) + 10
  }

  const { data, error } = await admin
    .from('toolbox_tools')
    .upsert(
      {
        id,
        title,
        subtitle: subtitle ?? null,
        description,
        href: href ?? null,
        icon_name: icon_name ?? 'Wrench',
        icon_bg: icon_bg ?? 'bg-gradient-to-br from-primary to-primary-hover',
        sort_order: finalSortOrder,
        coming_soon: coming_soon ?? false,
        published: published ?? true,
      },
      { onConflict: 'id' },
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  invalidateToolboxCache()
  return NextResponse.json(data)
}

export async function DELETE(request: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin.from('toolbox_tools').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  invalidateToolboxCache()
  return NextResponse.json({ success: true })
}
