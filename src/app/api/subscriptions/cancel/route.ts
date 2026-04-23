/**
 * POST /api/subscriptions/cancel
 *
 * Kündigt das aktuelle Abo des Users zum Periodenende.
 * - Ruft Stripe an: cancel_at_period_end=true
 * - Aktualisiert lokale DB sofort (cancel_at_period_end=true, cancelled_at=now)
 * - User behält Zugriff bis current_period_end, danach ended via Webhook
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe'

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

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('id, stripe_subscription_id, cancel_at_period_end, current_period_end')
    .eq('user_id', user.id)
    .in('status', ['active', 'trialing', 'past_due'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!sub) {
    return NextResponse.json({ error: 'Kein aktives Abo gefunden' }, { status: 404 })
  }

  if (sub.cancel_at_period_end) {
    return NextResponse.json({
      ok: true,
      alreadyCancelled: true,
      periodEnd: sub.current_period_end,
    })
  }

  if (!sub.stripe_subscription_id) {
    return NextResponse.json(
      { error: 'Abo hat keine Stripe-Referenz — Support kontaktieren' },
      { status: 500 }
    )
  }

  const stripe = getStripe()
  const updated = await stripe.subscriptions.update(sub.stripe_subscription_id, {
    cancel_at_period_end: true,
  })

  // Lokale DB sofort updaten (nicht auf Webhook warten)
  const admin = createAdminClient()
  await admin
    .from('subscriptions')
    .update({
      cancel_at_period_end: true,
      cancelled_at: new Date().toISOString(),
    })
    .eq('id', sub.id)

  const subData = updated as unknown as { current_period_end: number }
  return NextResponse.json({
    ok: true,
    periodEnd: new Date(subData.current_period_end * 1000).toISOString(),
  })
}
