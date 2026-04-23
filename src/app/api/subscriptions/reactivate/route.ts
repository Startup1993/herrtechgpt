/**
 * POST /api/subscriptions/reactivate
 *
 * Nimmt eine Kündigung zurück (solange das Abo noch nicht abgelaufen ist).
 * Pendant zu /cancel. Gibt dem User ein „Doch nicht kündigen"-Button in der UI.
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
    .select('id, stripe_subscription_id, cancel_at_period_end')
    .eq('user_id', user.id)
    .in('status', ['active', 'trialing', 'past_due'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!sub || !sub.cancel_at_period_end || !sub.stripe_subscription_id) {
    return NextResponse.json(
      { error: 'Kein gekündigtes Abo zum Reaktivieren gefunden' },
      { status: 404 }
    )
  }

  const stripe = getStripe()
  await stripe.subscriptions.update(sub.stripe_subscription_id, {
    cancel_at_period_end: false,
  })

  const admin = createAdminClient()
  await admin
    .from('subscriptions')
    .update({
      cancel_at_period_end: false,
      cancelled_at: null,
    })
    .eq('id', sub.id)

  return NextResponse.json({ ok: true })
}
