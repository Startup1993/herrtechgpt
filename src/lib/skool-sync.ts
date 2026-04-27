/**
 * Skool ↔ Herr Tech World Sync — Shared Logic
 *
 * Wird genutzt von:
 *   - /api/webhooks/stripe    → Kauf-Ereignisse verarbeiten
 *   - /api/cron/skool-expiry  → Ablauf-Check
 *   - /api/admin/community/*  → Einladungen, manuelle Aktionen
 *   - /invite/skool/[token]   → Claim-Flow
 *
 * Konzept siehe docs/SKOOL_SYNC.md
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { randomBytes } from 'node:crypto'
import type Stripe from 'stripe'
import { getStripe } from './stripe'

// Feature-Flag für sicheren Rollout. Default aus, damit Live-Stripe nichts
// ungewolltes triggert, bis Jacob scharf schaltet.
export function isSkoolSyncEnabled(): boolean {
  return process.env.SKOOL_SYNC_ENABLED === 'true'
}

// Default 30 Tage Magic-Link-Gültigkeit (aus Plan)
const INVITE_TOKEN_DAYS = 30

export interface SkoolProduct {
  stripe_product_id: string
  label: string
  access_days: number
  active: boolean
}

/**
 * Lädt alle aktiven Skool-Products aus DB. Cachen lohnt sich im Cron / Webhook
 * nicht (pro Request 1× abfragen ist ok).
 */
export async function loadSkoolProducts(
  admin: SupabaseClient
): Promise<SkoolProduct[]> {
  const { data, error } = await admin
    .from('skool_stripe_products')
    .select('stripe_product_id, label, access_days, active')
    .eq('active', true)

  if (error) throw new Error(`loadSkoolProducts: ${error.message}`)
  return (data ?? []) as SkoolProduct[]
}

/**
 * Prüft ob eine Product-ID in der aktiven Whitelist steht.
 */
export async function isSkoolProductId(
  admin: SupabaseClient,
  productId: string
): Promise<SkoolProduct | null> {
  const { data } = await admin
    .from('skool_stripe_products')
    .select('stripe_product_id, label, access_days, active')
    .eq('stripe_product_id', productId)
    .eq('active', true)
    .maybeSingle()

  return (data as SkoolProduct | null) ?? null
}

/**
 * Holt die Product-IDs eines Checkout-Session (über Line-Items).
 * Stripe liefert Line-Items nicht mit dem Webhook-Payload — müssen nachgeladen
 * werden.
 */
export async function getCheckoutProductIds(
  sessionId: string
): Promise<string[]> {
  const stripe = getStripe()
  const items = await stripe.checkout.sessions.listLineItems(sessionId, {
    limit: 20,
    expand: ['data.price.product'],
  })

  const ids: string[] = []
  for (const item of items.data) {
    const product = item.price?.product
    if (!product) continue
    if (typeof product === 'string') {
      ids.push(product)
    } else if (!product.deleted) {
      ids.push(product.id)
    }
  }
  return ids
}

/**
 * Upsert eines Skool-Kaufs in community_members.
 *
 * - Neuer Customer → Insert mit skool_status='active', expires=now+access_days
 * - Bestehender Customer (Renewal) → expires = max(current, now) + access_days
 *   purchase_count++, letzter Kauf aktualisiert
 * - Wenn profile_id verknüpft → Plan S automatisch reaktivieren (via ensureSkoolPlanS)
 */
