import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { agents } from '@/lib/agents'
import { UserDetailClient } from './UserDetailClient'

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params
  const admin = createAdminClient()

  // Fetch user data in parallel
  const [
    { data: profile },
    { data: { users: authUsers } },
    { data: conversations },
    { data: messages },
  ] = await Promise.all([
    admin.from('profiles').select('*').eq('id', userId).single(),
    admin.auth.admin.listUsers(),
    admin.from('conversations').select('id, agent_id, title, created_at, updated_at').eq('user_id', userId).order('updated_at', { ascending: false }),
    admin.from('messages').select('id, conversation_id, role, created_at').eq('conversation_id', userId), // will be filtered below
  ])

  const authUser = authUsers?.find(u => u.id === userId)
  if (!profile || !authUser) notFound()

  // Get message counts per conversation
  const { data: allMessages } = await admin
    .from('messages')
    .select('conversation_id, role')
    .in('conversation_id', (conversations ?? []).map(c => c.id))

  const msgCounts: Record<string, number> = {}
  allMessages?.forEach(m => {
    msgCounts[m.conversation_id] = (msgCounts[m.conversation_id] ?? 0) + 1
  })

  const totalMessages = allMessages?.length ?? 0
  const userMessages = allMessages?.filter(m => m.role === 'user').length ?? 0

  // Agent usage
  const agentUsage: Record<string, number> = {}
  conversations?.forEach(c => {
    agentUsage[c.agent_id] = (agentUsage[c.agent_id] ?? 0) + 1
  })

  const userData = {
    id: userId,
    email: authUser.email ?? '',
    role: (profile.role ?? 'user') as string,
    accessTier: (profile.access_tier ?? 'basic') as 'basic' | 'alumni' | 'premium',
    createdAt: profile.created_at,
    lastSignIn: authUser.last_sign_in_at ?? null,
    background: profile.background ?? '',
    market: profile.market ?? '',
    targetAudience: profile.target_audience ?? '',
    offer: profile.offer ?? '',
    experienceLevel: profile.experience_level ?? '',
    primaryGoal: profile.primary_goal ?? '',
    hasLearningPath: !!profile.learning_path,
  }

  const stats = {
    totalConversations: conversations?.length ?? 0,
    totalMessages,
    userMessages,
    agentUsage: Object.entries(agentUsage).map(([id, count]) => ({
      id,
      name: agents.find(a => a.id === id)?.name ?? id,
      emoji: agents.find(a => a.id === id)?.emoji ?? '💬',
      count,
    })).sort((a, b) => b.count - a.count),
    recentConversations: (conversations ?? []).slice(0, 10).map(c => ({
      id: c.id,
      agentId: c.agent_id,
      agentName: agents.find(a => a.id === c.agent_id)?.name ?? c.agent_id,
      agentEmoji: agents.find(a => a.id === c.agent_id)?.emoji ?? '💬',
      title: c.title,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
      messageCount: msgCounts[c.id] ?? 0,
    })),
  }

  return <UserDetailClient user={userData} stats={stats} />
}
