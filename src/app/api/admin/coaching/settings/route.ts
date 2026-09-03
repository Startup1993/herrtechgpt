import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/coaching/auth'
import { getAppSettings, setAppSetting } from '@/lib/app-settings'

/** Schalter „Kunden-Zugang“ fürs Coaching-Cockpit. Aus = Kunden sehen nichts, keine Kunden-Mails. */
export async function GET() {
  const ctx = await requireAdmin()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  const s = await getAppSettings()
  return NextResponse.json({ coachingClientAccess: s.coachingClientAccess })
}

export async function PATCH(request: Request) {
  const ctx = await requireAdmin()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  const body = await request.json().catch(() => null) as { coachingClientAccess?: unknown } | null
  if (!body || typeof body.coachingClientAccess !== 'boolean') return NextResponse.json({ error: 'coachingClientAccess (boolean) erforderlich' }, { status: 400 })
  await setAppSetting('coachingClientAccess', body.coachingClientAccess, ctx.user.id)
  revalidatePath('/dashboard', 'layout')
  revalidatePath('/dashboard/coaching')
  revalidatePath('/admin/coaching')
  return NextResponse.json({ coachingClientAccess: body.coachingClientAccess })
}