export async function recordSkoolPurchase(
  admin: SupabaseClient,
  params: {
    stripeCustomerId: string
    email: string
    name?: string | null
    productId: string
    priceId?: string | null
    paymentIntentId?: string | null
    accessDays: number
    purchasedAt: Date
  }
): Promise<{ communityMemberId: string; wasRenewal: boolean }> {
  const {
    stripeCustomerId,
    email,
    name,
    productId,
    priceId,
    paymentIntentId,
    accessDays,
    purchasedAt,
  } = params

  // Existierenden Member suchen
  const { data: existing } = await admin
    .from('community_members')
    .select('id, skool_access_expires_at, purchase_count, profile_id')
    .eq('stripe_customer_id', stripeCustomerId)
    .maybeSingle()

  const baseDate =
    existing?.skool_access_expires_at &&
    new Date(existing.skool_access_expires_at) > purchasedAt
      ? new Date(existing.skool_access_expires_at)
      : purchasedAt

  const newExpiry = new Date(baseDate.getTime() + accessDays * 24 * 60 * 60 * 1000)

  const payload = {
    stripe_customer_id: stripeCustomerId,
    email: email.toLowerCase(),
    name: name ?? null,
    skool_status: 'active' as const,
    skool_access_started_at: existing?.skool_access_expires_at
      ? undefined // nicht überschreiben bei Renewal
      : purchasedAt.toISOString(),
    skool_access_expires_at: newExpiry.toISOString(),
    last_purchase_at: purchasedAt.toISOString(),
    last_stripe_product_id: productId,
    last_stripe_price_id: priceId ?? null,
    last_stripe_payment_intent: paymentIntentId ?? null,
    purchase_count: (existing?.purchase_count ?? 0) + 1,
  }

  if (existing) {
    const { error } = await admin
      .from('community_members')
      .update(payload)
      .eq('id', existing.id)
    if (error) throw new Error(`recordSkoolPurchase update: ${error.message}`)

    // Wenn bereits claimed → Plan S reaktivieren/verlängern
    if (existing.profile_id) {
      await ensureSkoolPlanS(admin, {
        profileId: existing.profile_id,
        periodEnd: newExpiry,
      })
    }

    return { communityMemberId: existing.id, wasRenewal: true }
  }

  const { data: created, error } = await admin
    .from('community_members')
    .insert({
      ...payload,
      skool_access_started_at: purchasedAt.toISOString(),
    })
    .select('id')
    .single()
  if (error || !created) {
    throw new Error(`recordSkoolPurchase insert: ${error?.message ?? 'unknown'}`)
  }
  return { communityMemberId: created.id, wasRenewal: false }
}

/**
 * Aktiviert Plan S (oder hält ihn frisch) für einen geclaimten User.
 * - Wenn User bereits eigenes paid-Abo hat → nichts tun (user zahlt selbst)
 * - Wenn admin_granted-Abo existiert → nichts tun (Admin hat das bewusst gesetzt)
 * - Wenn skool_community-Abo existiert → current_period_end hochsetzen
 * - Sonst neue Subscription anlegen mit plan_source='skool_community'
 *
 * ACHTUNG: Wir legen keinen Stripe-Subscription an. Plan S via Skool ist gratis,
 * hat also kein Stripe-Abo. Das ist by design.
 */
export async function ensureSkoolPlanS(
  admin: SupabaseClient,
  params: { profileId: string; periodEnd: Date }
): Promise<void> {
  const { profileId, periodEnd } = params

  // Schon aktive Sub?
  const { data: active } = await admin
    .from('subscriptions')
    .select('id, plan_id, plan_source, current_period_end, status')
    .eq('user_id', profileId)
    .in('status', ['active', 'trialing', 'past_due'])
    .maybeSingle()

  if (active) {
    if (active.plan_source === 'paid' || active.plan_source === 'admin_granted') {
      // User zahlt selbst oder Admin hat bewusst gesetzt — nicht überschreiben
      return
    }
    if (active.plan_source === 'skool_community') {
      // Verlängern, falls neuer Endpunkt später ist
      if (
        !active.current_period_end ||
        new Date(active.current_period_end) < periodEnd
      ) {
        await admin
          .from('subscriptions')
          .update({
            current_period_end: periodEnd.toISOString(),
            status: 'active',
          })
          .eq('id', active.id)
      }
      return
    }
  }

  // Neue Plan-S-Subscription anlegen
  await admin.from('subscriptions').insert({
    user_id: profileId,
    plan_id: 'plan_s',
    status: 'active',
    price_band: 'community',
    billing_cycle: 'yearly',
    plan_source: 'skool_community',
    current_period_start: new Date().toISOString(),
    current_period_end: periodEnd.toISOString(),
  })

  // access_tier auf premium setzen (falls noch nicht)
  await admin
    .from('profiles')
    .update({ access_tier: 'premium' })
    .eq('id', profileId)
    .neq('access_tier', 'premium')
}

