/**
 * Dedupe-Endpoint: räumt Duplikate in community_members nach lower(email)
 * auf. Stripe-Source gewinnt (hat Priorität), sonst behalten wir den
 * jüngsten Eintrag.
 *
 * POST /api/admin/community/dedupe
 *
 * Antwort: { groups, kept, deleted }
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

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

type Member = {
  id: string
  email: string
  source: 'stripe' | 'manual' | 'csv' | 'skool' | null
  profile_id: string | null
  claimed_at: string | null
  created_at: string
  skool_status: 'active' | 'alumni' | 'cancelled'
}

const SOURCE_PRIO: Record<string, number> = {
  stripe: 4, // höchste Prio — Stripe-Source gewinnt immer
  skool: 3,
  manual: 2,
  csv: 1,
}

function pickKeeper(rows: Member[]): Member {
  // Sortierung: claimed > stripe > höchste Source-Prio > jüngster created_at
  const sorted = [...rows].sort((a, b) => {
    // claimed (= profile_id gesetzt) hat Vorrang
    const ac = a.profile_id ? 1 : 0
    const bc = b.profile_id ? 1 : 0
    if (ac !== bc) return bc - ac
    // Source-Prio
    const ap = SOURCE_PRIO[a.source ?? ''] ?? 0
    const bp = SOURCE_PRIO[b.source ?? ''] ?? 0
    if (ap !== bp) return bp - ap
    // jüngster gewinnt
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
  return sorted[0]
}

export async function POST() {
  const adminUser = await requireAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const admin = createAdminClient()

  // Alle Members in Pages laden (PostgREST 1000-Cap)
  const all: Member[] = []
  const PAGE = 1000
  let offset = 0
  while (offset < 50000) {
    const { data, error } = await admin
      .from('community_members')
      .select('id, email, source, profile_id, claimed_at, created_at, skool_status')
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE - 1)
    if (error || !data) break
    all.push(...(data as Member[]))
    if (data.length < PAGE) break
    offset += PAGE
  }

  // Gruppieren nach lower(email)
  const groups = new Map<string, Member[]>()
  for (const m of all) {
    const key = m.email.toLowerCase()
    const arr = groups.get(key) ?? []
    arr.push(m)
    groups.set(key, arr)
  }

  // Pro Gruppe: keeper bestimmen, Rest löschen
  const toDelete: string[] = []
  let groupsWithDuplicates = 0
  for (const [, rows] of groups) {
    if (rows.length <= 1) continue
    groupsWithDuplicates += 1
    const keeper = pickKeeper(rows)
    for (const row of rows) {
      if (row.id !== keeper.id) {
        toDelete.push(row.id)
      }
    }
  }

  // Bulk-Delete in 100er-Batches
  let deleted = 0
  const errors: string[] = []
  const BATCH = 100
  for (let i = 0; i < toDelete.length; i += BATCH) {
    const batch = toDelete.slice(i, i + BATCH)
    const { error: delErr, count } = await admin
      .from('community_members')
      .delete({ count: 'exact' })
      .in('id', batch)
    if (delErr) {
      errors.push(delErr.message)
    } else {
      deleted += count ?? batch.length
    }
  }

  return NextResponse.json({
    total_members: all.length,
    duplicate_groups: groupsWithDuplicates,
    deleted,
    errors: errors.length > 0 ? errors : undefined,
  })
}
