/**
 * Auto-Import: alle Stripe-Products mit "KI Marketing Club" im Namen
 * (oder konfigurierbarem Pattern) in skool_stripe_products einpflegen.
 *
 * Bestehende Einträge werden NICHT überschrieben — nur neue hinzugefügt.
 * So bleiben User-Anpassungen (Label, access_days, active) erhalten.
 *
 * POST /api/admin/community/products/import
 *   { name_pattern?: string }   default: "ki marketing club"
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe'
import type Stripe from 'stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const DEFAULT_PATTERN = 'ki marketing club'

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

function formatPriceLabel(name: string, price: Stripe.Price | null): string {
  if (!price || price.unit_amount == null) return name
  const amount = (price.unit_amount / 100).toLocaleString('de-DE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
  const currency = price.currency?.toUpperCase() === 'EUR' ? '€' : price.currency?.toUpperCase() + ' '
  const interval = price.recurring?.interval === 'month' ? '/Monat' : ''
  return `${name} (${currency}${amount}${interval})`
}

export async function POST(req: Request) {
  const adminUser = await requireAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const body = (await req.json().catch(() => ({}))) as { name_pattern?: string }
  const pattern = (body.name_pattern ?? DEFAULT_PATTERN).toLowerCase().trim()
  if (!pattern) {
    return NextResponse.json({ error: 'Pattern darf nicht leer sein' }, { status: 400 })
  }

  const stripe = getStripe()
  const admin = createAdminClient()

  // 1) Alle aktiven Stripe-Products holen (max 20 Pages = 2000 Products)
  const allProducts: Stripe.Product[] = []
  let after: string | undefined = undefined
  for (let page = 0; page < 20; page++) {
    try {
      const list: Stripe.ApiList<Stripe.Product> = await stripe.products.list({
        limit: 100,
        starting_after: after,
        active: true,
      })
      allProducts.push(...list.data)
      if (!list.has_more) break
      after = list.data[list.data.length - 1].id
    } catch (err) {
      return NextResponse.json(
        {
          error: `Stripe-Products konnten nicht gelistet werden: ${
            err instanceof Error ? err.message : String(err)
          }`,
        },
        { status: 500 }
      )
    }
  }

  // 2) Filter auf Name-Pattern
  const matched = allProducts.filter((p) =>
    (p.name ?? '').toLowerCase().includes(pattern)
  )

  // 3) Existierende DB-Einträge laden (für Skip)
  const { data: existing } = await admin
    .from('skool_stripe_products')
    .select('stripe_product_id')
  const existingIds = new Set((existing ?? []).map((e) => e.stripe_product_id))

  // 4) Pro neuem Product: default_price laden für ein hübsches Label
  const toInsert = matched.filter((p) => !existingIds.has(p.id))
  let inserted = 0
  const failures: Array<{ product_id: string; error: string }> = []

  for (const p of toInsert) {
    let price: Stripe.Price | null = null
    if (p.default_price) {
      const priceId =
        typeof p.default_price === 'string' ? p.default_price : p.default_price.id
      try {
        price = await stripe.prices.retrieve(priceId)
      } catch {
        // Preis-Fetch fehlgeschlagen — Label ohne Preis
      }
    }
    const label = formatPriceLabel(p.name ?? p.id, price)

    const { error } = await admin.from('skool_stripe_products').insert({
      stripe_product_id: p.id,
      label,
      access_days: 365,
      active: true,
      notes: `Automatisch importiert (Pattern: "${pattern}")`,
    })
    if (error) {
      failures.push({ product_id: p.id, error: error.message })
    } else {
      inserted += 1
    }
  }

  return NextResponse.json({
    pattern,
    total_stripe_products: allProducts.length,
    matched: matched.length,
    already_in_db: matched.length - toInsert.length,
    inserted,
    failures: failures.length > 0 ? failures : undefined,
  })
}
