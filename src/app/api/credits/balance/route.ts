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

  const { data: wallet } = await supabase
    .from('credit_wallets')
    .select('monthly_balance, purchased_balance, monthly_allowance, reset_at')
    .eq('user_id', user.id)
    .maybeSingle()

  const monthly = wallet?.monthly_balance ?? 0
  const purchased = wallet?.purchased_balance ?? 0

  return NextResponse.json({
    monthly,
    purchased,
    total: monthly + purchased,
    allowance: wallet?.monthly_allowance ?? 0,
    reset_at: wallet?.reset_at ?? null,
  })
}
