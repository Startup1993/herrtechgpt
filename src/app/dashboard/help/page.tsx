import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { HelpChat } from './HelpChat'

export default async function HelpPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const email = user.email ?? ''
  const initials = (user.user_metadata?.full_name as string | undefined)
    ? (user.user_metadata?.full_name as string).split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : email.slice(0, 2).toUpperCase()

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border px-4 sm:px-6 py-3 flex items-center gap-3 shrink-0 bg-surface">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-lg">💬</span>
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-foreground text-sm sm:text-base">Hilfe & Kontakt</h1>
          <p className="text-xs text-muted hidden sm:block">
            Frag mich alles — bei Bedarf verbinde ich dich mit dem Team.
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <Suspense fallback={<div className="p-8 text-center text-muted text-sm">Lade…</div>}>
          <HelpChat userId={user.id} userInitials={initials} />
        </Suspense>
      </div>
    </div>
  )
}
