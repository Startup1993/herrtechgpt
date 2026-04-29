/**
 * Bulk-Add: mehrere Stripe-Product-IDs auf einmal in skool_stripe_products
 * eintragen. Nutzt die gleiche Label-Formatierung wie das Pattern-Import.
 *
 * POST /api/admin/community/products/add-bulk
 *   { items: Array<{ stripe_product_id, label?, access_days? }> }
 *
 * Defaults: access_days = 365, label = product.name + Preis (aus Stripe nachgeladen).
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe'
import type Stripe from 'stripe'

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

function formatPriceLabel(name: string, price: Stripe.Price | null): string {
  if (!price || price.unit_amount == null) return name
  const amount = (price.unit_amount / 100).toLocaleString('de-DE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
  const currency =
    price.currency?.toUpperCase() === 'EUR' ? '€' : price.currency?.toUpperCase() + ' '
  const interval = price.recurring?.interval === 'month' ? '/Monat' : ''
  return `${name} (${currency}${amount}${interval})`
}

export async function POST(req: Request) {
  const adminUser = await requireAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const body = (await req.json().catch(() => null)) as {
    items?: Array<{
      stripe_product_id?: string
      label?: string
      access_days?: number
    }>
  } | null

  const items = Array.isArray(body?.items) ? body!.items : []
  if (items.length === 0) {
    return NextResponse.json({ error: 'items required' }, { status: 400 })
  }

  const stripe = getStripe()
  const admin = createAdminClient()

  let inserted = 0
  const failures: Array<{ product_id: string; error: string }> = []

  for (const it of items) {
    const productId = it.stripe_product_id?.trim()
    if (!productId) {
      failures.push({ product_id: '?', error: 'stripe_product_id fehlt' })
      continue
    }

    // Label: vom Caller übergeben oder selbst aus Stripe bauen
    let label = it.label?.trim()
    if (!label) {
      try {
        const product = await stripe.products.retrieve(productId)
        let price: Stripe.Price | null = null
        if (product.default_price) {
          const pid =
            typeof product.default_price === 'string'
              ? product.default_price
              : product.default_price.id
          try {
            price = await stripe.prices.retrieve(pid)
          } catch {
            // ignore
          }
        }
        label = formatPriceLabel(product.name ?? productId, price)
      } catch {
        label = productId
      }
    }

    const { error } = await admin.from('skool_stripe_products').upsert(
      {
        stripe_product_id: productId,
        label,
        access_days: it.access_days ?? 365,
        active: true,
        notes: 'Aus Pre-Sync-Check hinzugefügt',
      },
      { onConflict: 'stripe_product_id' }
    )

    if (error) {
      failures.push({ product_id: productId, error: error.message })
    } else {
      inserted += 1
    }
  }

  return NextResponse.json({
    requested: items.length,
    inserted,
    failures: failures.length > 0 ? failures : undefined,
  })
}
