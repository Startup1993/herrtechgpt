/**
 * POST /api/subscriptions/change
 *
 * Plan-Wechsel für bestehendes Abo.
 *
 * Body: { planId: 'plan_s'|'plan_m'|'plan_l', cycle?: 'monthly'|'yearly' }
 *
 * Upgrade (neuer Preis > aktueller Preis):
 *   → stripe.subscriptions.update mit proration_behavior='always_invoice' +
 *     billing_cycle_anchor='now'. Neue Zahlung sofort (abzgl. Rest-Gutschrift),
 *     neuer Cycle startet jetzt. Webhook customer.subscription.updated triggert
 *     Credits-Grant.
 *
 * Downgrade (neuer Preis ≤ aktueller Preis):
 *   → Stripe Subscription Schedule mit 2 Phasen: aktuelle läuft bis
 *     current_period_end, danach neue Phase. User behält aktuellen Plan bis
 *     zum Periodenende, Downgrade greift automatisch beim Rebill.
 *
 * Gleicher Plan + Cycle:
 *   → 400 (keine Aktion nötig). Wenn aktuell ein Downgrade geplant ist, wird
 *     es aufgehoben (Schedule released).
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { computeEffectiveAccess, VIEW_AS_COOKIE } from '@/lib/access'
import { priceBandForAccessTier } from '@/lib/monetization'
import { getStripe } from '@/lib/stripe'
import { getAppUrl } from '@/lib/urls'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Cycle = 'monthly' | 'yearly'

export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const planId = body.planId as string | undefined
  const cycle = ((body.cycle as Cycle) ?? 'monthly') as Cycle

  if (!planId || !['plan_s', 'plan_m', 'plan_l'].includes(planId)) {
    return NextResponse.json({ error: 'Invalid planId' }, { status: 400 })
  }
  if (!['monthly', 'yearly'].includes(cycle)) {
    return NextResponse.json({ error: 'Invalid cycle' }, { status: 400 })
  }

  const [{ data: profile }, cookieStore] = await Promise.all([
    supabase.from('profiles').select('role, access_tier').eq('id', user.id).single(),
    cookies(),
  ])
  const access = computeEffectiveAccess(profile, cookieStore.get(VIEW_AS_COOKIE)?.value)
  const priceBand = priceBandForAccessTier(access.tier)

  const { data: sub } = await supabase
    .from('subscriptions')
    .select(
      'id, plan_id, billing_cycle, stripe_subscription_id, stripe_price_id, stripe_schedule_id, current_period_end, status, cancel_at_period_end, scheduled_plan_id'
    )
    .eq('user_id', user.id)
    .in('status', ['active', 'trialing', 'past_due'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!sub) {
    return NextResponse.json(
      { error: 'Kein aktives Abo. Nutze den normalen Checkout.' },
      { status: 404 }
    )
  }
  if (!sub.stripe_subscription_id) {
    return NextResponse.json(
      { error: 'Abo hat keine Stripe-Referenz — Support kontaktieren.' },
      { status: 500 }
    )
  }

  // Ziel-Plan laden
  const { data: plan } = await supabase
    .from('plans')
    .select('*')
    .eq('id', planId)
    .eq('active', true)
    .maybeSingle()
  if (!plan) {
    return NextResponse.json({ error: `Plan ${planId} nicht gefunden/aktiv` }, { status: 404 })
  }

  const priceField =
    cycle === 'yearly'
      ? priceBand === 'community'
        ? 'stripe_price_community_yearly'
        : 'stripe_price_basic_yearly'
      : priceBand === 'community'
        ? 'stripe_price_community_monthly'
        : 'stripe_price_basic_monthly'
  const newPriceId = plan[priceField] as string | null
  if (!newPriceId) {
    return NextResponse.json(
      {
        error: `Preis fehlt: Plan ${planId} hat keine Stripe-Price für ${priceBand} ${cycle}.`,
      },
      { status: 400 }
    )
  }

  const stripe = getStripe()

  // Gleicher Plan + Cycle?
  if (planId === sub.plan_id && cycle === sub.billing_cycle) {
    // Wenn ein Downgrade geplant ist → Schedule aufheben ("doch nicht wechseln")
    if (sub.stripe_schedule_id) {
      try {
        await stripe.subscriptionSchedules.release(sub.stripe_schedule_id)
      } catch (err) {
        console.error('[subscriptions/change] Release Schedule fehlgeschlagen:', err)
      }
      const admin = createAdminClient()
      await admin
        .from('subscriptions')
        .update({
          scheduled_plan_id: null,
          scheduled_price_id: null,
          scheduled_billing_cycle: null,
          scheduled_change_at: null,
          stripe_schedule_id: null,
        })
        .eq('id', sub.id)
      return NextResponse.json({ ok: true, action: 'scheduled_change_released' })
    }
    return NextResponse.json({ error: 'Plan ist bereits aktiv.' }, { status: 400 })
  }

  // Aktuellen Stripe-Preis holen (für Upgrade/Downgrade-Entscheidung)
  try {
    const currentSub = await stripe.subscriptions.retrieve(sub.stripe_subscription_id)
    const currentItem = currentSub.items.data[0]
    if (!currentItem) {
      return NextResponse.json({ error: 'Stripe-Abo ohne items' }, { status: 500 })
    }
    const currentUnitAmount = currentItem.price.unit_amount ?? 0
    const newPrice = await stripe.prices.retrieve(newPriceId)
    const newUnitAmount = newPrice.unit_amount ?? 0

    const isUpgrade = newUnitAmount > currentUnitAmount

    if (isUpgrade) {
      // UPGRADE: Stripe Customer Portal mit "subscription_update_confirm"-Flow.
      // User sieht: Proration-Vorschau, hinterlegte Zahlungsmethode (kann sie
      // ändern), exakter Betrag heute, "Confirm" / "Cancel". Bei Cancel oder
      // Zahlungsfehler bleibt der alte Plan aktiv — kein zerschossener State.
      // Nach Confirm fired Stripe customer.subscription.updated → unser Webhook
      // übernimmt DB-Update + Credits-Grant.

      // Falls zuvor ein Downgrade geplant war → Schedule freigeben, sonst
      // konfligiert das mit dem Portal-Update.
      if (currentSub.schedule) {
        try {
          await stripe.subscriptionSchedules.release(
            typeof currentSub.schedule === 'string'
              ? currentSub.schedule
              : currentSub.schedule.id
          )
        } catch (err) {
          console.error('[subscriptions/change] Release vor Upgrade:', err)
        }
        // DB-scheduled-Felder leeren (Webhook holt's auch nach, aber sofort sauberer)
        const admin = createAdminClient()
        await admin
          .from('subscriptions')
          .update({
            scheduled_plan_id: null,
            scheduled_price_id: null,
            scheduled_billing_cycle: null,
            scheduled_change_at: null,
            stripe_schedule_id: null,
          })
          .eq('id', sub.id)
      }

      // Customer-ID brauchen wir für die Portal-Session
      const customerId =
        typeof currentSub.customer === 'string' ? currentSub.customer : currentSub.customer.id
      const origin = getAppUrl(req)

      const portal = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${origin}/dashboard/account/billing?upgrade=done`,
        locale: 'de',
        flow_data: {
          type: 'subscription_update_confirm',
          subscription_update_confirm: {
            subscription: sub.stripe_subscription_id,
            items: [{ id: currentItem.id, price: newPriceId, quantity: 1 }],
          },
          after_completion: {
            type: 'redirect',
            redirect: { return_url: `${origin}/dashboard/account/billing?upgrade=done` },
          },
        },
      })

      return NextResponse.json({
        ok: true,
        action: 'upgrade_portal',
        url: portal.url,
      })
    }

    // DOWNGRADE: via Subscription Schedule zum Periodenende
    const periodEnd = extractPeriodEnd(currentSub)
    if (!periodEnd) {
      return NextResponse.json(
        { error: 'current_period_end konnte nicht ermittelt werden' },
        { status: 500 }
      )
    }

    // Bestehenden Schedule wiederverwenden oder neuen anlegen
    let scheduleId: string | null = null
    if (currentSub.schedule) {
      scheduleId =
        typeof currentSub.schedule === 'string' ? currentSub.schedule : currentSub.schedule.id
    } else {
      const created = await stripe.subscriptionSchedules.create({
        from_subscription: sub.stripe_subscription_id,
      })
      scheduleId = created.id
    }

    // Phase 1: aktueller Plan bis Periodenende. Phase 2: neuer Plan danach (unbefristet).
    const schedule = await stripe.subscriptionSchedules.update(scheduleId, {
      end_behavior: 'release',
      phases: [
        {
          items: [{ price: currentItem.price.id, quantity: 1 }],
          start_date: currentItem.current_period_start as number | undefined,
          end_date: periodEnd,
        },
        {
          items: [{ price: newPriceId, quantity: 1 }],
          proration_behavior: 'none',
          metadata: {
            user_id: user.id,
            plan_id: planId,
            price_band: priceBand,
            cycle,
          },
        },
      ],
      metadata: {
        user_id: user.id,
        downgrade_to_plan: planId,
        downgrade_to_cycle: cycle,
      },
    })

    const admin = createAdminClient()
    await admin
      .from('subscriptions')
      .update({
        scheduled_plan_id: planId,
        scheduled_price_id: newPriceId,
        scheduled_billing_cycle: cycle,
        scheduled_change_at: new Date(periodEnd * 1000).toISOString(),
        stripe_schedule_id: schedule.id,
      })
      .eq('id', sub.id)

    return NextResponse.json({
      ok: true,
      action: 'downgrade_scheduled',
      effectiveAt: new Date(periodEnd * 1000).toISOString(),
      stripeScheduleId: schedule.id,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const stripeCode = (err as { code?: string })?.code
    console.error('[subscriptions/change] Fehler:', {
      message: msg,
      code: stripeCode,
      planId,
      cycle,
      userId: user.id,
    })
    return NextResponse.json(
      { error: `Plan-Wechsel fehlgeschlagen: ${msg}${stripeCode ? ` (${stripeCode})` : ''}` },
      { status: 500 }
    )
  }
}

function extractPeriodEnd(sub: unknown): number | null {
  const s = sub as {
    current_period_end?: number
    items?: { data?: Array<{ current_period_end?: number }> }
  }
  return s.items?.data?.[0]?.current_period_end ?? s.current_period_end ?? null
}
