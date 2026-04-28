/**
 * Diagnose-Helper: holt eine echte Paid Invoice aus Stripe und gibt
 * die erste Line als JSON zurück. Damit man sieht in welchem Format
 * Stripe Product/Price-IDs liefert.
 *
 * GET /api/admin/community/sample-invoice
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

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

export async function GET() {
  const adminUser = await requireAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  try {
    const stripe = getStripe()
    const list = await stripe.invoices.list({ limit: 1, status: 'paid' })
    const inv = list.data[0]
    if (!inv) {
      return NextResponse.json({ error: 'Keine Paid Invoice gefunden' })
    }

    const firstLine = inv.lines?.data?.[0] ?? null

    return NextResponse.json({
      invoice_id: inv.id,
      invoice_number: inv.number,
      customer_email: inv.customer_email,
      total: inv.total,
      lines_count: inv.lines?.data?.length ?? 0,
      first_line_raw: firstLine,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}
