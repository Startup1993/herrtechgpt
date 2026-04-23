/**
 * POST /api/checkout/subscription
 *
 * Startet einen Stripe-Checkout für ein Abo (S/M/L, Basic oder Community,
 * monatlich oder jährlich). Erzeugt eine Stripe-Checkout-Session und gibt
 * die URL zurück — Client redirected dorthin.
 *
 * Body: { planId: 'plan_s'|'plan_m'|'plan_l', cycle?: 'monthly'|'yearly' }
 *
 * Das Preisband (basic/community) wird **server-seitig** aus der access_tier
 * des Users abgeleitet — NIE vom Client kommen lassen (sonst könnte ein
 * Basic-User den Community-Preis bezahlen).
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { computeEffectiveAccess, VIEW_AS_COOKIE } from '@/lib/access'
import {
  ensureStripeCustomer,
  priceBandForAccessTier,
} from '@/lib/monetization'
import { getStripe } from '@/lib/stripe'
import { getAppUrl } from '@/lib/urls'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await req.json()
  const planId = body.planId as string | undefined
  const cycle = (body.cycle as 'monthly' | 'yearly' | undefined) ?? 'monthly'

  if (!planId || !['plan_s', 'plan_m', 'plan_l'].includes(planId)) {
    return NextResponse.json({ error: 'Invalid planId' }, { status: 400 })
  }
  if (!['monthly', 'yearly'].includes(cycle)) {
    return NextResponse.json({ error: 'Invalid cycle' }, { status: 400 })
  }

  // Access + Preisband
  const [{ data: profile }, cookieStore] = await Promise.all([
    supabase
      .from('profiles')
      .select('role, access_tier, email, full_name')
      .eq('id', user.id)
      .single(),
    cookies(),
  ])
  const access = computeEffectiveAccess(profile, cookieStore.get(VIEW_AS_COOKIE)?.value)
  const priceBand = priceBandForAccessTier(access.tier)

  // Plan laden + richtige Stripe-Price-ID auswählen
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

  const priceId = plan[priceField] as string | null
  if (!priceId) {
    return NextResponse.json(
      {
        error: `Preis fehlt: Plan ${planId} hat keine Stripe-Price für ${priceBand} ${cycle}. Admin → Monetarisierung → Pläne.`,
      },
      { status: 400 }
    )
  }

  // User hat schon ein aktives Abo?
  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('id, plan_id')
    .eq('user_id', user.id)
    .in('status', ['active', 'trialing'])
    .maybeSingle()

  if (existingSub) {
    return NextResponse.json(
      {
        error: `Du hast bereits ein aktives Abo (${existingSub.plan_id}). Ändere es im Billing-Bereich oder kündige erst.`,
      },
      { status: 400 }
    )
  }

  // Stripe Customer sicherstellen
  const customerId = await ensureStripeCustomer({
    userId: user.id,
    email: user.email ?? profile?.email ?? '',
    name: profile?.full_name ?? undefined,
  })

  // Checkout-Session erstellen
  const stripe = getStripe()
  const origin = getAppUrl()

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    billing_address_collection: 'required',
    tax_id_collection: { enabled: true },
    automatic_tax: { enabled: true },
    success_url: `${origin}/dashboard/account/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/dashboard/pricing?checkout=cancelled`,
    subscription_data: {
      metadata: {
        user_id: user.id,
        plan_id: planId,
        price_band: priceBand,
        cycle,
      },
    },
    metadata: {
      user_id: user.id,
      plan_id: planId,
      price_band: priceBand,
      cycle,
    },
    locale: 'de',
  })

  return NextResponse.json({ url: session.url })
}
