/**
 * Community-Member löschen.
 *
 * DELETE /api/admin/community/[id]
 *
 * - Wenn der Member geclaimt war und eine Plan-S-Sub aus skool_community
 *   aktiv ist → Sub beenden, access_tier auf 'alumni' setzen
 *   (gleiche Logik wie expireSkoolMembership).
 * - Dann community_members-Eintrag hart löschen.
 *
 * Das User-Profil (auth.users + profiles) bleibt unangetastet — der User
 * ist nur nicht mehr als Skool-Mitglied gelistet.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  cancelSkoolMembership,
  ensureSkoolPlanS,
  expireSkoolMembership,
} from '@/lib/skool-sync'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminUser = await requireAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { id } = await params
  if (!id) return NextResponse.json({ error: 'ID fehlt' }, { status: 400 })

  const admin = createAdminClient()

  // Erst auf alumni setzen → beendet Plan-S-Sub + setzt access_tier korrekt,
  // wenn der Member geclaimt war. Bei nicht-claimed members: no-op.
  try {
    await expireSkoolMembership(admin, id)
  } catch (err) {
    // Wir loggen nur und löschen trotzdem — Sub-Cleanup kann später manuell
    console.warn('[delete-member] expire fehlgeschlagen:', err)
  }

  const { error } = await admin.from('community_members').delete().eq('id', id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

/**
 * Status / Zugang manuell ändern.
 *
 * PATCH /api/admin/community/[id]
 *   { skool_status?: 'active' | 'alumni' | 'cancelled', skool_access_expires_at?: string, name?: string }
 *
 * Wenn der Status sich ändert UND der Member geclaimt war, wird Plan S
 * angepasst (active → reaktivieren, alumni/cancelled → beenden).
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminUser = await requireAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { id } = await params
  if (!id) return NextResponse.json({ error: 'ID fehlt' }, { status: 400 })

  const body = (await req.json().catch(() => null)) as {
    skool_status?: 'active' | 'alumni' | 'cancelled'
    skool_access_expires_at?: string
    name?: string
  } | null

  if (!body) {
    return NextResponse.json({ error: 'Body fehlt' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Aktuellen Member laden um Status-Übergänge zu erkennen
  const { data: current } = await admin
    .from('community_members')
    .select('id, profile_id, skool_status, skool_access_expires_at')
    .eq('id', id)
    .maybeSingle()

  if (!current) {
    return NextResponse.json({ error: 'Member nicht gefunden' }, { status: 404 })
  }

  // Patch zusammenbauen
  const patch: Record<string, unknown> = {}
  if (body.skool_status && ['active', 'alumni', 'cancelled'].includes(body.skool_status)) {
    patch.skool_status = body.skool_status
  }
  if (body.skool_access_expires_at) {
    const d = new Date(body.skool_access_expires_at)
    if (!isNaN(d.getTime())) {
      patch.skool_access_expires_at = d.toISOString()
    }
  }
  if (typeof body.name === 'string') {
    patch.name = body.name.trim() || null
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Keine Änderungen' }, { status: 400 })
  }

  const { error: updErr } = await admin
    .from('community_members')
    .update(patch)
    .eq('id', id)

  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 })
  }

  // Side-Effects bei Status-Änderung (nur wenn Member claimt war)
  if (body.skool_status && current.profile_id) {
    const newStatus = body.skool_status
    const oldStatus = current.skool_status

    if (newStatus !== oldStatus) {
      try {
        if (newStatus === 'active') {
          // Plan S reaktivieren mit dem (ggf. neu gesetzten) Expiry
          const periodEndStr =
            (patch.skool_access_expires_at as string | undefined) ??
            current.skool_access_expires_at
          if (periodEndStr) {
            await ensureSkoolPlanS(admin, {
              profileId: current.profile_id,
              periodEnd: new Date(periodEndStr),
            })
          }
        } else if (newStatus === 'alumni') {
          await expireSkoolMembership(admin, id)
        } else if (newStatus === 'cancelled') {
          await cancelSkoolMembership(admin, id)
        }
      } catch (err) {
        console.warn('[community-patch] side-effect error:', err)
      }
    }
  }

  return NextResponse.json({ ok: true })
}
