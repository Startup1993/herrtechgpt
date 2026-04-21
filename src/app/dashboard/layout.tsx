import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { AppShell } from '@/components/app-shell'
import { computeEffectiveAccess, VIEW_AS_COOKIE } from '@/lib/access'
import { getPermissionMatrix } from '@/lib/permissions'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: conversations }, cookieStore, matrix] = await Promise.all([
    supabase
      .from('profiles')
      .select('role, access_tier, background, market, target_audience, offer')
      .eq('id', user.id)
      .single(),
    supabase
      .from('conversations')
      .select('id, user_id, agent_id, title, created_at, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(15),
    cookies(),
    getPermissionMatrix(supabase),
  ])

  const viewAsRaw = cookieStore.get(VIEW_AS_COOKIE)?.value
  const access = computeEffectiveAccess(profile, viewAsRaw)
  const states = matrix[access.tier]

  // Neue Tickets z\u00e4hlen — nur f\u00fcr echte Admins (nicht impersonating)
  let newTicketCount = 0
  if (access.realIsAdmin) {
    const { count } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('agent_id', 'help')
      .eq('status', 'new')
      .eq('mode', 'human')
    newTicketCount = count ?? 0
  }

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
      realIsAdmin={access.realIsAdmin}
      accessTier={access.tier}
      viewAs={access.viewAs}
      states={states}
      newTicketCount={newTicketCount}
    >
      {children}
    </AppShell>
  )
}
