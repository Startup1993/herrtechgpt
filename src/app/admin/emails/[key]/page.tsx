import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTemplate } from '@/lib/email-templates/registry'
import EmailEditForm from './EmailEditForm'

export default async function EmailEditPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params
  const def = getTemplate(key)
  if (!def) notFound()

  const supabase = await createClient()
  const { data: row } = await supabase
    .from('email_templates')
    .select('subject, data, updated_at')
    .eq('key', key)
    .maybeSingle()

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center gap-2 text-sm text-muted mb-6">
        <Link href="/admin/emails" className="hover:text-foreground transition-colors">E-Mails</Link>
        <span>/</span>
        <span className="text-foreground">{def.label}</span>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{def.label}</h1>
        <p className="text-sm text-muted mt-1 max-w-2xl">{def.trigger}</p>
      </div>

      <EmailEditForm
        def={def}
        initialSubject={(row?.subject as string | null) ?? null}
        initialData={(row?.data as Record<string, string> | null) ?? null}
        hasOverride={!!row}
      />
    </div>
  )
}
