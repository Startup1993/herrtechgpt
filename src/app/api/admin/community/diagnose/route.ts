/**
 * Stripe-Diagnose für Community-Sync.
 *
 * Holt nur die ERSTE Seite jeder Quelle (100 Items max) — reicht für die
 * Diagnose und vermeidet Timeouts. Wir wollen nur wissen "ist da was?",
 * nicht "wie viele genau".
 *
 * GET /api/admin/community/diagnose?days=90
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

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

type Snapshot = { count: number; has_more: boolean }

async function safe<T>(
  label: string,
  fn: () => Promise<T>
): Promise<{ ok: true; value: T } | { ok: false; error: string }> {
  try {
    return { ok: true, value: await fn() }
  } catch (err) {
    return {
      ok: false,
      error: `${label}: ${err instanceof Error ? err.message : String(err)}`,
    }
  }
}

export async function GET(request: Request) {
  const adminUser = await requireAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const url = new URL(request.url)
  const days = parseInt(url.searchParams.get('days') ?? '90', 10)
  const since = Math.floor(Date.now() / 1000) - days * 86400

  const keyPrefix = (process.env.STRIPE_SECRET_KEY ?? '').slice(0, 8)
  const mode = keyPrefix.startsWith('sk_live_')
    ? 'live'
    : keyPrefix.startsWith('sk_test_')
    ? 'test'
    : 'unknown'

  if (mode === 'unknown') {
    return NextResponse.json({
      mode,
      error: 'STRIPE_SECRET_KEY ist nicht gesetzt oder hat unbekanntes Format.',
    })
  }

  const stripe = getStripe()
  const errors: string[] = []
  const snap = (label: string, r: { ok: true; value: { data: unknown[]; has_more: boolean } } | { ok: false; error: string }): Snapshot => {
    if (!r.ok) {
      errors.push(r.error)
      return { count: 0, has_more: false }
    }
    return { count: r.value.data.length, has_more: r.value.has_more }
  }

  // Sequenziell, um Stripe-Rate-Limits + Vercel-Timeout zu schonen
  const sessions = snap(
    'sessions',
    await safe('sessions', () =>
      stripe.checkout.sessions.list({ limit: 100, created: { gte: since } })
    )
  )
  const invoices = snap(
    'invoices',
    await safe('invoices', () =>
      stripe.invoices.list({ limit: 100, status: 'paid', created: { gte: since } })
    )
  )
  const subsActive = snap(
    'subs_active',
    await safe('subs_active', () =>
      stripe.subscriptions.list({ limit: 100, status: 'active' })
    )
  )
  const subsAll = snap(
    'subs_all',
    await safe('subs_all', () =>
      stripe.subscriptions.list({ limit: 100, status: 'all' })
    )
  )

  const totalDataFound =
    sessions.count + invoices.count + subsActive.count + subsAll.count

  let hint: string | null = null
  if (totalDataFound === 0 && errors.length === 0) {
    hint =
      'Stripe-Account ist erreichbar, aber liefert nichts. Live-Key korrekt? Vercel-Redeploy ohne Build-Cache gemacht?'
  } else if (errors.length > 0) {
    hint = `Bei ${errors.length} Stripe-Calls gab es Fehler — siehe errors-Feld.`
  } else if (invoices.count > sessions.count && invoices.count > 0) {
    hint = 'Hauptquelle sind Invoices (Ablefy / Hosted Invoices) — Sync deckt das ab.'
  } else if (sessions.count > 0) {
    hint = 'Sessions vorhanden — Sync sollte greifen sobald Product-IDs korrekt sind.'
  }

  return NextResponse.json({
    mode,
    days,
    stripe: {
      sessions_in_range: sessions,
      invoices_paid_in_range: invoices,
      subscriptions_active: subsActive,
      subscriptions_all: subsAll,
    },
    hint,
    errors: errors.length > 0 ? errors : undefined,
  })
}
