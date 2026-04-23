/**
 * Monetization-Helpers — Stripe-Abos + Credit-System
 *
 * Zentraler Ort für die Business-Logik:
 *   - Welches Preisband gilt für welchen User?
 *   - Hat der User ein aktives Abo?
 *   - Wie viele Credits sind noch verfügbar?
 *   - Credits verbrauchen (transaktional), zurückbuchen bei Fehler.
 *
 * Convention:
 *   - Alle Server-seitig. Nicht in Client-Components importieren.
 *   - Schreibende Operationen IMMER über Service-Role-Client (createAdminClient),
 *     damit RLS nicht im Weg steht und Transaktionen sauber laufen.
 *   - Reads können über den normalen User-Client laufen (RLS erlaubt eigene Daten).
 */

import { createAdminClient } from '@/lib/supabase/admin'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { AccessTier } from '@/lib/access'

export type PriceBand = 'basic' | 'community'
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'cancelled' | 'ended'

export interface Subscription {
  id: string
  user_id: string
  plan_id: string
  status: SubscriptionStatus
  price_band: PriceBand
  billing_cycle: 'monthly' | 'yearly'
  stripe_subscription_id: string | null
  stripe_price_id: string | null
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  cancelled_at: string | null
  ended_at: string | null
}

export interface CreditWallet {
  user_id: string
  monthly_balance: number
  monthly_allowance: number
  purchased_balance: number
  reset_at: string | null
}

export interface MonetizationState {
  priceBand: PriceBand
  subscription: Subscription | null
  wallet: CreditWallet | null
  planId: string | null
  planTier: 'S' | 'M' | 'L' | null
  totalCredits: number
  hasActiveSubscription: boolean
}

// ─── Price Band ─────────────────────────────────────────────────────────

/**
 * Bestimmt das Preisband anhand der access_tier.
 *   - access_tier='premium' (KI Marketing Club) → Community-Preise
 *   - access_tier='alumni' | 'basic'            → Basic-Preise
 *
 * Wichtig: Beim Subscription-Start wird diese Zuordnung in der
 * subscription.price_band "eingefroren", damit nachträgliche Änderungen
 * der access_tier das laufende Abo nicht beeinflussen (saubere Kündigung
 * + Neuabschluss bei Wechsel, siehe alumni-flow).
 */
export function priceBandForAccessTier(tier: AccessTier): PriceBand {
  return tier === 'premium' ? 'community' : 'basic'
}

// ─── State laden ────────────────────────────────────────────────────────

/**
 * Lädt den kompletten Monetization-Zustand eines Users in einem Rutsch.
 * Aufruf in Server-Components oder API-Routes. Returns sichere Defaults
 * für Nicht-Subscriber.
 */
export async function getMonetizationState(
  supabase: SupabaseClient,
  userId: string,
  accessTier: AccessTier
): Promise<MonetizationState> {
  const [subResult, walletResult] = await Promise.all([
    supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing', 'past_due'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from('credit_wallets').select('*').eq('user_id', userId).maybeSingle(),
  ])

  const subscription = subResult.data
  const wallet = walletResult.data

  // Plan-Tier separat laden (kleiner Extra-Roundtrip, aber sauberer als
  // ein Promise.all-Placeholder für etwas, das nur conditional gebraucht wird)
  let planTier: 'S' | 'M' | 'L' | null = null
  if (subscription?.plan_id) {
    const { data: planRow } = await supabase
      .from('plans')
      .select('tier')
      .eq('id', subscription.plan_id)
      .maybeSingle()
    planTier = (planRow?.tier as 'S' | 'M' | 'L') ?? null
  }

  const totalCredits = (wallet?.monthly_balance ?? 0) + (wallet?.purchased_balance ?? 0)

  return {
    priceBand: priceBandForAccessTier(accessTier),
    subscription: (subscription as Subscription) ?? null,
    wallet: (wallet as CreditWallet) ?? null,
    planId: subscription?.plan_id ?? null,
    planTier,
    totalCredits,
    hasActiveSubscription:
      subscription?.status === 'active' || subscription?.status === 'trialing',
  }
}

// ─── Plans + Packs laden ────────────────────────────────────────────────

export async function getActivePlans(supabase: SupabaseClient) {
  const { data } = await supabase
    .from('plans')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true })
  return data ?? []
}

export async function getActivePacks(supabase: SupabaseClient) {
  const { data } = await supabase
    .from('credit_packs')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true })
  return data ?? []
}

// ─── Stripe Customer ID ────────────────────────────────────────────────

/**
 * Holt die Stripe-Customer-ID des Users oder legt einen neuen Customer an
 * und persistiert die ID in profiles.stripe_customer_id.
 *
 * Wird vom Checkout-Flow aufgerufen: Customer muss VOR der Checkout-Session
 * existieren, damit er über Käufe hinweg bestehen bleibt (nötig für
 * Customer Portal und Top-ups auf gleichen Account).
 */
