import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { importBundle, type ImportPayload } from '@/lib/coaching/import'
import { getAppUrl } from '@/lib/urls'

export const maxDuration = 60

/**
 * Import-Endpunkt für das Coaching-Plugin (und später n8n).
 * Auth: `Authorization: Bearer <COACHING_IMPORT_SECRET>`.
 * Body: ImportPayload (siehe src/lib/coaching/import.ts).
 */
function authorized(request: Request): boolean {
  const secret = process.env.COACHING_IMPORT_SECRET
  if (!secret) return false
  const header = request.headers.get('authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
  return token.length > 0 && token === secret
}

export async function POST(request: Request) {
  if (!process.env.COACHING_IMPORT_SECRET) {
    return NextResponse.json({ error: 'COACHING_IMPORT_SECRET ist nicht gesetzt' }, { status: 503 })
  }
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const payload = await request.json().catch(() => null) as ImportPayload | null
  if (!payload || typeof payload !== 'object' || !payload.enrollment) {
    return NextResponse.json({ error: 'Body braucht ein Objekt mit "enrollment"' }, { status: 400 })
  }

  try {
    const result = await importBundle(createAdminClient(), payload, getAppUrl(request))
    revalidatePath('/dashboard', 'layout')
    revalidatePath('/dashboard/coaching')
    revalidatePath('/dashboard/coaching/sessions')
    revalidatePath('/admin/coaching')
    revalidatePath(`/admin/coaching/${result.enrollment_id}`)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Import fehlgeschlagen' }, { status: 400 })
  }
}
