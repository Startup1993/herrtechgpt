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
import { getAppSettings } from '@/lib/app-settings'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  // Master-Switch: Wenn das Abo-System global deaktiviert ist, blocken
  // wir hier — auch wenn jemand direkt POST'et oder eine alte Pricing-
  // Seite zwischengespeichert wurde. Frontend zeigt PricingDisabledView,
  // diese API ist die zweite Verteidigungslinie.
  const settings = await getAppSettings()
  if (!settings.subscriptionsEnabled) {
    return NextResponse.json(
      {
        error:
          'Das Abo-System ist aktuell deaktiviert. Bitte tritt der Community bei oder kaufe Credit-Pakete.',
      },
      { status: 403 }
    )
  }

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

  // Access + Preisband (email/name kommen aus auth.users, nicht profiles)
  const [{ data: profile }, cookieStore] = await Promise.all([
    supabase
      .from('profiles')
      .select('role, access_tier')
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

  // Customer + Stripe-Session — alles in try/catch damit der Client eine
  // klare Fehlermeldung bekommt statt nur "Checkout konnte nicht gestartet werden"
  try {
    const customerName =
      (user.user_metadata?.full_name as string | undefined) ??
      (user.user_metadata?.name as string | undefined) ??
      undefined
    const customerId = await ensureStripeCustomer({
      userId: user.id,
      email: user.email ?? '',
      name: customerName,
    })

    const stripe = getStripe()
    const origin = getAppUrl(req)

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      // Erlaubt Stripe, Name/Adresse des Customers mit dem zu überschreiben,
      // was im Checkout-Formular eingegeben wird. Wird von tax_id_collection
      // verlangt, damit Rechnungen die korrekte Firmenadresse zeigen.
      customer_update: { name: 'auto', address: 'auto' },
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      tax_id_collection: { enabled: true },
      // automatic_tax nur aktivieren wenn explizit konfiguriert. Stripe wirft
      // sonst Fehler wenn Tax-Registration/Origin-Adresse fehlt.
      automatic_tax: { enabled: process.env.STRIPE_AUTOMATIC_TAX === 'true' },
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
  } catch (err) {
    // Detaillierte Fehlerinfo für Vercel-Logs + sprechende Message an Client
    const msg = err instanceof Error ? err.message : String(err)
    const stripeCode = (err as { code?: string })?.code
    console.error('[checkout/subscription] Fehler:', {
      message: msg,
      code: stripeCode,
      planId,
      priceBand,
      cycle,
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
