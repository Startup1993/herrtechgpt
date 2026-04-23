import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { email?: string; source?: string } | null
  const email = body?.email?.trim().toLowerCase() ?? ''
  const source = body?.source?.trim() || 'coming-soon'

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Gib eine gültige E-Mail-Adresse ein.' }, { status: 400 })
  }
  if (email.length > 254) {
    return NextResponse.json({ error: 'E-Mail zu lang.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('newsletter_signups')
    .insert({ email, source })

  if (error) {
    // Duplicate (unique violation) behandeln wir als Erfolg — der User ist ja eingetragen.
    if (error.code === '23505') {
      return NextResponse.json({ success: true, duplicate: true })
    }
    return NextResponse.json({ error: 'Speichern fehlgeschlagen. Versuch es gleich nochmal.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
