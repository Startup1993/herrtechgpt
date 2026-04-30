import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const [walletRes, profileRes] = await Promise.all([
    supabase
      .from('credit_wallets')
      .select('monthly_balance, purchased_balance, monthly_allowance, reset_at')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('profiles')
      .select('access_tier')
      .eq('id', user.id)
      .maybeSingle(),
  ])

  const wallet = walletRes.data
  const monthly = wallet?.monthly_balance ?? 0
  const purchased = wallet?.purchased_balance ?? 0
  const tier = (profileRes.data?.access_tier as string | undefined) ?? 'basic'

  return NextResponse.json({
    monthly,
    purchased,
    total: monthly + purchased,
    allowance: wallet?.monthly_allowance ?? 0,
    reset_at: wallet?.reset_at ?? null,
    tier,
  })
}
