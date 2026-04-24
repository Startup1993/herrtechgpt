import { createClient } from '@/lib/supabase/server'
import type { ToolboxTool } from '@/lib/toolbox-icons'
import ToolboxManager from './ToolboxManager'

export const dynamic = 'force-dynamic'

export default async function AdminToolboxPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('toolbox_tools')
    .select('*')
    .order('sort_order', { ascending: true })

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">KI Toolbox</h1>
        <p className="text-muted max-w-2xl">
          Reihenfolge, Sichtbarkeit und Coming-Soon-Status der Tools in der KI Toolbox.
          Reihenfolge per Drag &amp; Drop — gilt sofort für Sidebar und Kachel-Seite.
          Neue Tools landen automatisch am Ende.
        </p>
      </div>

      <ToolboxManager initialTools={(data as ToolboxTool[]) ?? []} />
    </div>
  )
}
