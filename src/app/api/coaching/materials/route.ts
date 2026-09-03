import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Enrollment, Material } from '@/lib/coaching/types'

/** Kunde öffnet ein Material zum ersten Mal: "neu"-Markierung verschwindet. */
export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null) as { materialId?: string } | null
  if (!body?.materialId) return NextResponse.json({ error: 'materialId erforderlich' }, { status: 400 })

  const admin = createAdminClient()
  const { data: material } = await admin.from('coaching_materials').select('*').eq('id', body.materialId).maybeSingle()
  const m = material as Material | null
  if (!m) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const { data: enrollment } = await admin.from('coaching_enrollments').select('id, profile_id').eq('id', m.enrollment_id).maybeSingle()
  if (!enrollment || (enrollment as Pick<Enrollment, 'id' | 'profile_id'>).profile_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (!m.first_opened_at) {
    await admin.from('coaching_materials').update({ first_opened_at: new Date().toISOString() }).eq('id', m.id)
  }
  return NextResponse.json({ success: true })
}
