import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { TEMPLATES, TEMPLATE_GROUPS } from '@/lib/email-templates/registry'

export default async function AdminEmailsPage() {
  const supabase = await createClient()
  const { data: rows } = await supabase
    .from('email_templates')
    .select('key, updated_at')

  const customized = new Set<string>((rows ?? []).map((r: { key: string }) => r.key))
  const updatedMap: Record<string, string | null> = {}
  for (const r of rows ?? []) {
    updatedMap[(r as { key: string }).key] = (r as { updated_at: string | null }).updated_at
  }

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-foreground mb-2">E-Mail-Templates</h1>
      <p className="text-muted mb-8">
        Texte aller System-Mails anpassen — Subject, Headline, Intro, Button-Text, P.S. usw.
        Die HTML-Struktur und das Branding bleiben fix. Änderungen wirken sofort beim
        nächsten Versand. Variablen wie <code className="text-xs bg-surface-secondary px-1.5 py-0.5 rounded">{'{firstName}'}</code> werden zur Laufzeit ersetzt.
      </p>

      <div className="space-y-8">
        {TEMPLATE_GROUPS.map((group) => {
          const items = TEMPLATES.filter((t) => t.group === group.key)
          if (items.length === 0) return null
          return (
            <section key={group.key}>
              <h2 className="text-xs uppercase tracking-wider text-muted font-semibold mb-3">
                {group.label}
              </h2>
              <div className="space-y-3">
                {items.map((tpl) => {
                  const isCustomized = customized.has(tpl.key)
                  const updated = updatedMap[tpl.key]
                  return (
                    <Link
                      key={tpl.key}
                      href={`/admin/emails/${tpl.key}`}
                      className="bg-surface border border-border rounded-xl p-5 flex items-start gap-4 hover:border-primary/40 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium text-foreground">{tpl.label}</h3>
                          {isCustomized && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                              Angepasst
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted mt-1 leading-relaxed">{tpl.trigger}</p>
                        {updated && (
                          <p className="text-xs text-muted mt-2">
                            Zuletzt geändert: {new Date(updated).toLocaleString('de-DE')}
                          </p>
                        )}
                      </div>
                      <span className="text-sm text-muted shrink-0 mt-1">Bearbeiten →</span>
                    </Link>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
