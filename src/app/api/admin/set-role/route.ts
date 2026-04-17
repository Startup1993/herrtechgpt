import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// One-time utility endpoint to set admin role
// DELETE this file after use!
export async function POST(req: NextRequest) {
  try {
    const { email, role } = await req.json()
    if (!email || !role) {
      return NextResponse.json({ error: 'email and role required' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Find user by email
    const { data: { users } } = await admin.auth.admin.listUsers()
    const user = users?.find(u => u.email === email)
    if (!user) {
      return NextResponse.json({ error: `User ${email} not found` }, { status: 404 })
    }

    // Update profile
    const { error } = await admin.from('profiles').update({
      role,
      access_tier: 'premium',
    }).eq('id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, userId: user.id, role, access_tier: 'premium' })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
