import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { VIEW_AS_COOKIE, VIEW_AS_OPTIONS, type ViewAsMode } from '@/lib/access'

async function requireRealAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin'
}

export async function POST(req: Request) {
  if (!await requireRealAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { tier } = await req.json() as { tier?: string }
  if (!tier || !VIEW_AS_OPTIONS.includes(tier as ViewAsMode)) {
    return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
  }

  const cookieStore = await cookies()
  if (tier === 'admin') {
    cookieStore.delete(VIEW_AS_COOKIE)
  } else {
    cookieStore.set(VIEW_AS_COOKIE, tier, {
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    })
  }
  return NextResponse.json({ success: true, tier })
}
