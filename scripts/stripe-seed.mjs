#!/usr/bin/env node
/**
 * Stripe Seed-Script — Herr Tech World
 *
 * Legt in Stripe an:
 *   - 3 Abo-Produkte (S/M/L) mit je 2 Prices (Basic + Community, monatlich)
 *   - 3 Top-up-Produkte (+100/+500/+2000 Credits) mit je 2 Prices (Basic + Community)
 *
 * **Idempotent:** Script mehrfach ausführen macht nichts doppelt. Läuft gegen
 * den Stripe-Account, der zu STRIPE_SECRET_KEY gehört (Test- oder Live-Modus).
 *
 * Usage:
 *   1. Lokal: .env.local anlegen mit STRIPE_SECRET_KEY=sk_test_xxx
 *      (oder: `vercel env pull .env.local` wenn Keys schon in Vercel sind)
 *   2. `npm run stripe:seed`
 *
 * Jährliche Preise sind hier bewusst NICHT angelegt (Phase 1 = monatlich only).
 * Wenn Jahresabos benötigt werden, weitere Prices pro Product im Dashboard oder
 * diesem Script ergänzen.
 */

import Stripe from 'stripe'

// ─── Config ───────────────────────────────────────────────────────────────

const PLANS = [
  {
    slug: 'herr_tech_s',
    dbPlanId: 'plan_s',
    tier: 'S',
    name: 'Herr Tech World – Abo S',
    description:
      'Starter-Abo. Herr Tech GPT + KI Toolbox mit 200 Credits pro Monat. ' +
      'Für KI Marketing Club Mitglieder kostenlos enthalten.',
    prices: [
      { band: 'basic', cycle: 'monthly', amount: 1900 },
      { band: 'community', cycle: 'monthly', amount: 0 },
    ],
  },
  {
    slug: 'herr_tech_m',
    dbPlanId: 'plan_m',
    tier: 'M',
    name: 'Herr Tech World – Abo M',
    description:
      'Professional-Abo für aktive Content-Creator. Herr Tech GPT + KI Toolbox ' +
      'mit 1.500 Credits pro Monat.',
    prices: [
      { band: 'basic', cycle: 'monthly', amount: 4900 },
      { band: 'community', cycle: 'monthly', amount: 2900 },
    ],
  },
  {
    slug: 'herr_tech_l',
    dbPlanId: 'plan_l',
    tier: 'L',
    name: 'Herr Tech World – Abo L',
    description:
      'Power-Abo für Agenturen und Power-User. Herr Tech GPT + KI Toolbox ' +
      'mit 5.000 Credits pro Monat plus Early Access für neue Features.',
    prices: [
      { band: 'basic', cycle: 'monthly', amount: 9900 },
      { band: 'community', cycle: 'monthly', amount: 6900 },
    ],
  },
]

const PACKS = [
  {
    slug: 'pack_100',
    dbPackId: 'pack_100',
    name: 'Herr Tech World – +100 Credits',
    description: '100 zusätzliche Credits. Gültig 12 Monate ab Kauf.',
    credits: 100,
    prices: [
      { band: 'basic', amount: 900 },
      { band: 'community', amount: 600 },
    ],
  },
  {
    slug: 'pack_500',
    dbPackId: 'pack_500',
    name: 'Herr Tech World – +500 Credits',
    description: '500 zusätzliche Credits. Gültig 12 Monate ab Kauf.',
    credits: 500,
    prices: [
      { band: 'basic', amount: 3500 },
      { band: 'community', amount: 2500 },
    ],
  },
  {
    slug: 'pack_2000',
    dbPackId: 'pack_2000',
    name: 'Herr Tech World – +2.000 Credits',
    description: '2.000 zusätzliche Credits. Gültig 12 Monate ab Kauf.',
    credits: 2000,
    prices: [
      { band: 'basic', amount: 9900 },
      { band: 'community', amount: 6900 },
    ],
  },
]

// ─── Setup ────────────────────────────────────────────────────────────────

