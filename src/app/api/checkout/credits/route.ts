/**
 * POST /api/checkout/credits
 *
 * Startet einen Stripe-Checkout für ein Credit-Top-up-Pack (one-time payment).
 *
 * Body: { packId: 'pack_100'|'pack_500'|'pack_2000' }
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { computeEffectiveAccess, VIEW_AS_COOKIE } from '@/lib/access'
import { ensureStripeCustomer, priceBandForAccessTier } from '@/lib/monetization'
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
  const packId = body.packId as string | undefined
  if (!packId) {
    return NextResponse.json({ error: 'packId required' }, { status: 400 })
  }

  const [{ data: profile }, cookieStore] = await Promise.all([
    supabase.from('profiles').select('role, access_tier').eq('id', user.id).single(),
    cookies(),
  ])
  const access = computeEffectiveAccess(profile, cookieStore.get(VIEW_AS_COOKIE)?.value)
  const priceBand = priceBandForAccessTier(access.tier)

  const { data: pack } = await supabase
    .from('credit_packs')
    .select('*')
    .eq('id', packId)
    .eq('active', true)
    .maybeSingle()

  if (!pack) {
    return NextResponse.json({ error: `Pack ${packId} nicht gefunden/aktiv` }, { status: 404 })
  }

  const priceId =
    priceBand === 'community' ? pack.stripe_price_community : pack.stripe_price_basic
  if (!priceId) {
    return NextResponse.json(
      {
        error: `Preis fehlt: Pack ${packId} hat keine Stripe-Price für ${priceBand}. Admin → Monetarisierung → Credits.`,
      },
      { status: 400 }
    )
  }

  const customerName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    undefined
  try {
    const customerId = await ensureStripeCustomer({
      userId: user.id,
      email: user.email ?? '',
      name: customerName,
    })

    const stripe = getStripe()
    const origin = getAppUrl(req)

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer: customerId,
      // Siehe Subscription-Route: nötig für tax_id_collection bei bestehenden Customern
      customer_update: { name: 'auto', address: 'auto' },
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      tax_id_collection: { enabled: true },
      automatic_tax: { enabled: process.env.STRIPE_AUTOMATIC_TAX === 'true' },
      invoice_creation: { enabled: true },
      success_url: `${origin}/dashboard/credits?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard/credits?checkout=cancelled`,
      metadata: {
        user_id: user.id,
        pack_id: packId,
        credits: String(pack.credits),
        expiry_months: String(pack.expiry_months ?? 12),
        price_band: priceBand,
      },
      payment_intent_data: {
        metadata: {
          user_id: user.id,
          pack_id: packId,
          credits: String(pack.credits),
        },
      },
      locale: 'de',
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const stripeCode = (err as { code?: string })?.code
    console.error('[checkout/credits] Fehler:', {
      message: msg,
      code: stripeCode,
      packId,
      priceBand,
      priceId,
      userId: user.id,
    })
    return NextResponse.json(
      {
        error: `Checkout-Fehler: ${msg}${stripeCode ? ` (${stripeCode})` : ''}`,
      },
      { status: 500 }
    )
  }
}
