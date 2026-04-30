/**
 * PATCH /api/admin/users/credits
 *
 * Manuelle Credit-Anpassung durch Admin (Kulanz, Test-Setup, Korrektur).
 *
 * Body: { userId: string, action: 'add' | 'set', amount: number }
 *
 * - 'add': addiert (oder zieht ab bei negativem amount) auf purchased_balance.
 *   Kommt in credit_transactions als 'admin_adjust'.
 * - 'set': setzt purchased_balance auf den angegebenen Wert (absolute).
 *   Auch hier credit_transactions-Eintrag mit 'admin_adjust'.
 *
 * Wir manipulieren NUR purchased_balance — monthly_balance gehört dem Cron
 * (sonst kollidiert manuelle Anpassung mit dem nächsten Monats-Reset).
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (!profile || profile.role !== 'admin') return null
  return user
}

const VALID_ACTIONS = ['add', 'set'] as const

export async function PATCH(request: Request) {
  const adminUser = await requireAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  let body: { userId?: string; action?: string; amount?: number; note?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const userId = body.userId
  if (!userId || typeof userId !== 'string') {
    return NextResponse.json({ error: 'userId required' }, { status: 400 })
  }

  const action = body.action
  if (!action || !VALID_ACTIONS.includes(action as (typeof VALID_ACTIONS)[number])) {
    return NextResponse.json(
      { error: `action muss 'add' oder 'set' sein` },
      { status: 400 }
    )
  }

  const amount = body.amount
  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    return NextResponse.json({ error: 'amount muss eine Zahl sein' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Aktueller Wallet-Stand
  const { data: wallet } = await admin
    .from('credit_wallets')
    .select('monthly_balance, purchased_balance, monthly_allowance, reset_at')
    .eq('user_id', userId)
    .maybeSingle()

  const monthly = wallet?.monthly_balance ?? 0
  const oldPurchased = wallet?.purchased_balance ?? 0

  // Neuer purchased-Wert
  let newPurchased: number
  if (action === 'set') {
    if (amount < 0) {
      return NextResponse.json({ error: 'Bei action=set muss amount >= 0 sein' }, { status: 400 })
    }
    newPurchased = Math.floor(amount)
  } else {
    // 'add' — kann negativ sein für Abzug
    newPurchased = Math.max(0, oldPurchased + Math.floor(amount))
  }

  const delta = newPurchased - oldPurchased

  const { error: walletErr } = await admin
    .from('credit_wallets')
    .upsert({
      user_id: userId,
      monthly_balance: monthly,
      purchased_balance: newPurchased,
      monthly_allowance: wallet?.monthly_allowance ?? 0,
      reset_at: wallet?.reset_at ?? null,
    })

  if (walletErr) {
    return NextResponse.json({ error: walletErr.message }, { status: 500 })
  }

  // Audit-Log
  if (delta !== 0) {
    await admin.from('credit_transactions').insert({
      user_id: userId,
      amount: delta,
      balance_after_monthly: monthly,
      balance_after_purchased: newPurchased,
      reason: 'admin_adjust',
      note: body.note ?? `Admin-Anpassung: ${action} ${amount}`,
    })
  }

  return NextResponse.json({
    success: true,
    monthly,
    purchased: newPurchased,
    total: monthly + newPurchased,
    delta,
  })
}