const secretKey = process.env.STRIPE_SECRET_KEY
if (!secretKey) {
  console.error(
    '\n✘ STRIPE_SECRET_KEY fehlt.\n' +
      '  In .env.local eintragen (sk_test_xxx) und neu starten:\n' +
      '    echo "STRIPE_SECRET_KEY=sk_test_xxx" > .env.local\n' +
      '  Oder aus Vercel pullen: `vercel env pull .env.local`\n'
  )
  process.exit(1)
}

const isLiveMode = secretKey.startsWith('sk_live_')
const stripe = new Stripe(secretKey, {
  apiVersion: '2026-03-25.dahlia',
  appInfo: { name: 'Herr Tech World Seed-Script' },
})

// ─── Helpers ─────────────────────────────────────────────────────────────

/**
 * Findet ein Product per metadata.slug, oder erstellt es wenn nicht vorhanden.
 */
async function ensureProduct(slug, params) {
  // Stripe hat keine Metadata-Suche — also alle aktiven Products durchgehen.
  // Bei <100 Produkten ist das kein Problem.
  let existing = null
  for await (const p of stripe.products.list({ active: true, limit: 100 })) {
    if (p.metadata?.slug === slug) {
      existing = p
      break
    }
  }

  if (existing) {
    console.log(`   ↻ Product existiert: ${existing.id} (slug=${slug})`)
    // Name/Desc aktualisieren falls geändert
    if (existing.name !== params.name || existing.description !== params.description) {
      await stripe.products.update(existing.id, {
        name: params.name,
        description: params.description,
      })
      console.log(`   ✎ Name/Beschreibung aktualisiert`)
    }
    return existing
  }

  const created = await stripe.products.create({
    name: params.name,
    description: params.description,
    metadata: { slug, ...(params.metadata || {}) },
  })
  console.log(`   ✓ Product angelegt: ${created.id}`)
  return created
}

/**
 * Findet einen Price per lookup_key (Stripe-native Idempotenz), oder erstellt ihn.
 * lookup_key ist z.B. "plan_s_basic_monthly" — eindeutig pro Account.
 */
async function ensurePrice(lookupKey, productId, params) {
  const existing = await stripe.prices.list({
    lookup_keys: [lookupKey],
    active: true,
    limit: 1,
  })

  if (existing.data.length > 0) {
    const p = existing.data[0]
    console.log(
      `     ↻ Price existiert: ${p.id} (${lookupKey}, ${(p.unit_amount / 100).toFixed(2)} €)`
    )
    return p
  }

  const priceParams = {
    product: productId,
    currency: 'eur',
    unit_amount: params.amount,
    lookup_key: lookupKey,
    metadata: params.metadata || {},
    tax_behavior: 'inclusive', // Brutto-Preise (deutsche Konvention)
  }

  if (params.recurring) {
    // Unsere Config nutzt 'monthly' / 'yearly' (human-readable),
    // Stripe will 'month' / 'year'. Mapping hier.
    const intervalMap = { monthly: 'month', yearly: 'year' }
    const interval = intervalMap[params.recurring]
    if (!interval) {
      throw new Error(`Unbekanntes recurring-Interval: ${params.recurring}`)
    }
    priceParams.recurring = { interval }
  }

  const created = await stripe.prices.create(priceParams)
  console.log(
    `     ✓ Price angelegt: ${created.id} (${lookupKey}, ${(params.amount / 100).toFixed(2)} €)`
  )
  return created
}

// ─── Main ────────────────────────────────────────────────────────────────

