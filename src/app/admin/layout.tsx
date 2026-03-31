import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') redirect('/assistants')

  return (
    <div className="flex h-screen bg-background">
      {/* Admin Sidebar */}
      <aside className="w-64 bg-surface border-r border-border flex flex-col h-screen shrink-0">
        <div className="px-5 pt-5 pb-4 border-b border-border">
          <Link href="/admin" className="text-xl font-black uppercase">
            Herr Tech<span className="text-primary">.</span>
          </Link>
          <p className="text-xs text-muted mt-1">Admin-Bereich</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Übersicht</p>
          <AdminNavLink href="/admin/dashboard" label="Dashboard" icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
          } />

          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3 mt-5">Verwaltung</p>
          <AdminNavLink href="/admin/agents" label="Assistenten" icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M12 11V7"/><path d="M8 7h8"/><circle cx="8" cy="5" r="2"/><circle cx="16" cy="5" r="2"/></svg>
          } />
          <AdminNavLink href="/admin/users" label="Nutzer" icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          } />
        </nav>

        <div className="border-t border-border p-4">
          <Link href="/assistants" className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Zur App
          </Link>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}

function AdminNavLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted hover:bg-surface-secondary hover:text-foreground transition-colors"
    >
      <span className="shrink-0">{icon}</span>
      {label}
    </Link>
  )
}
