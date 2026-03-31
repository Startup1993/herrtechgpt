import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { agentId } = await request.json()
  if (!agentId) return NextResponse.json({ error: 'agentId required' }, { status: 400 })

  const { data, error } = await supabase
    .from('conversations')
    .insert({ user_id: user.id, agent_id: agentId, title: 'Neue Unterhaltung' })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
