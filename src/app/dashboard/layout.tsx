import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/app-shell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch profile and conversations in parallel
  const [{ data: profile }, { data: conversations }] = await Promise.all([
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
  ])

  const userEmail = user.email ?? ''
  const userName =
    (user.user_metadata?.full_name as string) ??
    (user.user_metadata?.name as string) ??
    userEmail.split('@')[0]

  const isAdmin = profile?.role === 'admin'
  const accessTier = (profile?.access_tier ?? 'basic') as 'basic' | 'premium'

  // Check if profile is complete for onboarding guard
  const profileComplete = !!(profile?.background || profile?.market || profile?.target_audience || profile?.offer)

  return (
    <AppShell
      conversations={conversations ?? []}
      userEmail={userEmail}
      userName={userName}
      isAdmin={isAdmin}
      accessTier={accessTier}
    >
      {children}
    </AppShell>
  )
}
