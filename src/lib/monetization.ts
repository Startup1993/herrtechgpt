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

// ─── Access-Tier-Change Hook ───────────────────────────────────────────

/**
 * Wird aufgerufen wenn ein Admin die access_tier eines Users ändert.
 *
 * Haupt-Fall: User verliert `premium` (Community-Mitgliedschaft) → Alumni
 * oder Basic. Wir kündigen dann das laufende Abo, falls es auf Community-
 * Preisen läuft, zum Ende der Abrechnungsperiode + verschicken eine E-Mail
 * mit Hinweis auf die neuen (Alumni/Basic-)Preise.
 *
 * Kein Sofort-Lock: User behält Zugang bis Periodenende, kann dann neu
 * abschließen zu den für ihn gültigen Preisen. Das ist fair + verringert
 * negative UX-Überraschungen.
 */
export async function handleAccessTierChange(params: {
  userId: string
  oldTier: AccessTier
  newTier: AccessTier
}): Promise<{ subscriptionCancelled: boolean; periodEnd?: string }> {
  // Nur relevant wenn User Community-Status verliert
  if (params.oldTier !== 'premium' || params.newTier === 'premium') {
    return { subscriptionCancelled: false }
  }

  const admin = createAdminClient()

  // Aktives Abo mit Community-Preisband finden
  const { data: sub } = await admin
    .from('subscriptions')
    .select('id, stripe_subscription_id, price_band, current_period_end, cancel_at_period_end')
    .eq('user_id', params.userId)
    .in('status', ['active', 'trialing', 'past_due'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Nur kündigen wenn Abo auf Community-Preis läuft (also jetzt nicht mehr fair)
  if (!sub || sub.price_band !== 'community' || sub.cancel_at_period_end) {
    return { subscriptionCancelled: false }
  }

  // Stripe: cancel_at_period_end = true (User behält Zugang bis Ende)
  if (sub.stripe_subscription_id) {
    const { getStripe } = await import('./stripe')
    const stripe = getStripe()
    try {
      await stripe.subscriptions.update(sub.stripe_subscription_id, {
        cancel_at_period_end: true,
      })
    } catch (err) {
      console.error('[access-tier-change] Stripe cancel failed:', err)
      // Trotzdem lokal markieren — Webhook wird finalen State korrigieren
    }
  }

  // Lokaler DB-Update: cancel_at_period_end + cancelled_at
  await admin
    .from('subscriptions')
    .update({
      cancel_at_period_end: true,
      cancelled_at: new Date().toISOString(),
    })
    .eq('id', sub.id)

  return {
    subscriptionCancelled: true,
    periodEnd: sub.current_period_end,
  }
}

// ─── Server-side Access Check ───────────────────────────────────────────

/**
 * Prüft serverseitig ob ein User Aktions-Zugriff hat (aktives Abo oder Admin).
 * Wird in API-Routes aufgerufen, bevor teure Claude/Stripe/Fal-Calls laufen,
 * damit niemand per curl die UI-Paywall umgeht.
 *
 * Gibt true/false zurück. Admin-Check per role='admin' in profiles.
 */
export async function hasActionAccess(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const [{ data: profile }, { data: sub }] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', userId).single(),
    supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .maybeSingle(),
  ])
  if (profile?.role === 'admin') return true
  return !!sub
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
 *
 * Gekaufte Credits rollieren **unbegrenzt** — der Wert bleibt erhalten bis
 * er aufgebraucht ist (besser für den User, einfacher im Code). Die
 * credit_purchases.expires_at-Spalte setzen wir trotzdem (auf 100 Jahre
 * in der Zukunft), damit das DB-Schema intakt bleibt und wir bei Bedarf
 * später wieder Ablauf einführen können.
 */
export async function grantPurchasedCredits(params: {
  userId: string
  amount: number
  packId?: string
  expiryMonths?: number // wird ignoriert — Credits rollieren unbegrenzt
  stripeCheckoutSessionId?: string
  stripePaymentIntentId?: string
}) {
  const admin = createAdminClient()
  // 100 Jahre in die Zukunft → effektiv unbegrenzt
  const expiresAt = new Date()
  expiresAt.setFullYear(expiresAt.getFullYear() + 100)

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
    note: `Top-up +${params.amount} Credits (rolliert unbegrenzt)`,
  })

  return { ok: true as const, newBalance: newPurchased }
}