/**
 * Beendet Skool-Zugang (Alumni-Werden).
 * - community_members.skool_status = 'alumni'
 * - Wenn profile_id vorhanden und Plan S aus Skool → beenden
 * - access_tier von 'premium' auf 'alumni' zurücksetzen (nur wenn keine
 *   andere aktive Sub vorhanden)
 */
export async function expireSkoolMembership(
  admin: SupabaseClient,
  communityMemberId: string
): Promise<void> {
  const { data: member } = await admin
    .from('community_members')
    .select('id, profile_id, skool_status')
    .eq('id', communityMemberId)
    .maybeSingle()

  if (!member) return
  if (member.skool_status !== 'active') return // schon alumni/cancelled

  await admin
    .from('community_members')
    .update({ skool_status: 'alumni' })
    .eq('id', member.id)

  if (!member.profile_id) return

  // Skool-Community-Sub beenden
  const { data: skoolSub } = await admin
    .from('subscriptions')
    .select('id')
    .eq('user_id', member.profile_id)
    .eq('plan_source', 'skool_community')
    .in('status', ['active', 'trialing', 'past_due'])
    .maybeSingle()

  if (skoolSub) {
    await admin
      .from('subscriptions')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString(),
      })
      .eq('id', skoolSub.id)
  }

  // access_tier nur zurücksetzen, wenn keine andere aktive Sub da ist
  const { data: otherActive } = await admin
    .from('subscriptions')
    .select('id')
    .eq('user_id', member.profile_id)
    .in('status', ['active', 'trialing', 'past_due'])
    .limit(1)
    .maybeSingle()

  if (!otherActive) {
    await admin
      .from('profiles')
      .update({ access_tier: 'alumni' })
      .eq('id', member.profile_id)
      .eq('access_tier', 'premium')
  }
}

/**
 * Erzeugt einen neuen Einladungs-Token (32 bytes url-safe base64)
 * und speichert ihn mit 30-Tage-Ablauf.
 */
export async function generateInvitationToken(
  admin: SupabaseClient,
  communityMemberId: string
): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + INVITE_TOKEN_DAYS * 24 * 60 * 60 * 1000)

  const { error } = await admin
    .from('community_members')
    .update({
      invitation_token: token,
      invitation_token_expires: expiresAt.toISOString(),
    })
    .eq('id', communityMemberId)
  if (error) throw new Error(`generateInvitationToken: ${error.message}`)

  return { token, expiresAt }
}

/**
 * Markiert eine Einladung als versendet (Zähler + Zeitstempel).
 */
export async function markInvitationSent(
  admin: SupabaseClient,
  communityMemberId: string
): Promise<void> {
  // Erst aktuellen Zähler lesen (kein atomic increment in supabase-js v2 ohne RPC)
  const { data: current } = await admin
    .from('community_members')
    .select('invitation_sent_count, invited_at')
    .eq('id', communityMemberId)
    .single()

  const now = new Date().toISOString()
  await admin
    .from('community_members')
    .update({
      invitation_sent_count: (current?.invitation_sent_count ?? 0) + 1,
      last_invited_at: now,
      invited_at: current?.invited_at ?? now,
    })
    .eq('id', communityMemberId)
}

/**
 * Holt einen Community-Member per Token (für Claim-Flow).
 * Prüft Ablauf, gibt null zurück wenn invalide.
 */
