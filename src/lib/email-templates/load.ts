// Lädt das (möglicherweise vom Admin überschriebene) Template aus der DB
// und merged es mit den Defaults aus der Registry.
//
// Verwendung in send*-Funktionen:
//   const tpl = await loadTemplate('admin_invite')
//   const html = renderInviteEmail({ loginLink, firstName, content: tpl.data })

import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTemplate, type TemplateDefinition } from './registry'

export interface LoadedTemplate {
  subject: string
  data: Record<string, string>
}

export async function loadTemplate(
  key: string,
  client?: SupabaseClient,
): Promise<LoadedTemplate> {
  const def = getTemplate(key)
  if (!def) {
    throw new Error(`Unknown email template: ${key}`)
  }

  const admin = client ?? createAdminClient()
  const { data: row } = await admin
    .from('email_templates')
    .select('subject, data')
    .eq('key', key)
    .maybeSingle()

  return mergeWithDefaults(def, row?.subject ?? null, (row?.data ?? null) as Record<string, string> | null)
}

function mergeWithDefaults(
  def: TemplateDefinition,
  subject: string | null,
  data: Record<string, string> | null,
): LoadedTemplate {
  const merged: Record<string, string> = { ...def.defaults.data }
  if (data) {
    for (const k of Object.keys(data)) {
      const v = data[k]
      if (typeof v === 'string' && v.length > 0) merged[k] = v
    }
  }
  return {
    subject: subject && subject.length > 0 ? subject : def.defaults.subject,
    data: merged,
  }
}
