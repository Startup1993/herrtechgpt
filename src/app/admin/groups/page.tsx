import { createClient } from '@/lib/supabase/server'
import { getPermissionMatrix, getAllUpsellCopy } from '@/lib/permissions'
import { getAppSettings } from '@/lib/app-settings'
import { GroupsEditor } from './GroupsEditor'

export default async function AdminGroupsPage() {
  const supabase = await createClient()
  const [matrix, upsell, settings] = await Promise.all([
    getPermissionMatrix(supabase),
    getAllUpsellCopy(supabase),
    getAppSettings(),
  ])

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">Gruppen & Rechte</h1>
        <p className="text-sm text-muted">
          Konfiguriere für jede Nutzergruppe, welche Bereiche freigeschaltet, gesperrt oder als &bdquo;Coming Soon&ldquo; angezeigt werden — und pflege die Upsell-Texte für den KI Marketing Club.
        </p>
      </div>

      <GroupsEditor
        initialMatrix={matrix}
        initialUpsell={upsell}
        subscriptionsEnabled={settings.subscriptionsEnabled}
      />
    </div>
  )
}