export async function getCommunityMemberByToken(
  admin: SupabaseClient,
  token: string
): Promise<{
  id: string
  email: string
  name: string | null
  skool_access_expires_at: string | null
  profile_id: string | null
  claimed_at: string | null
} | null> {
  const { data } = await admin
    .from('community_members')
    .select(
      'id, email, name, skool_access_expires_at, profile_id, claimed_at, invitation_token_expires'
    )
    .eq('invitation_token', token)
    .maybeSingle()

  if (!data) return null
  if (!data.invitation_token_expires) return null
  if (new Date(data.invitation_token_expires) < new Date()) return null

  return data
}

/**
 * Claim-Flow: verknüpft community_member mit frisch angelegtem / bestehendem profile.
 * Aktiviert Plan S + setzt access_tier.
 */
export async function claimCommunityMember(
  admin: SupabaseClient,
  params: { communityMemberId: string; profileId: string }
): Promise<void> {
  const { communityMemberId, profileId } = params

  const { data: member } = await admin
    .from('community_members')
    .select('id, skool_access_expires_at, skool_status')
    .eq('id', communityMemberId)
    .single()
  if (!member) throw new Error('Community-Member nicht gefunden')

  await admin
    .from('community_members')
    .update({
      profile_id: profileId,
      claimed_at: new Date().toISOString(),
      invitation_token: null,
      invitation_token_expires: null,
    })
    .eq('id', communityMemberId)

  // Nur Plan S aktivieren, wenn Skool-Mitgliedschaft noch aktiv
  if (
    member.skool_status === 'active' &&
    member.skool_access_expires_at &&
    new Date(member.skool_access_expires_at) > new Date()
  ) {
    await ensureSkoolPlanS(admin, {
      profileId,
      periodEnd: new Date(member.skool_access_expires_at),
    })
  }
}

/**
 * Voll-Sync: durchsucht Stripe nach Skool-Käufen über drei Quellen
 * (Checkout-Sessions, Subscriptions, Paid Invoices), aggregiert pro
 * Customer und upsertet community_members. Anschließend expireSkoolMembership
 * für alle abgelaufenen.
 *
 * Pagination-Limits sind großzügig (~50 Pages = 5000 Items pro Quelle).
 * Sessions-Phase ist teurer (1 Extra-Call pro Session für line items),
 * daher dort niedriger gecappt.
 *
 * Wird von Admin-UI „Sync"-Button und vom Initial-Import-Script aufgerufen.
 */
