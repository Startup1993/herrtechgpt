/**
 * POST /api/billing/portal
 *
 * Erzeugt eine Stripe Customer Portal Session und gibt die URL zurück.
 * User wird dorthin redirected, sieht seine Rechnungen + kann Zahlungsmethode
 * ändern.
 *
 * Kündigung haben wir im Portal DEAKTIVIERT (via Dashboard-Config) — dafür
 * gibt es den eigenen Button /api/subscriptions/cancel. Das ist bewusst, weil:
 *   - Retention-Chance („Bist du sicher?"-Modal)
 *   - Alumni-Flow: bei Community-Verlust soll das Abo kontrolliert auslaufen
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'
import { getAppUrl } from '@/lib/urls'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  if (!profile?.stripe_customer_id) {
    return NextResponse.json(
      { error: 'Noch kein Stripe-Kundenkonto — bitte zuerst ein Abo abschließen.' },
      { status: 400 }
    )
  }

  const stripe = getStripe()
  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${getAppUrl()}/dashboard/account/billing`,
    locale: 'de',
  })

  return NextResponse.json({ url: session.url })
}