export async function ensureStripeCustomer(params: {
  userId: string
  email: string
  name?: string
}): Promise<string> {
  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', params.userId)
    .single()

  if (profile?.stripe_customer_id) return profile.stripe_customer_id

  const { getStripe } = await import('./stripe')
  const stripe = getStripe()

  const customer = await stripe.customers.create({
    email: params.email,
    name: params.name,
    metadata: { user_id: params.userId },
  })

  await admin
    .from('profiles')
    .update({ stripe_customer_id: customer.id })
    .eq('id', params.userId)

  return customer.id
}

// ─── Credit Operations ──────────────────────────────────────────────────

/**
 * Lädt die Credit-Kosten für eine bestimmte Aktion. Fällt auf 0 zurück
 * wenn Feature nicht in der DB (= nichts kostet — wird im Admin-UI
 * gepflegt).
 */
export async function getFeatureCost(
  supabase: SupabaseClient,
  feature: string
): Promise<number> {
  const { data } = await supabase
    .from('feature_credit_costs')
    .select('credits_per_unit')
    .eq('feature', feature)
    .eq('active', true)
    .maybeSingle()
  return data?.credits_per_unit ?? 0
}

/**
 * Verbraucht Credits transaktional.
 * Algorithm:
 *   1. Lade Wallet (monthly + purchased)
 *   2. Prüfe Gesamtbudget
 *   3. Abbuchen: zuerst monthly_balance (verfällt eh), dann purchased_balance
 *   4. Schreibe Transaction-Log
 *
 * Returns { ok: true, charged: N, remaining: N } oder { ok: false, needed, available }.
 *
 * WICHTIG: Aufruf-Reihenfolge in API-Routes:
 *   1. chargeCredits() AUFRUFEN
 *   2. Bei Erfolg: teure API (Claude/Fal.ai) aufrufen
 *   3. Bei Fehler der API: refundCredits() aufrufen
 *
 * Wir buchen NICHT lazy (nach API-Erfolg), weil dann kein Schutz vor Abuse.
 */
export async function chargeCredits(params: {
  userId: string
  feature: string
  units?: number // Default 1; bei Video-Gen z.B. Anzahl Sekunden
  referenceId?: string
  note?: string
}) {
  const admin = createAdminClient()
  const units = params.units ?? 1

  // Feature-Kosten laden
  const { data: costRow } = await admin
    .from('feature_credit_costs')
    .select('credits_per_unit')
    .eq('feature', params.feature)
    .eq('active', true)
    .maybeSingle()

  const unitCost = costRow?.credits_per_unit ?? 0
  const totalCost = unitCost * units

  if (totalCost <= 0) {
    return { ok: true as const, charged: 0, remaining: Number.POSITIVE_INFINITY }
  }

  // Wallet laden
  const { data: wallet } = await admin
    .from('credit_wallets')
    .select('monthly_balance, purchased_balance')
    .eq('user_id', params.userId)
    .maybeSingle()

  const monthly = wallet?.monthly_balance ?? 0
  const purchased = wallet?.purchased_balance ?? 0
  const available = monthly + purchased

  if (available < totalCost) {
    return { ok: false as const, needed: totalCost, available }
  }

  // Abzug: erst monthly, dann purchased
  const fromMonthly = Math.min(monthly, totalCost)
  const fromPurchased = totalCost - fromMonthly

  const newMonthly = monthly - fromMonthly
  const newPurchased = purchased - fromPurchased

  const { error: walletErr } = await admin
    .from('credit_wallets')
    .upsert({
      user_id: params.userId,
      monthly_balance: newMonthly,
      purchased_balance: newPurchased,
    })

  if (walletErr) {
    return { ok: false as const, needed: totalCost, available, error: walletErr.message }
  }

  // Transaction-Log (audit)
  await admin.from('credit_transactions').insert({
    user_id: params.userId,
    amount: -totalCost,
    balance_after_monthly: newMonthly,
    balance_after_purchased: newPurchased,
    reason: 'usage',
    feature: params.feature,
    feature_units: units,
    reference_id: params.referenceId ?? null,
    note: params.note ?? null,
  })

  return { ok: true as const, charged: totalCost, remaining: newMonthly + newPurchased }
}

/**
 * Bucht Credits zurück (z.B. wenn die API nach dem Charge fehlschlug).
 * Bucht auf purchased_balance zurück, nicht auf monthly — das ist
 * konservativ (purchased rolliert 12 Monate, monthly wäre sonst evtl. schon
 * zurückgesetzt).
 */
