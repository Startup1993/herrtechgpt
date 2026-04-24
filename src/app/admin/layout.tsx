import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { AppShell } from '@/components/app-shell'
import { NonProductionBanner } from '@/components/non-production-banner'
import { computeEffectiveAccess, VIEW_AS_COOKIE } from '@/lib/access'
import { getPermissionMatrix } from '@/lib/permissions'
import { getAuthedUser, getProfileCached } from '@/lib/server-cache'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getAuthedUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  const [profile, { data: conversations }, cookieStore, matrix, { count: ticketCount }, { count: helpUnreadCount }] = await Promise.all([
    getProfileCached(),
    supabase
      .from('conversations')
      .select('id, user_id, agent_id, title, created_at, updated_at, user_has_unread')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(15),
    cookies(),
    getPermissionMatrix(supabase),
    supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('agent_id', 'help')
      .eq('status', 'new')
      .eq('mode', 'human'),
    supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('agent_id', 'help')
      .eq('user_has_unread', true),
  ])

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard')
  }

  const viewAsRaw = cookieStore.get(VIEW_AS_COOKIE)?.value
  const access = computeEffectiveAccess(profile, viewAsRaw)
  const states = matrix[access.tier]

  const userEmail = user.email ?? ''
  const userName =
    (user.user_metadata?.full_name as string) ??
    (user.user_metadata?.name as string) ??
    userEmail.split('@')[0]

  return (
    <AppShell
      conversations={conversations ?? []}
      userEmail={userEmail}
      userName={userName}
      isAdmin={access.isAdmin}
      realIsAdmin={true}
      accessTier={access.tier}
      viewAs={access.viewAs}
      states={states}
      newTicketCount={ticketCount ?? 0}
      helpUnreadCount={helpUnreadCount ?? 0}
    >
      <NonProductionBanner />
      {children}
    </AppShell>
  )
}