async function main() {
  const modeLabel = isLiveMode ? '⚠️  LIVE-MODE' : '🧪 TEST-MODE'
  console.log(`\n${modeLabel} — Seed-Script läuft…\n`)

  if (isLiveMode) {
    console.log('   GEFAHR: Du arbeitest gegen den produktiven Stripe-Account.')
    console.log('   Das Script erzeugt reale Produkte. In 5 Sekunden geht\'s los…\n')
    await new Promise((r) => setTimeout(r, 5000))
  }

  const results = { plans: [], packs: [] }

  // ─── Plans ──────────────────────────────────────────────────────────
  for (const plan of PLANS) {
    console.log(`\n→ Plan ${plan.tier} (${plan.slug})`)
    const product = await ensureProduct(plan.slug, {
      name: plan.name,
      description: plan.description,
      metadata: { tier: plan.tier, type: 'subscription' },
    })

    const priceIds = {}
    for (const price of plan.prices) {
      const lookupKey = `${plan.dbPlanId}_${price.band}_${price.cycle}`
      const p = await ensurePrice(lookupKey, product.id, {
        amount: price.amount,
        recurring: price.cycle, // 'monthly' | 'yearly'
        metadata: {
          tier: plan.tier,
          band: price.band,
          cycle: price.cycle,
        },
      })
      priceIds[`${price.band}_${price.cycle}`] = p.id
    }

    results.plans.push({
      dbPlanId: plan.dbPlanId,
      tier: plan.tier,
      productId: product.id,
      prices: priceIds,
    })
  }

  // ─── Top-up Packs ───────────────────────────────────────────────────
  for (const pack of PACKS) {
    console.log(`\n→ Pack ${pack.credits} Credits (${pack.slug})`)
    const product = await ensureProduct(pack.slug, {
      name: pack.name,
      description: pack.description,
      metadata: {
        credits: String(pack.credits),
        type: 'credit_topup',
      },
    })

    const priceIds = {}
    for (const price of pack.prices) {
      const lookupKey = `${pack.dbPackId}_${price.band}`
      const p = await ensurePrice(lookupKey, product.id, {
        amount: price.amount,
        // Einmalkauf — KEIN recurring
        metadata: {
          credits: String(pack.credits),
          band: price.band,
          type: 'credit_topup',
        },
      })
      priceIds[price.band] = p.id
    }

    results.packs.push({
      dbPackId: pack.dbPackId,
      productId: product.id,
      prices: priceIds,
    })
  }

  // ─── Output: Admin-UI Tabelle ───────────────────────────────────────
  console.log('\n\n═══════════════════════════════════════════════════════════════')
  console.log('  ERGEBNIS — Kopiere diese IDs ins Admin-UI:')
  console.log('  /admin/monetization/plans  und  /admin/monetization/credits')
  console.log('═══════════════════════════════════════════════════════════════\n')

  console.log('## Abo-Pläne\n')
  for (const r of results.plans) {
    console.log(`**Plan ${r.tier}** (DB-ID: \`${r.dbPlanId}\`)`)
    console.log(`  Stripe Product-ID:          ${r.productId}`)
    console.log(`  Price Basic — monatlich:    ${r.prices.basic_monthly}`)
    console.log(`  Price Community — monatlich:${r.prices.community_monthly}`)
    console.log()
  }

  console.log('## Top-up-Pakete\n')
  for (const r of results.packs) {
    console.log(`**Pack** (DB-ID: \`${r.dbPackId}\`)`)
    console.log(`  Stripe Product-ID:      ${r.productId}`)
    console.log(`  Price Basic:            ${r.prices.basic}`)
    console.log(`  Price Community:        ${r.prices.community}`)
    console.log()
  }

  // ─── Output: SQL-Snippet für direktes DB-Update ─────────────────────
  console.log('\n## SQL (optional — nach Migration 028 direkt in Supabase ausführen)\n')
  console.log('```sql')
  for (const r of results.plans) {
    console.log(
      `UPDATE plans SET stripe_product_id='${r.productId}', ` +
        `stripe_price_basic_monthly='${r.prices.basic_monthly}', ` +
        `stripe_price_community_monthly='${r.prices.community_monthly}' ` +
        `WHERE id='${r.dbPlanId}';`
    )
  }
  for (const r of results.packs) {
    console.log(
      `UPDATE credit_packs SET stripe_product_id='${r.productId}', ` +
        `stripe_price_basic='${r.prices.basic}', ` +
        `stripe_price_community='${r.prices.community}' ` +
        `WHERE id='${r.dbPackId}';`
    )
  }
  console.log('```\n')

  console.log('✓ Seeding abgeschlossen.\n')
}

main().catch((err) => {
  console.error('\n✘ Seeding fehlgeschlagen:', err.message)
  if (err.type) console.error('  Stripe-Type:', err.type)
  if (err.code) console.error('  Stripe-Code:', err.code)
  process.exit(1)
})
