/**
 * Stripe Webhook-Handler
 *
 * Empfängt Events von Stripe und synct den App-Zustand.
 * - Signatur-Verifikation via STRIPE_WEBHOOK_SECRET (Pflicht — ohne brechen wir ab)
 * - Idempotenz via stripe_events.event_id (UNIQUE constraint)
 *
 * Events, die wir verarbeiten:
 *   checkout.session.completed         — nach erfolgreichem Checkout
 *   customer.subscription.created      — neues Abo
 *   customer.subscription.updated      — Plan-Wechsel, Periodenwechsel, Cancel-Flag
 *   customer.subscription.deleted      — Abo beendet
 *   invoice.payment_succeeded          — Rebill OK → monatl. Credits neu gutschreiben
 *   invoice.payment_failed             — Rebill fehlgeschlagen → Status past_due
 *   payment_intent.succeeded           — Einmalkauf (Top-up) durch
 *
 * Body muss RAW sein (nicht JSON-parsed), sonst scheitert Signatur.
 * Next.js App Router: `await req.text()` liefert Raw-Body.
 */

import { NextResponse } from 'next/server'
import { getStripe, verifyWebhook } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { grantMonthlyCredits, grantPurchasedCredits } from '@/lib/monetization'
import type Stripe from 'stripe'

