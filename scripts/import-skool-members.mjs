#!/usr/bin/env node
/**
 * Skool Members Initial-Import
 *
 * Zieht alle Stripe-Checkout-Sessions (mode=payment, status=complete) durch
 * und importiert jede, deren Product in skool_stripe_products als active
 * gelistet ist, in community_members.
 *
 * Läuft idempotent — mehrfaches Ausführen verdoppelt nichts (expires-Datum
 * wird überschrieben, purchase_count basiert auf distinct payment_intents).
 *
 * Usage:
 *   node --env-file=.env.local scripts/import-skool-members.mjs [--dry-run] [--days=180]
 *
 *   --dry-run  : nichts in die DB schreiben, nur loggen
 *   --days=N   : nur Sessions der letzten N Tage (default: 730 ≈ 2 Jahre)
 *
 * Erwartete ENV:
 *   STRIPE_SECRET_KEY
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const daysArg = args.find((a) => a.startsWith('--days='))
const LOOKBACK_DAYS = daysArg ? parseInt(daysArg.slice('--days='.length), 10) : 730

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-03-25.dahlia',
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

function log(...args) {
  console.log('[import]', ...args)
}

// ─── Step 1: Active Skool-Products laden ──────────────────────────────────
log('Lade aktive Skool-Products aus DB…')
const { data: products, error: pErr } = await supabase
  .from('skool_stripe_products')
  .select('stripe_product_id, label, access_days')
  .eq('active', true)

if (pErr) {
  console.error('DB-Fehler:', pErr.message)
  process.exit(1)
}
if (!products || products.length === 0) {
  console.error('Keine aktiven Products in skool_stripe_products. Leg welche an.')
  process.exit(1)
}

const productMap = new Map(products.map((p) => [p.stripe_product_id, p]))
log(`${products.length} aktive Product-IDs: ${[...productMap.keys()].join(', ')}`)

// ─── Step 2: Alle Payments der letzten N Tage durchsuchen ─────────────────
const since = Math.floor(Date.now() / 1000) - LOOKBACK_DAYS * 86400
log(`Suche Checkout-Sessions seit ${new Date(since * 1000).toISOString()}…`)

const sessionsToProcess = []
let startingAfter = undefined
let pages = 0

while (true) {
  const list = await stripe.checkout.sessions.list({
    limit: 100,
    starting_after: startingAfter,
    created: { gte: since },
  })
  pages += 1
  for (const s of list.data) {
    if (s.status !== 'complete') continue
    if (s.mode !== 'payment') continue
    sessionsToProcess.push(s)
  }
  if (!list.has_more) break
  startingAfter = list.data[list.data.length - 1].id
  if (pages > 100) {
    log('WARN: >100 Seiten — breche ab, enge --days ein')
    break
  }
}

log(`${sessionsToProcess.length} complete payment-Sessions gefunden`)

// ─── Step 3: Pro Session: Line-Items prüfen, matchen, upserten ────────────
let matched = 0
let skipped = 0
let errors = 0
const perCustomer = new Map() // customerId → { email, name, sessions: [...] }

for (const session of sessionsToProcess) {
  try {
    const items = await stripe.checkout.sessions.listLineItems(session.id, {
      limit: 10,
      expand: ['data.price.product'],
    })

    let matchedProduct = null
    let priceId = null
    for (const item of items.data) {
      const product = item.price?.product
      const pid = typeof product === 'string' ? product : product?.id
      if (pid && productMap.has(pid)) {
        matchedProduct = productMap.get(pid)
        priceId = item.price?.id ?? null
        break
      }
    }
    if (!matchedProduct) {
      skipped += 1
      continue
    }

    const customerId =
      typeof session.customer === 'string' ? session.customer : session.customer?.id
    if (!customerId) {
      log(`SKIP: Session ${session.id} ohne customer`)
      skipped += 1
      continue
    }

    const email = session.customer_details?.email ?? session.customer_email
    if (!email) {
      log(`SKIP: Session ${session.id} ohne email`)
      skipped += 1
      continue
    }

    const paymentIntentId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id ?? null

    const record = {
      sessionId: session.id,
      paymentIntentId,
      email,
      name: session.customer_details?.name ?? null,
      customerId,
      productId: matchedProduct.stripe_product_id,
      priceId,
      accessDays: matchedProduct.access_days,
      purchasedAt: new Date((session.created ?? Date.now() / 1000) * 1000),
    }

    matched += 1
    if (!perCustomer.has(customerId)) {
      perCustomer.set(customerId, {
        email,
        name: record.name,
        sessions: [],
      })
    }
    perCustomer.get(customerId).sessions.push(record)
  } catch (err) {
    errors += 1
    console.error(`Fehler bei Session ${session.id}:`, err.message)
  }
}

log(`Gematched: ${matched} · Skipped: ${skipped} · Errors: ${errors}`)
log(`Unique customers: ${perCustomer.size}`)

// ─── Step 4: Pro Customer → jüngster Kauf bestimmt expires_at ─────────────
for (const [customerId, info] of perCustomer) {
  info.sessions.sort((a, b) => b.purchasedAt - a.purchasedAt)
  const latest = info.sessions[0]
  const expires = new Date(
    latest.purchasedAt.getTime() + latest.accessDays * 86400 * 1000
  )

  const payload = {
    stripe_customer_id: customerId,
    email: info.email.toLowerCase(),
    name: info.name,
    skool_status: expires > new Date() ? 'active' : 'alumni',
    skool_access_started_at: info.sessions[info.sessions.length - 1].purchasedAt.toISOString(),
    skool_access_expires_at: expires.toISOString(),
    last_purchase_at: latest.purchasedAt.toISOString(),
    last_stripe_product_id: latest.productId,
    last_stripe_price_id: latest.priceId,
    last_stripe_payment_intent: latest.paymentIntentId,
    purchase_count: info.sessions.length,
  }

  if (DRY_RUN) {
    log(
      `[DRY] ${info.email} (${customerId}) · ${info.sessions.length} Käufe · bis ${expires.toISOString().slice(0, 10)} · ${payload.skool_status}`
    )
    continue
  }

  const { error } = await supabase
    .from('community_members')
    .upsert(payload, { onConflict: 'stripe_customer_id' })

  if (error) {
    console.error(`DB-Upsert fehlgeschlagen für ${info.email}:`, error.message)
  } else {
    log(
      `OK ${info.email} · ${info.sessions.length} Käufe · bis ${expires.toISOString().slice(0, 10)} · ${payload.skool_status}`
    )
  }
}

log('Fertig.')