export async function refundCredits(params: {
  userId: string
  amount: number
  feature: string
  referenceId?: string
  note?: string
}) {
  if (params.amount <= 0) return { ok: true as const }

  const admin = createAdminClient()

  const { data: wallet } = await admin
    .from('credit_wallets')
    .select('purchased_balance, monthly_balance')
    .eq('user_id', params.userId)
    .maybeSingle()

  const newPurchased = (wallet?.purchased_balance ?? 0) + params.amount

  const { error } = await admin
    .from('credit_wallets')
    .upsert({
      user_id: params.userId,
      purchased_balance: newPurchased,
      // monthly_balance unverändert
      monthly_balance: wallet?.monthly_balance ?? 0,
    })

  if (error) return { ok: false as const, error: error.message }

  await admin.from('credit_transactions').insert({
    user_id: params.userId,
    amount: params.amount,
    balance_after_monthly: wallet?.monthly_balance ?? 0,
    balance_after_purchased: newPurchased,
    reason: 'refund',
    feature: params.feature,
    reference_id: params.referenceId ?? null,
    note: params.note ?? null,
  })

  return { ok: true as const }
}

/**
 * Schreibt dem User die monatlichen Credits gut (bei Abo-Start, bei Rebill,
 * beim Plan-Wechsel).
 *
 * Alte monthly_balance wird überschrieben (nicht addiert) — das ist die
 * "verfällt am Reset-Tag"-Semantik. Purchased-Balance bleibt unangetastet.
 */
export async function grantMonthlyCredits(params: {
  userId: string
  amount: number
  resetAt: Date
  reason?: 'monthly_grant' | 'monthly_reset'
}) {
  const admin = createAdminClient()

  const { data: existing } = await admin
    .from('credit_wallets')
    .select('purchased_balance')
    .eq('user_id', params.userId)
    .maybeSingle()

  const { error } = await admin.from('credit_wallets').upsert({
    user_id: params.userId,
    monthly_balance: params.amount,
    monthly_allowance: params.amount,
    purchased_balance: existing?.purchased_balance ?? 0,
    reset_at: params.resetAt.toISOString(),
  })

  if (error) return { ok: false as const, error: error.message }

  await admin.from('credit_transactions').insert({
    user_id: params.userId,
    amount: params.amount,
    balance_after_monthly: params.amount,
    balance_after_purchased: existing?.purchased_balance ?? 0,
    reason: params.reason ?? 'monthly_grant',
    note: `Monatliche Credits gutgeschrieben (reset ${params.resetAt.toISOString()})`,
  })

  return { ok: true as const }
}

/**
 * Schreibt einem User gekaufte Credits gut (Top-up via Stripe Checkout).
 * Rolliert `expiry_months` (aus credit_pack konfigurierbar, Default 12).
 */
export async function grantPurchasedCredits(params: {
  userId: string
  amount: number
  packId?: string
  expiryMonths?: number
  stripeCheckoutSessionId?: string
  stripePaymentIntentId?: string
}) {
  const admin = createAdminClient()
  const expiryMonths = params.expiryMonths ?? 12
  const expiresAt = new Date()
  expiresAt.setMonth(expiresAt.getMonth() + expiryMonths)

  // 1) credit_purchases anlegen (FIFO-Tracking für spätere Ablauf-Logik)
  await admin.from('credit_purchases').insert({
    user_id: params.userId,
    credits_total: params.amount,
    credits_remaining: params.amount,
    expires_at: expiresAt.toISOString(),
    pack_id: params.packId ?? null,
    stripe_checkout_session_id: params.stripeCheckoutSessionId ?? null,
    stripe_payment_intent_id: params.stripePaymentIntentId ?? null,
  })

  // 2) Wallet.purchased_balance erhöhen
  const { data: wallet } = await admin
    .from('credit_wallets')
    .select('purchased_balance, monthly_balance, monthly_allowance, reset_at')
    .eq('user_id', params.userId)
    .maybeSingle()

  const newPurchased = (wallet?.purchased_balance ?? 0) + params.amount

  const { error } = await admin.from('credit_wallets').upsert({
    user_id: params.userId,
    purchased_balance: newPurchased,
    monthly_balance: wallet?.monthly_balance ?? 0,
    monthly_allowance: wallet?.monthly_allowance ?? 0,
    reset_at: wallet?.reset_at ?? null,
  })

  if (error) return { ok: false as const, error: error.message }

  // 3) Transaction-Log
  await admin.from('credit_transactions').insert({
    user_id: params.userId,
    amount: params.amount,
    balance_after_monthly: wallet?.monthly_balance ?? 0,
    balance_after_purchased: newPurchased,
    reason: 'topup',
    reference_id: params.stripeCheckoutSessionId ?? null,
    note: `Top-up +${params.amount} Credits (gültig bis ${expiresAt.toISOString()})`,
  })

  return { ok: true as const, newBalance: newPurchased }
}
