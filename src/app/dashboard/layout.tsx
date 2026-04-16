import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { DashboardNav } from './DashboardNav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, access_tier')
    .eq('id', user.id)
    .single()

  const isPremium = profile?.access_tier === 'premium' || profile?.role === 'admin'

  const userEmail = user.email ?? ''
  const userName =
    (user.user_metadata?.full_name as string) ??
    (user.user_metadata?.name as string) ??
    userEmail.split('@')[0]

  const initials = userName
    ? userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : userEmail.slice(0, 2).toUpperCase()

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-surface shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-14">
          {/* Logo */}
          <Link href="/dashboard" className="shrink-0">
            <img src="/logo.png" alt="Herr Tech" className="h-6 w-auto" />
          </Link>

          {/* Navigation */}
          <DashboardNav isPremium={isPremium} />

          {/* User */}
          <div className="flex items-center gap-3">
            {isPremium && (
              <span className="hidden sm:inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                Premium
              </span>
            )}
            <Link
              href="/dashboard"
              className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-semibold"
              title={userEmail}
            >
              {initials}
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
