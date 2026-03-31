import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { OnboardingGuard } from '@/components/onboarding-guard'
import type { Conversation } from '@/lib/types'

export default async function AssistantsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [{ data: conversations }, { data: profile }] = await Promise.all([
    supabase
      .from('conversations')
      .select('id, user_id, agent_id, title, created_at, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(15),
    supabase
      .from('profiles')
      .select('role, background, market, target_audience, offer')
      .eq('id', user.id)
      .single(),
  ])

  // Extract user name from email or metadata
  const userEmail = user.email ?? ''
  const userName =
    (user.user_metadata?.full_name as string) ??
    (user.user_metadata?.name as string) ??
    userEmail.split('@')[0]

  const profileComplete = !!(
    profile?.background ||
    profile?.market ||
    profile?.target_audience ||
    profile?.offer
  )

  return (
    <>
      <OnboardingGuard profileComplete={profileComplete} />
      <AppShell
        conversations={(conversations as Conversation[]) ?? []}
        userEmail={userEmail}
        userName={userName}
        isAdmin={profile?.role === 'admin'}
      >
        {children}
      </AppShell>
    </>
  )
}
