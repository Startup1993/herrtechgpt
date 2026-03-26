import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'
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

  const { data: conversations } = await supabase
    .from('conversations')
    .select('id, user_id, agent_id, title, created_at, updated_at')
    .order('updated_at', { ascending: false })
    .limit(15)

  // Extract user name from email or metadata
  const userEmail = user.email ?? ''
  const userName =
    (user.user_metadata?.full_name as string) ??
    (user.user_metadata?.name as string) ??
    userEmail.split('@')[0]

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        conversations={(conversations as Conversation[]) ?? []}
        userEmail={userEmail}
        userName={userName}
      />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  )
}
