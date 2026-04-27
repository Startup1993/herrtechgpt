/**
 * Stripe-Diagnose für Community-Sync.
 *
 * Zählt für die letzten N Tage:
 *   - Checkout-Sessions (alle, nicht nur Skool)
 *   - Paid Invoices
 *   - Active Subscriptions (kein Datums-Filter)
 *
 * Hilft zu sehen ob der Stripe-Live-Account überhaupt Daten liefert
 * und welche API-Quelle am ehesten KMC-Käufe enthält.
 *
 * GET /api/admin/community/diagnose?days=90
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'

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

async function countStripe<T>(
  pageFn: (after?: string) => Promise<{ data: T[]; has_more: boolean }>,
  getId: (item: T) => string,
  cap = 2000
): Promise<{ count: number; capped: boolean }> {
  let count = 0
  let after: string | undefined = undefined
  let pages = 0
  while (count < cap) {
    const list = await pageFn(after)
    count += list.data.length
    pages += 1
    if (!list.has_more) return { count, capped: false }
    after = getId(list.data[list.data.length - 1])
    if (pages > 25) return { count, capped: true }
  }
  return { count, capped: true }
}

export async function GET(request: Request) {
  const adminUser = await requireAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const url = new URL(request.url)
  const days = parseInt(url.searchParams.get('days') ?? '90', 10)
  const since = Math.floor(Date.now() / 1000) - days * 86400
  const stripe = getStripe()

  // Stripe-Mode aus Key
  const keyPrefix = (process.env.STRIPE_SECRET_KEY ?? '').slice(0, 8)
  const mode = keyPrefix.startsWith('sk_live_')
    ? 'live'
    : keyPrefix.startsWith('sk_test_')
    ? 'test'
    : 'unknown'

  try {
    const [sessions, invoices, subsActive, subsAll] = await Promise.all([
      countStripe(
        (after) =>
          stripe.checkout.sessions.list({
            limit: 100,
            starting_after: after,
            created: { gte: since },
          }),
        (s) => s.id
      ),
      countStripe(
        (after) =>
          stripe.invoices.list({
            limit: 100,
            starting_after: after,
            status: 'paid',
            created: { gte: since },
          }),
        (i) => i.id ?? ''
      ),
      countStripe(
        (after) =>
          stripe.subscriptions.list({
            limit: 100,
            starting_after: after,
            status: 'active',
          }),
        (s) => s.id
      ),
      countStripe(
        (after) =>
          stripe.subscriptions.list({
            limit: 100,
            starting_after: after,
            status: 'all',
          }),
        (s) => s.id
      ),
    ])

    return NextResponse.json({
      mode,
      days,
      stripe: {
        sessions_in_range: sessions,
        invoices_paid_in_range: invoices,
        subscriptions_active: subsActive,
        subscriptions_all: subsAll,
      },
      hint:
        sessions.count === 0 && invoices.count === 0 && subsActive.count === 0
          ? 'Stripe liefert für die Zeitspanne nichts — Live-Key korrekt? Redeploy mit Cache-Invalidierung gemacht?'
          : invoices.count > sessions.count
          ? 'Hauptquelle sind Invoices (Ablefy / Hosted Invoices) — Sync deckt das ab.'
          : sessions.count > 0
          ? 'Sessions vorhanden — Sync sollte greifen sobald Product-IDs korrekt eingetragen sind.'
          : null,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}