export const runtime = 'nodejs' // 'edge' kann keine Stripe-Signatur-Verifikation
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 })
  }

  const rawBody = await req.text()

  let event: Stripe.Event
  try {
    event = verifyWebhook(rawBody, signature)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[stripe-webhook] Signatur ungültig:', msg)
    return NextResponse.json({ error: `Invalid signature: ${msg}` }, { status: 400 })
  }

  const admin = createAdminClient()

  // ─── Idempotenz: Event-ID im Log prüfen ──────────────────────────────
  const { data: existing } = await admin
    .from('stripe_events')
    .select('id, processed_at')
    .eq('event_id', event.id)
    .maybeSingle()

  if (existing?.processed_at) {
    // Schon verarbeitet — 200 OK, damit Stripe nicht retried
    return NextResponse.json({ received: true, idempotent: true })
  }

  // Event persistieren (UNIQUE event_id schützt gegen doppelte Einträge)
  if (!existing) {
    await admin.from('stripe_events').insert({
      event_id: event.id,
      event_type: event.type,
      payload: event as unknown as Record<string, unknown>,
    })
  }

  // ─── Event routing ───────────────────────────────────────────────────
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpsert(event.data.object as Stripe.Subscription)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      case 'invoice.payment_succeeded':
        await handleInvoicePaid(event.data.object as Stripe.Invoice)
        break
      case 'invoice.payment_failed':
        await handleInvoiceFailed(event.data.object as Stripe.Invoice)
        break
      case 'payment_intent.succeeded':
        // Top-up erfolgreiche Zahlung — wird hauptsächlich via checkout.session.completed
        // abgehandelt. Hier als Fallback wenn jemand direkt PaymentIntent nutzt.
        break
      default:
        // Andere Events ignorieren, aber als verarbeitet markieren
        break
    }

    await admin
      .from('stripe_events')
      .update({ processed_at: new Date().toISOString() })
      .eq('event_id', event.id)

    return NextResponse.json({ received: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[stripe-webhook] Fehler bei ${event.type}:`, msg)
    await admin.from('stripe_events').update({ error: msg }).eq('event_id', event.id)
    // 500 zurückgeben → Stripe retried den Webhook
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// ─── Handler Implementations ─────────────────────────────────────────────

/**
 * checkout.session.completed — wird bei jedem erfolgreichen Checkout gefeuert.
 * Unterscheidet zwischen Subscription- und One-Time-Mode:
 *   - mode='subscription' → Abo (Credits kommen via invoice.payment_succeeded)
 *   - mode='payment' → One-Time (Top-up) → wir schreiben Credits hier gut
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const admin = createAdminClient()
  const userId = session.metadata?.user_id
  if (!userId) {
    throw new Error(`checkout.session.completed ohne user_id in metadata (session ${session.id})`)
  }

  // Top-up (one-time payment)
  if (session.mode === 'payment') {
    const packId = session.metadata?.pack_id
    const credits = parseInt(session.metadata?.credits ?? '0', 10)
    const expiryMonths = parseInt(session.metadata?.expiry_months ?? '12', 10)

    if (!packId || !credits) {
      throw new Error(`Top-up-Session ohne pack_id/credits (${session.id})`)
    }

    const paymentIntentId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id ?? null

    await grantPurchasedCredits({
      userId,
      amount: credits,
      packId,
      expiryMonths,
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: paymentIntentId ?? undefined,
    })
    return
  }

  // Subscription: die Subscription wird separat via customer.subscription.created
  // angelegt — hier nur Customer-ID nachtragen falls noch nicht vorhanden.
  if (session.mode === 'subscription' && session.customer) {
    const customerId =
      typeof session.customer === 'string' ? session.customer : session.customer.id

    await admin
      .from('profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', userId)
      .is('stripe_customer_id', null)
  }
}

/**
 * customer.subscription.created + updated — Upsert in DB.
 * Holt Plan- und Preisband-Info aus Stripe-Price-Metadata (die wir im Seed gesetzt haben).
 */
async function handleSubscriptionUpsert(sub: Stripe.Subscription) {
  const admin = createAdminClient()
  const stripe = getStripe()

  // User-ID über Customer-Metadata oder profiles-Lookup
  const userId = await resolveUserIdFromCustomer(sub.customer)
  if (!userId) {
    throw new Error(`Subscription ${sub.id} hat keinen zuordenbaren User (customer ${sub.customer})`)
  }

  // Primäres Price-Item → Plan + Band ableiten
  const priceItem = sub.items.data[0]
  if (!priceItem) {
    throw new Error(`Subscription ${sub.id} hat keine items`)
  }

  // Price full laden um Metadata (tier, band, cycle) zu bekommen
  const price = await stripe.prices.retrieve(priceItem.price.id)
  const tier = price.metadata?.tier as 'S' | 'M' | 'L' | undefined
  const band = price.metadata?.band as 'basic' | 'community' | undefined
  const cycle = price.metadata?.cycle as 'monthly' | 'yearly' | undefined

  if (!tier || !band) {
    throw new Error(
      `Price ${price.id} fehlt tier/band-Metadata — vom Seed-Script mitgeliefert`
    )
  }

  // DB-Plan finden (plan_s/plan_m/plan_l per Stripe-Price-ID oder Tier+Band)
  const { data: plan } = await admin
    .from('plans')
    .select('id, credits_per_month')
    .or(
      [
        `stripe_price_basic_monthly.eq.${price.id}`,
        `stripe_price_community_monthly.eq.${price.id}`,
        `stripe_price_basic_yearly.eq.${price.id}`,
        `stripe_price_community_yearly.eq.${price.id}`,
      ].join(',')
    )
    .maybeSingle()

  if (!plan) {
    throw new Error(
      `Kein DB-Plan für Stripe-Price ${price.id} (tier=${tier}) gefunden — Admin-UI checken`
    )
  }

  // Status mapping (Stripe → unser ENUM)
  const statusMap: Record<string, string> = {
    active: 'active',
    trialing: 'trialing',
    past_due: 'past_due',
    canceled: 'cancelled',
    unpaid: 'past_due',
    incomplete: 'past_due',
    incomplete_expired: 'ended',
  }
  const dbStatus = statusMap[sub.status] ?? 'past_due'

  const subRow = sub as unknown as {
    current_period_start: number
    current_period_end: number
  }

  await admin.from('subscriptions').upsert(
    {
      user_id: userId,
      plan_id: plan.id,
      status: dbStatus,
      price_band: band,
      billing_cycle: cycle ?? 'monthly',
      stripe_subscription_id: sub.id,
      stripe_price_id: price.id,
      current_period_start: new Date(subRow.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subRow.current_period_end * 1000).toISOString(),
      cancel_at_period_end: sub.cancel_at_period_end,
      cancelled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
      ended_at: sub.ended_at ? new Date(sub.ended_at * 1000).toISOString() : null,
    },
    { onConflict: 'stripe_subscription_id' }
  )

  // Bei neuem oder aktiv gewordenem Abo → Credits gutschreiben
  if (dbStatus === 'active' || dbStatus === 'trialing') {
    await grantMonthlyCredits({
      userId,
      amount: plan.credits_per_month,
      resetAt: new Date(subRow.current_period_end * 1000),
      reason: 'monthly_grant',
    })
  }
}

/**
 * customer.subscription.deleted — Abo komplett beendet.
 * Credits NICHT sofort löschen — purchased_balance soll erhalten bleiben,
 * monthly_balance wird beim nächsten reset natürlich 0.
 */
async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  const admin = createAdminClient()
  await admin
    .from('subscriptions')
    .update({
      status: 'ended',
      ended_at: sub.ended_at ? new Date(sub.ended_at * 1000).toISOString() : new Date().toISOString(),
    })
    .eq('stripe_subscription_id', sub.id)
}

/**
 * invoice.payment_succeeded — monatlicher Rebill oder erste Zahlung.
 * Verlängert Periodenende und credits_per_month neu gutschreiben.
 *
 * Hinweis: In Stripe API 2026-03 ist `invoice.subscription` aus dem TS-Type
 * verschwunden, im Webhook-Payload aber weiterhin vorhanden. Wir lesen es
 * defensiv aus (string oder Objekt).
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const subId = extractSubscriptionId(invoice)
  if (!subId) return

  const stripe = getStripe()
  const sub = await stripe.subscriptions.retrieve(subId)
  await handleSubscriptionUpsert(sub)
}

/**
 * invoice.payment_failed — Kreditkarte abgelehnt o.ä.
 * Stripe retried automatisch (Smart Retries); wir setzen nur Status.
 */
async function handleInvoiceFailed(invoice: Stripe.Invoice) {
  const subId = extractSubscriptionId(invoice)
  if (!subId) return

  const admin = createAdminClient()
  await admin
    .from('subscriptions')
    .update({ status: 'past_due' })
    .eq('stripe_subscription_id', subId)
}

/**
 * Extrahiert die subscription-ID aus einer Invoice — robust gegen
 * verschiedene Stripe-API-Versionen (v1: invoice.subscription,
 * ab 2026-03: invoice.parent.subscription_details.subscription).
 */
function extractSubscriptionId(invoice: Stripe.Invoice): string | null {
  const raw = invoice as unknown as {
    subscription?: string | { id: string } | null
    parent?: {
      subscription_details?: { subscription?: string | { id: string } } | null
      type?: string
    } | null
  }

  const direct = raw.subscription
  if (typeof direct === 'string') return direct
  if (direct && typeof direct === 'object' && 'id' in direct) return direct.id

  const nested = raw.parent?.subscription_details?.subscription
  if (typeof nested === 'string') return nested
  if (nested && typeof nested === 'object' && 'id' in nested) return nested.id

  return null
}

// ─── Helpers ─────────────────────────────────────────────────────────────

async function resolveUserIdFromCustomer(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null
): Promise<string | null> {
  if (!customer) return null
  const customerId = typeof customer === 'string' ? customer : customer.id

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle()

  if (profile?.id) return profile.id

  // Fallback: Customer in Stripe laden und metadata.user_id nutzen
  const stripe = getStripe()
  const full = await stripe.customers.retrieve(customerId)
  if ('deleted' in full && full.deleted) return null
  return (full as Stripe.Customer).metadata?.user_id ?? null
}
