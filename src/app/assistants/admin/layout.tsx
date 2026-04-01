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
    <div className="flex flex-col h-full overflow-hidden">
      {/* Admin Top Nav */}
      <div className="border-b border-border bg-surface px-8 flex items-center gap-1 shrink-0">
        <AdminTab href="/assistants/admin/dashboard" label="Dashboard" />
        <AdminTab href="/assistants/admin/agents" label="Assistenten" />
        <AdminTab href="/assistants/admin/users" label="Nutzer" />
        <AdminTab href="/assistants/admin/knowledge" label="Wissensbasis" />
      </div>

      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  )
}

function AdminTab({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="px-4 py-3 text-sm text-muted hover:text-foreground border-b-2 border-transparent hover:border-primary transition-colors"
    >
      {label}
    </Link>
  )
}
