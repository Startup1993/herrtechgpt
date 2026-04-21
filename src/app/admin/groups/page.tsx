import { createClient } from '@/lib/supabase/server'
import { getPermissionMatrix, getAllUpsellCopy } from '@/lib/permissions'
import { GroupsEditor } from './GroupsEditor'

export default async function AdminGroupsPage() {
  const supabase = await createClient()
  const [matrix, upsell] = await Promise.all([
    getPermissionMatrix(supabase),
    getAllUpsellCopy(supabase),
  ])

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">Gruppen & Rechte</h1>
        <p className="text-sm text-muted">
          Konfiguriere für jede Nutzergruppe, welche Bereiche freigeschaltet, gesperrt oder als "Coming Soon" angezeigt werden — und pflege die Upsell-Texte für den KI Marketing Club.
        </p>
      </div>

      <GroupsEditor initialMatrix={matrix} initialUpsell={upsell} />
    </div>
  )
}
