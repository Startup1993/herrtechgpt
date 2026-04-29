/**
 * Pre-Sync-Check: listet alle Stripe-Products mit dem Pattern im Namen
 * (default: "ki marketing club"), die NICHT in skool_stripe_products
 * registriert sind. Plus Default-Price-Info für die Anzeige.
 *
 * GET /api/admin/community/products/scan-new[?pattern=...]
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe'
import type Stripe from 'stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

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

export async function GET(request: Request) {
  const adminUser = await requireAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const url = new URL(request.url)
  const pattern = (url.searchParams.get('pattern') ?? DEFAULT_PATTERN)
    .toLowerCase()
    .trim()

  const stripe = getStripe()
  const admin = createAdminClient()

  // Alle aktiven Stripe-Products laden (paginiert)
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

  // Pattern-Filter (Name enthält Pattern, case-insensitive)
  const matched = allProducts.filter((p) =>
    (p.name ?? '').toLowerCase().includes(pattern)
  )

  // Existing-IDs aus DB
  const { data: existing } = await admin
    .from('skool_stripe_products')
    .select('stripe_product_id')
  const existingIds = new Set((existing ?? []).map((e) => e.stripe_product_id))

  // Neu = matched, aber noch nicht in DB
  const newProducts = matched.filter((p) => !existingIds.has(p.id))

  // Pro neuem Product: Default-Price laden (für Display: Preis + Currency)
  type PriceInfo = {
    id: string | null
    amount: number | null
    currency: string
    recurring: 'month' | 'year' | 'week' | 'day' | null
  }
  type Out = {
    id: string
    name: string
    created: number
    description: string | null
    price: PriceInfo | null
  }
  const result: Out[] = []
  for (const p of newProducts) {
    let priceInfo: PriceInfo | null = null
    if (p.default_price) {
      const priceId =
        typeof p.default_price === 'string' ? p.default_price : p.default_price.id
      try {
        const price = await stripe.prices.retrieve(priceId)
        priceInfo = {
          id: price.id,
          amount: price.unit_amount,
          currency: price.currency,
          recurring: (price.recurring?.interval ?? null) as PriceInfo['recurring'],
        }
      } catch {
        // ignore — Label ohne Preis
      }
    }
    result.push({
      id: p.id,
      name: p.name ?? p.id,
      created: p.created,
      description: p.description ?? null,
      price: priceInfo,
    })
  }

  // Neu zuerst (jüngstes Stripe-Created-Datum oben)
  result.sort((a, b) => b.created - a.created)

  return NextResponse.json({
    pattern,
    new_products: result,
    counts: {
      total_stripe_products: allProducts.length,
      matched: matched.length,
      already_in_db: existingIds.size,
      new: result.length,
    },
  })
}
