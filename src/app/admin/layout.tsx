import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/app-shell'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: conversations }] = await Promise.all([
    supabase
      .from('profiles')
      .select('role, access_tier')
      .eq('id', user.id)
      .single(),
    supabase
      .from('conversations')
      .select('id, user_id, agent_id, title, created_at, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(15),
  ])

  // Only admins can access /admin
  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard')
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
      isAdmin={true}
      accessTier={(profile.access_tier ?? 'premium') as 'basic' | 'premium'}
    >
      {children}
    </AppShell>
  )
}
