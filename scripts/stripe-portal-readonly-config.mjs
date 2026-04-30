#!/usr/bin/env node
/**
 * Erstellt (oder aktualisiert) eine Stripe Portal-Configuration die NUR
 * Karte/Adresse/Rechnungen erlaubt — kein Plan-Wechsel, keine Kündigung.
 *
 * Wird vom "Rechnungen & Zahlungsdaten"-Button benutzt. Plan-Wechsel + Kündigung
 * läuft nur über unsere App-UI (Pricing-Seite + Billing-Page-Buttons).
 *
 * Idempotent über metadata.slug='herrtech-readonly'.
 *
 * Usage:
 *   STRIPE_SECRET_KEY=sk_test_xxx node scripts/stripe-portal-readonly-config.mjs
 */

import Stripe from 'stripe'

const secretKey = process.env.STRIPE_SECRET_KEY
if (!secretKey) {
  console.error('STRIPE_SECRET_KEY fehlt')
  process.exit(1)
}

const stripe = new Stripe(secretKey, { apiVersion: '2026-03-25.dahlia' })
const isLive = secretKey.startsWith('sk_live_')

const features = {
  customer_update: {
    enabled: true,
    allowed_updates: ['email', 'address', 'tax_id', 'name', 'phone'],
  },
  payment_method_update: { enabled: true },
  invoice_history: { enabled: true },
  subscription_update: { enabled: false },
  subscription_cancel: { enabled: false },
}

const businessProfile = {
  headline: 'Verwalte deine Zahlungsdaten und Rechnungen',
}

const slug = 'herrtech-readonly'

async function main() {
  console.log(`\n${isLive ? '⚠️  LIVE-MODE' : '🧪 TEST-MODE'}\n`)

  // Existing search per metadata.slug
  let existing = null
  for await (const cfg of stripe.billingPortal.configurations.list({ limit: 100 })) {
    if (cfg.metadata?.slug === slug) {
      existing = cfg
      break
    }
  }

  if (existing) {
    console.log(`↻ Config existiert: ${existing.id}`)
    const updated = await stripe.billingPortal.configurations.update(existing.id, {
      business_profile: businessProfile,
      features,
    })
    console.log(`✓ Aktualisiert.`)
    console.log(`\nID:  ${updated.id}\n`)
    return
  }

  const created = await stripe.billingPortal.configurations.create({
    business_profile: businessProfile,
    features,
    metadata: { slug },
  })
  console.log(`✓ Neue Config angelegt.`)
  console.log(`\nID:  ${created.id}\n`)
  console.log(`In Vercel als STRIPE_PORTAL_CONFIG_READONLY eintragen.\n`)
}

main().catch((err) => {
  console.error('Fehler:', err.message)
  process.exit(1)
})
