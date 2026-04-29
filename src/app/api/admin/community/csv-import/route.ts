/**
 * CSV-Import: bulk neue Mitglieder anlegen aus Skool-Member-Export.
 *
 * POST /api/admin/community/csv-import
 *   Content-Type: application/json
 *   Body: { rows: Array<{ email, name?, expires_at? }> }
 *
 * Verhalten:
 *  - Pro Row Email validieren
 *  - Email schon in DB (egal welche source)? → skip (nicht überschreiben)
 *  - Sonst: insert mit source='csv', skool_status='active'
 *  - Default-Zugang: 1 Jahr ab heute, falls expires_at fehlt
 *
 * Antwort: { inserted, skipped_existing, invalid, errors }
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  autoLinkProfileIfExists,
  buildAuthUserEmailMap,
} from '@/lib/skool-sync'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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
  const adminUser = await requireAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const body = (await req.json().catch(() => null)) as {
    rows?: Array<{ email?: string; name?: string; expires_at?: string }>
  } | null

  const rows = Array.isArray(body?.rows) ? body!.rows : []
  if (rows.length === 0) {
    return NextResponse.json({ error: 'Keine Zeilen erhalten' }, { status: 400 })
  }
  if (rows.length > 5000) {
    return NextResponse.json(
      { error: 'Maximal 5000 Zeilen pro Import' },
      { status: 400 }
    )
  }

  const admin = createAdminClient()
  const defaultExpiry = new Date(Date.now() + 365 * 86400 * 1000).toISOString()

  // 1) Bereinigen + validieren
  const validRows: Array<{ email: string; name: string | null; expires_at: string }> = []
  let invalid = 0
  for (const row of rows) {
    const email = row.email?.trim().toLowerCase() ?? ''
    if (!EMAIL_RE.test(email)) {
      invalid += 1
      continue
    }
    let expires = defaultExpiry
    if (row.expires_at && row.expires_at.trim()) {
      const parsed = new Date(row.expires_at.trim())
      if (!isNaN(parsed.getTime())) {
        expires = parsed.toISOString()
      }
    }
    validRows.push({
      email,
      name: row.name?.trim() || null,
      expires_at: expires,
    })
  }

  // 2) ALLE bestehenden Emails laden (case-insensitiv vergleichen — sonst
  //    werden Duplikate übersehen, wenn Stripe Mixed-Case und CSV
  //    Lowercase liefert).
  const existingEmails = new Set<string>()
  const ALL_BATCH = 1000
  let offset = 0
  while (offset < 50000) {
    const { data: rows } = await admin
      .from('community_members')
      .select('email')
      .range(offset, offset + ALL_BATCH - 1)
    if (!rows || rows.length === 0) break
    for (const r of rows) {
      existingEmails.add((r.email as string).toLowerCase())
    }
    if (rows.length < ALL_BATCH) break
    offset += ALL_BATCH
  }

  // 3) Bulk-Insert in Batches
  const toInsert = validRows.filter((r) => !existingEmails.has(r.email))
  const skipped_existing = validRows.length - toInsert.length

  let inserted = 0
  const errors: Array<{ email: string; error: string }> = []
  const now = new Date().toISOString()
  const INSERT_BATCH = 100

  for (let i = 0; i < toInsert.length; i += INSERT_BATCH) {
    const batch = toInsert.slice(i, i + INSERT_BATCH).map((r) => ({
      stripe_customer_id: null,
      email: r.email,
      name: r.name,
      skool_status: 'active' as const,
      skool_access_started_at: now,
      skool_access_expires_at: r.expires_at,
      source: 'csv',
      purchase_count: 0,
    }))
    const { error } = await admin.from('community_members').insert(batch)
    if (error) {
      errors.push({
        email: `Batch ${i / INSERT_BATCH + 1}`,
        error: error.message,
      })
    } else {
      inserted += batch.length
    }
  }

  // Auto-Link: bereits existierende auth.users direkt verknüpfen
  let autoLinked = 0
  if (inserted > 0) {
    try {
      const userMap = await buildAuthUserEmailMap(admin)
      const insertedEmails = toInsert.map((r) => r.email)
      // In Batches die frisch eingefügten Members lesen + linken
      const READ = 500
      for (let i = 0; i < insertedEmails.length; i += READ) {
        const emailBatch = insertedEmails.slice(i, i + READ)
        const { data: rows } = await admin
          .from('community_members')
          .select(
            'id, email, name, skool_status, skool_access_expires_at, profile_id'
          )
          .in('email', emailBatch)
          .is('profile_id', null)
        for (const row of rows ?? []) {
          try {
            const res = await autoLinkProfileIfExists(
              admin,
              row as Parameters<typeof autoLinkProfileIfExists>[1],
              userMap
            )
            if (res.linked) autoLinked += 1
          } catch {
            // ignore — Insert war schon erfolgreich
          }
        }
      }
    } catch {
      // Auto-Link best-effort; Fehler nicht blocken
    }
  }

  return NextResponse.json({
    received: rows.length,
    valid: validRows.length,
    invalid,
    skipped_existing,
    inserted,
    auto_linked: autoLinked,
    errors: errors.length > 0 ? errors : undefined,
  })
}
