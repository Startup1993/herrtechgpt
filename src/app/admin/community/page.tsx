import Link from 'next/link'
import { Settings } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { CommunityTable } from './CommunityTable'

export const dynamic = 'force-dynamic'

type MemberRow = {
  id: string
  email: string
  name: string | null
  skool_status: 'active' | 'alumni' | 'cancelled'
  skool_access_expires_at: string | null
  last_purchase_at: string | null
  purchase_count: number
  invitation_sent_count: number
  last_invited_at: string | null
  claimed_at: string | null
  created_at: string
  source: 'stripe' | 'manual' | 'csv' | 'skool' | null
}

// Supabase/PostgREST hat einen Server-seitigen Hard-Cap auf 1000 Rows
// (db-max-rows). .limit() überschreibt den nicht — wir müssen seitenweise lesen.
async function fetchAllCommunityMembers(): Promise<MemberRow[]> {
  const admin = createAdminClient()
  const PAGE = 1000
  const MAX_TOTAL = 50000 // safety
  const all: MemberRow[] = []
  let offset = 0
  while (offset < MAX_TOTAL) {
    const { data, error } = await admin
      .from('community_members')
      .select(
        'id, email, name, skool_status, skool_access_expires_at, last_purchase_at, purchase_count, invitation_sent_count, last_invited_at, claimed_at, created_at, source'
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE - 1)
    if (error || !data) break
    all.push(...(data as MemberRow[]))
    if (data.length < PAGE) break
    offset += PAGE
  }
  return all
}

export default async function AdminCommunityPage() {
  const members = await fetchAllCommunityMembers()
  const activeCount = members.filter((m) => m.skool_status === 'active').length
  const alumniCount = members.filter((m) => m.skool_status === 'alumni').length
  const claimedCount = members.filter((m) => m.claimed_at).length
  const invitableCount = members.filter(
    (m) => m.skool_status === 'active' && !m.claimed_at
  ).length

  return (
    <div className="p-4 sm:p-8 max-w-screen-2xl mx-auto">
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">KI Marketing Club</h1>
          <p className="text-sm text-muted mt-1">
            {members.length} Mitglieder · {activeCount} aktiv · {alumniCount} Alumni · {claimedCount} registriert · {invitableCount} einladbar
          </p>
        </div>
        <Link
          href="/admin/community/products"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-surface-hover text-foreground text-sm transition"
        >
          <Settings className="w-4 h-4" />
          Stripe-Produkte pflegen
        </Link>
      </div>
      <CommunityTable members={members} />
    </div>
  )
}