export async function syncSkoolMembersFromStripe(
  admin: SupabaseClient,
  opts: { days?: number; includeInactive?: boolean } = {}
): Promise<{
  scanned: number
  matched: number
  upserted: number
  expired: number
  by_phase: {
    sessions: { scanned: number; matched: number; capped: boolean }
    subscriptions: { scanned: number; matched: number; capped: boolean }
    invoices: { scanned: number; matched: number; capped: boolean }
  }
  errors: Array<{ session?: string; member?: string; error: string }>
}> {
  const days = opts.days ?? 90
  const since = Math.floor(Date.now() / 1000) - days * 86400
  const stripe = getStripe()

  // Pagination-Caps pro Phase. Sessions teurer (extra line-items-Call).
  const SESSIONS_MAX_PAGES = 15 // 1.500 Sessions max (≈ 1500 line-items API-Calls)
  const SUBS_MAX_PAGES = 50 // 5.000 Subscriptions max
  const INVOICES_MAX_PAGES = 50 // 5.000 Invoices max

  // Whitelist laden — beim manuellen Sync auch deaktivierte berücksichtigen,
  // damit Bestand nicht verloren geht
  const { data: products } = await admin
    .from('skool_stripe_products')
    .select('stripe_product_id, label, access_days, active')
  const productMap = new Map<string, SkoolProduct>(
    (products ?? [])
      .filter((p) => opts.includeInactive ?? true ? true : p.active)
      .map((p) => [p.stripe_product_id, p as SkoolProduct])
  )

  if (productMap.size === 0) {
    return {
      scanned: 0,
      matched: 0,
      upserted: 0,
      expired: 0,
      by_phase: {
        sessions: { scanned: 0, matched: 0, capped: false },
        subscriptions: { scanned: 0, matched: 0, capped: false },
        invoices: { scanned: 0, matched: 0, capped: false },
      },
      errors: [{ error: 'Keine Skool-Products in der Whitelist' }],
    }
  }

  const errors: Array<{ session?: string; member?: string; error: string }> = []
  let upserted = 0

  // Pro-Phase Tracking
  let sessionsScanned = 0
  let sessionsMatched = 0
  let sessionsCapped = false
  let subsScanned = 0
  let subsMatched = 0
  let subsCapped = false
  let invScanned = 0
  let invMatched = 0
  let invCapped = false

  // Per Customer aggregieren — pro Customer nur einmal upserten (jüngster Kauf gewinnt)
  type Hit = {
    sessionId: string
    paymentIntentId: string | null
    email: string
    name: string | null
    customerId: string
    productId: string
    priceId: string | null
    accessDays: number
    purchasedAt: Date
  }
  const perCustomer = new Map<string, Hit[]>()

  // ─── Phase 1: Checkout-Sessions ──────────────────────────────────────────
  let sessionAfter: string | undefined = undefined
  let sessionPages = 0
  while (sessionPages < SESSIONS_MAX_PAGES) {
    const sessionList = await stripe.checkout.sessions.list({
      limit: 100,
      starting_after: sessionAfter,
      created: { gte: since },
    })
    sessionPages += 1
    for (const s of sessionList.data) {
      sessionsScanned += 1
      if (s.status !== 'complete') continue
      if (s.mode !== 'payment') continue

      try {
        const items = await stripe.checkout.sessions.listLineItems(s.id, {
          limit: 10,
          expand: ['data.price.product'],
        })
        let hit: SkoolProduct | null = null
        let priceId: string | null = null
        for (const item of items.data) {
          const product = item.price?.product
          const pid =
            typeof product === 'string'
              ? product
              : product && !product.deleted
              ? product.id
              : null
          if (pid && productMap.has(pid)) {
            hit = productMap.get(pid)!
            priceId = item.price?.id ?? null
            break
          }
        }
        if (!hit) continue

        const customerId =
          typeof s.customer === 'string' ? s.customer : s.customer?.id ?? null
        const email = s.customer_details?.email ?? s.customer_email ?? null
        if (!customerId || !email) continue

        const paymentIntentId =
          typeof s.payment_intent === 'string'
            ? s.payment_intent
            : s.payment_intent?.id ?? null

        sessionsMatched += 1
        const arr = perCustomer.get(customerId) ?? []
        arr.push({
          sessionId: s.id,
          paymentIntentId,
          email,
          name: s.customer_details?.name ?? null,
          customerId,
          productId: hit.stripe_product_id,
          priceId,
          accessDays: hit.access_days,
          purchasedAt: new Date((s.created ?? Date.now() / 1000) * 1000),
        })
        perCustomer.set(customerId, arr)
      } catch (err) {
        errors.push({
          session: s.id,
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }
    if (!sessionList.has_more) break
    sessionAfter = sessionList.data[sessionList.data.length - 1].id
    if (sessionPages >= SESSIONS_MAX_PAGES) {
      sessionsCapped = sessionList.has_more
      break
    }
  }

  // ─── Phase 2: Subscriptions (für monatliche KMC oder Subs aus Ablefy/Co.) ──
  // Subscriptions liefern Customer-IDs + Items mit Product-Referenz direkt.
  // Status='all' fängt aktive, past_due, canceled (= alumni) gleichermaßen.
  let subStartingAfter: string | undefined = undefined
  let subPages = 0
  while (subPages < SUBS_MAX_PAGES) {
    const subList = await stripe.subscriptions.list({
      limit: 100,
      starting_after: subStartingAfter,
      status: 'all',
      expand: ['data.customer'],
    })
    subPages += 1
    for (const sub of subList.data) {
      subsScanned += 1
      try {
        let hit: SkoolProduct | null = null
        let priceId: string | null = null
        for (const item of sub.items.data) {
          const productRef = item.price?.product
          const pid =
            typeof productRef === 'string'
              ? productRef
              : productRef && 'id' in productRef && !('deleted' in productRef && productRef.deleted)
              ? productRef.id
              : null
          if (pid && productMap.has(pid)) {
            hit = productMap.get(pid)!
            priceId = item.price?.id ?? null
            break
          }
        }
        if (!hit) continue

        const cust = sub.customer
        const customerId = typeof cust === 'string' ? cust : cust?.id ?? null
        if (!customerId) continue

        // Email/Name aus expanded customer ziehen
        let email: string | null = null
        let name: string | null = null
        if (cust && typeof cust !== 'string' && !('deleted' in cust && cust.deleted)) {
          email = cust.email ?? null
          name = cust.name ?? null
        }
        if (!email) {
          // Customer war nicht expanded oder hat keine Email → manuell laden
          try {
            const full = await stripe.customers.retrieve(customerId)
            if (!('deleted' in full) || !full.deleted) {
              email = (full as Stripe.Customer).email ?? null
              name = (full as Stripe.Customer).name ?? null
            }
          } catch {
            // ignore, skip below
          }
        }
        if (!email) continue

        // purchasedAt = subscription.start_date (= erster Charge), als „Kaufdatum"
        const purchasedAt = new Date((sub.start_date ?? sub.created) * 1000)
        subsMatched += 1
        const arr = perCustomer.get(customerId) ?? []
        arr.push({
          sessionId: sub.id,
          paymentIntentId: null,
          email,
          name,
          customerId,
          productId: hit.stripe_product_id,
          priceId,
          accessDays: hit.access_days,
          purchasedAt,
        })
        perCustomer.set(customerId, arr)
      } catch (err) {
        errors.push({
          session: sub.id,
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }
    if (!subList.has_more) break
    subStartingAfter = subList.data[subList.data.length - 1].id
    if (subPages >= SUBS_MAX_PAGES) {
      subsCapped = subList.has_more
      break
    }
  }

  // ─── Phase 3: Paid Invoices (Ablefy / Hosted Invoices / direkt gerechnet) ──
  // Invoices haben Lines mit Price → Product. Fängt alles, wo Stripe eine
  // Rechnung erzeugt hat, unabhängig vom Verkaufsweg.
  let invStartingAfter: string | undefined = undefined
  let invPages = 0
  while (invPages < INVOICES_MAX_PAGES) {
    const invList = await stripe.invoices.list({
      limit: 100,
      starting_after: invStartingAfter,
      status: 'paid',
      created: { gte: since },
    })
    invPages += 1
    for (const inv of invList.data) {
      invScanned += 1
      try {
        let hit: SkoolProduct | null = null
        let priceId: string | null = null
        const lines = inv.lines?.data ?? []
        for (const ln of lines) {
          // Stripe API hat über die Versionen das Format gewechselt.
          // Wir lesen 4 mögliche Quellen für Product-ID + Price-ID:
          //   1. ln.pricing.price_details.{product, price}        (API 2025+/dahlia)
          //   2. ln.price.product / ln.price.id                   (älteres API)
          //   3. ln.parent.subscription_item_details              (für Subscription-Renewals)
          //   4. ln.parent.invoice_item_details                   (für one-off Invoice-Items)
          const lnRaw = ln as unknown as {
            pricing?: {
              price_details?: { product?: string | null; price?: string | null } | null
            } | null
            price?: {
              id?: string | null
              product?: string | { id: string; deleted?: boolean } | null
            } | null
            parent?: {
              subscription_item_details?: { price?: string | null } | null
              invoice_item_details?: { price?: string | null; product?: string | null } | null
            } | null
          }

          let pid: string | null = null
          let pri: string | null = null

          // 1) pricing.price_details
          const pd = lnRaw.pricing?.price_details
          if (pd?.product) {
            pid = pd.product
            pri = pd.price ?? null
          }

          // 2) price.product (älter)
          if (!pid && lnRaw.price) {
            const productRef = lnRaw.price.product
            pid =
              typeof productRef === 'string'
                ? productRef
                : productRef && 'id' in productRef && !productRef.deleted
                ? productRef.id
                : null
            pri = lnRaw.price.id ?? null
          }

          // 3) Fallback: invoice_item_details (oneoff-Rechnungen)
          if (!pid) {
            const iid = lnRaw.parent?.invoice_item_details
            if (iid?.product) {
              pid = iid.product
              pri = iid.price ?? null
            }
          }

          if (pid && productMap.has(pid)) {
            hit = productMap.get(pid)!
            priceId = pri
            break
          }
        }
        if (!hit) continue

        const customerId =
          typeof inv.customer === 'string'
            ? inv.customer
            : inv.customer?.id ?? null
        const email = inv.customer_email ?? null
        if (!customerId || !email) continue

        // Stripe API 2026-03: invoice.payment_intent ist aus dem Type entfernt,
        // im Payload aber noch da. Defensiv lesen.
        const piRaw = (inv as unknown as { payment_intent?: string | { id: string } | null })
          .payment_intent
        const paymentIntentId =
          typeof piRaw === 'string' ? piRaw : piRaw && 'id' in piRaw ? piRaw.id : null
        const paidAtUnix =
          (inv.status_transitions && inv.status_transitions.paid_at) ||
          inv.created ||
          Math.floor(Date.now() / 1000)
        const purchasedAt = new Date(paidAtUnix * 1000)

        invMatched += 1
        const arr = perCustomer.get(customerId) ?? []
        arr.push({
          sessionId: inv.id ?? `inv_${Date.now()}`,
          paymentIntentId,
          email,
          name: inv.customer_name ?? null,
          customerId,
          productId: hit.stripe_product_id,
          priceId,
          accessDays: hit.access_days,
          purchasedAt,
        })
        perCustomer.set(customerId, arr)
      } catch (err) {
        errors.push({
          session: inv.id ?? 'unknown_invoice',
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }
    if (!invList.has_more) break
    invStartingAfter = invList.data[invList.data.length - 1].id ?? undefined
    if (invPages >= INVOICES_MAX_PAGES) {
      invCapped = invList.has_more
      break
    }
  }

  // Pro Customer: jüngsten Kauf nehmen, expires basierend darauf, purchase_count = Anzahl
  for (const [customerId, hits] of perCustomer) {
    hits.sort((a, b) => b.purchasedAt.getTime() - a.purchasedAt.getTime())
    const latest = hits[0]
    const oldest = hits[hits.length - 1]
    const expires = new Date(
      latest.purchasedAt.getTime() + latest.accessDays * 86400 * 1000
    )
    const status: 'active' | 'alumni' = expires > new Date() ? 'active' : 'alumni'

    try {
      // Upsert
      const { data: existing } = await admin
        .from('community_members')
        .select('id, profile_id')
        .eq('stripe_customer_id', customerId)
        .maybeSingle()

      const payload = {
        stripe_customer_id: customerId,
        email: latest.email.toLowerCase(),
        name: latest.name,
        skool_status: status,
        skool_access_started_at: oldest.purchasedAt.toISOString(),
        skool_access_expires_at: expires.toISOString(),
        last_purchase_at: latest.purchasedAt.toISOString(),
        last_stripe_product_id: latest.productId,
        last_stripe_price_id: latest.priceId,
        last_stripe_payment_intent: latest.paymentIntentId,
        purchase_count: hits.length,
      }

      if (existing) {
        await admin.from('community_members').update(payload).eq('id', existing.id)
        // Plan S frisch halten wenn claimed + noch aktiv
        if (existing.profile_id && status === 'active') {
          await ensureSkoolPlanS(admin, {
            profileId: existing.profile_id,
            periodEnd: expires,
          })
        }
      } else {
        await admin.from('community_members').insert(payload)
      }
      upserted += 1
    } catch (err) {
      errors.push({
        member: latest.email,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  // Cleanup: alle abgelaufenen aktiven auf alumni setzen
  const nowIso = new Date().toISOString()
  const { data: toExpire } = await admin
    .from('community_members')
    .select('id')
    .eq('skool_status', 'active')
    .lt('skool_access_expires_at', nowIso)

  let expiredCount = 0
  for (const m of toExpire ?? []) {
    try {
      await expireSkoolMembership(admin, m.id)
      expiredCount += 1
    } catch (err) {
      errors.push({
        member: m.id,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  return {
    scanned: sessionsScanned + subsScanned + invScanned,
    matched: sessionsMatched + subsMatched + invMatched,
    upserted,
    expired: expiredCount,
    by_phase: {
      sessions: { scanned: sessionsScanned, matched: sessionsMatched, capped: sessionsCapped },
      subscriptions: { scanned: subsScanned, matched: subsMatched, capped: subsCapped },
      invoices: { scanned: invScanned, matched: invMatched, capped: invCapped },
    },
    errors,
  }
}

/**
 * Checkout-Session auswerten: prüft ob Skool-Produkt, wenn ja → recordSkoolPurchase.
 * Rückgabe: true = Skool-Kauf verarbeitet, false = nicht unser Fall.
 *
 * Wird vom Stripe-Webhook aufgerufen. Der Webhook delegiert an diese Funktion
 * VOR der bestehenden Top-up/Abo-Logik.
 */
export async function tryHandleSkoolCheckout(
  admin: SupabaseClient,
  session: Stripe.Checkout.Session
): Promise<boolean> {
  if (!isSkoolSyncEnabled()) return false
  if (session.mode !== 'payment') return false

  const productIds = await getCheckoutProductIds(session.id)
  if (productIds.length === 0) return false

  let matchedProduct: SkoolProduct | null = null
  for (const pid of productIds) {
    matchedProduct = await isSkoolProductId(admin, pid)
    if (matchedProduct) break
  }
  if (!matchedProduct) return false

  // Customer-Daten aus Session extrahieren
  const customerId =
    typeof session.customer === 'string'
      ? session.customer
      : session.customer?.id ?? null

  if (!customerId) {
    console.warn(
      `[skool-sync] Checkout ${session.id} hat keinen Customer — kann nicht zugeordnet werden`
    )
    return true // als verarbeitet markieren, sonst retry-Loop
  }

  const email =
    session.customer_details?.email ??
    session.customer_email ??
    null

  if (!email) {
    console.warn(`[skool-sync] Checkout ${session.id} hat keine E-Mail`)
    return true
  }

  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id ?? null

  // Idempotenz: bereits verarbeitete PaymentIntents überspringen
  if (paymentIntentId) {
    const { data: existingMember } = await admin
      .from('community_members')
      .select('id')
      .eq('last_stripe_payment_intent', paymentIntentId)
      .maybeSingle()
    if (existingMember) return true
  }

  const priceId = session.line_items?.data?.[0]?.price?.id ?? null

  await recordSkoolPurchase(admin, {
    stripeCustomerId: customerId,
    email,
    name: session.customer_details?.name ?? null,
    productId: matchedProduct.stripe_product_id,
    priceId,
    paymentIntentId,
    accessDays: matchedProduct.access_days,
    purchasedAt: new Date((session.created ?? Date.now() / 1000) * 1000),
  })

  return true
}
