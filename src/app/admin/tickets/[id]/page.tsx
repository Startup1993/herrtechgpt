import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { TicketDetailClient } from './TicketDetailClient'

export default async function AdminTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const admin = createAdminClient()

  const [
    { data: conv },
    { data: messages },
    { data: { users: authUsers } },
  ] = await Promise.all([
    admin.from('conversations').select('id, user_id, title, created_at, mode, status').eq('id', id).single(),
    admin.from('messages').select('id, role, content, created_at').eq('conversation_id', id).order('created_at', { ascending: true }),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ])

  if (!conv) notFound()

  const authUser = authUsers?.find((u) => u.id === conv.user_id)
  const { data: profile } = await admin
    .from('profiles')
    .select('access_tier, role, created_at, market')
    .eq('id', conv.user_id)
    .single()

  const user = {
    id: conv.user_id,
    email: authUser?.email ?? '',
    tier: (profile?.access_tier ?? 'basic') as 'basic' | 'alumni' | 'premium',
    role: (profile?.role ?? 'user') as 'user' | 'admin',
    createdAt: profile?.created_at ?? '',
    market: profile?.market ?? '',
    lastSignIn: authUser?.last_sign_in_at ?? null,
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/tickets" className="text-muted hover:text-foreground transition-colors">
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold text-foreground flex-1">Ticket — {user.email}</h1>
      </div>

      <TicketDetailClient
        conversationId={conv.id}
        title={conv.title ?? 'Hilfe-Anfrage'}
        initialMode={(conv.mode ?? 'ai') as 'ai' | 'human'}
        initialStatus={(conv.status ?? 'new') as 'new' | 'answered' | 'resolved'}
        initialMessages={(messages ?? []).map((m) => ({
          id: m.id,
          role: m.role as 'user' | 'assistant' | 'admin' | 'system',
          content: m.content,
          created_at: m.created_at,
        }))}
        user={user}
      />
    </div>
  )
}
