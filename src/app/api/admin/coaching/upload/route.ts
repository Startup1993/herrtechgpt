import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/coaching/auth'
import { COACHING_BUCKET, signedUrl } from '@/lib/coaching/queries'

const MAX_BYTES = 50 * 1024 * 1024

/**
 * Datei in den privaten Coaching-Bucket laden (Recap-PDF, Skill-Datei, Skript).
 * Liefert storage_path zurück, der an Material oder Meilenstein gehängt wird.
 */
export async function POST(req: NextRequest) {
  const ctx = await requireAdmin()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const enrollmentId = formData.get('enrollment_id')
  if (!file) return NextResponse.json({ error: 'Keine Datei' }, { status: 400 })
  if (typeof enrollmentId !== 'string' || !enrollmentId) return NextResponse.json({ error: 'enrollment_id fehlt' }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'Datei zu groß (max. 50 MB)' }, { status: 400 })

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-').slice(0, 80)
  const path = `enrollments/${enrollmentId}/${Date.now()}-${safeName}`

  const admin = createAdminClient()
  const { error } = await admin.storage.from(COACHING_BUCKET).upload(path, await file.arrayBuffer(), {
    contentType: file.type || 'application/octet-stream',
    upsert: false,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ storage_path: path, file_name: file.name, signed_url: await signedUrl(admin, path) })
}
