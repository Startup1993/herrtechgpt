import { createClient } from '@/lib/supabase/server'
import { KnowledgeTable } from './KnowledgeTable'

export default async function KnowledgePage() {
  const supabase = await createClient()

  // Fetch all videos grouped (one row per video)
  const { data: chunks } = await supabase
    .from('knowledge_base')
    .select('video_id, video_name, duration_minutes, is_active, chunk_index')
    .order('video_name')

  // Group by video_id
  const videoMap: Record<string, {
    video_id: string
    video_name: string
    duration_minutes: number
    is_active: boolean
    chunk_count: number
  }> = {}

  chunks?.forEach((c) => {
    if (!videoMap[c.video_id]) {
      videoMap[c.video_id] = {
        video_id: c.video_id,
        video_name: c.video_name,
        duration_minutes: c.duration_minutes ?? 0,
        is_active: c.is_active,
        chunk_count: 0,
      }
    }
    videoMap[c.video_id].chunk_count++
    // If any chunk is active, video counts as active
    if (c.is_active) videoMap[c.video_id].is_active = true
  })

  const videos = Object.values(videoMap).sort((a, b) =>
    a.video_name.localeCompare(b.video_name)
  )

  const totalActive = videos.filter((v) => v.is_active).length
  const totalMin = videos.filter((v) => v.is_active).reduce((s, v) => s + v.duration_minutes, 0)

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-2xl font-bold text-foreground mb-1">Wissensbasis verwalten</h1>
      <p className="text-muted mb-6">
        Steuere welche Videos die KI als Wissensquelle nutzt. Deaktivierte Videos werden nicht mehr in Antworten einbezogen.
      </p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-2xl font-bold text-foreground">{videos.length}</div>
          <div className="text-sm text-muted">Videos gesamt</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-2xl font-bold text-primary">{totalActive}</div>
          <div className="text-sm text-muted">Aktiv (werden genutzt)</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-2xl font-bold text-foreground">{Math.round(totalMin / 60 * 10) / 10}h</div>
          <div className="text-sm text-muted">Aktives Wissen</div>
        </div>
      </div>

      <KnowledgeTable videos={videos} />
    </div>
  )
}
