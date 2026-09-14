import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { exportEnrollment, listEnrollmentsCompact } from '@/lib/coaching/export'

/**
 * Lese-Endpunkt für das Plugin (call-vorbereiten, coaching-status):
 * liefert Teilnahme, Meilensteine, alle Aufgaben, Workflows, Material und
 * den Verlauf. Auth wie beim Import. ?email=… | ?id=… | ?name=…
 * Ohne Parameter: Liste aller Teilnahmen (kompakt).
 */
function authorized(request: Request): boolean {
  const secret = process.env.COACHING_IMPORT_SECRET
  if (!secret) return false
  const header = request.headers.get('authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
  return token.length > 0 && token === secret
}

export async function GET(request: Request) {
  if (!process.env.COACHING_IMPORT_SECRET) return NextResponse.json({ error: 'COACHING_IMPORT_SECRET ist nicht gesetzt' }, { status: 503 })
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const email = searchParams.get('email')
  const name = searchParams.get('name')
  const admin = createAdminClient()

  if (!id && !email && !name) return NextResponse.json(await listEnrollmentsCompact(admin))

  const result = await exportEnrollment(admin, { id, email, name, since: searchParams.get('since') })
  if (!result) return NextResponse.json({ error: 'Teilnahme nicht gefunden' }, { status: 404 })
  return NextResponse.json(result)
}
