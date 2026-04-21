import { createAdminClient } from '@/lib/supabase/admin'
import { ModulesClient } from './ModulesClient'

export default async function AdminModulesPage() {
  const admin = createAdminClient()

  const { data: modules } = await admin
    .from('course_modules')
    .select('*')
    .order('sort_order', { ascending: true })

  // Get video + draft + missing-wistia counts per module
  const moduleIds = (modules ?? []).map(m => m.id)
  const { data: videos } = moduleIds.length > 0
    ? await admin.from('module_videos').select('module_id, is_published, wistia_hashed_id, skool_video_id').in('module_id', moduleIds)
    : { data: [] }

  // Draft-counts include both unpublished videos AND unpublished chapters
  const { data: chapters } = moduleIds.length > 0
    ? await admin.from('module_chapters').select('module_id, is_published').in('module_id', moduleIds)
    : { data: [] }

  const videoCounts: Record<string, number> = {}
  const draftCounts: Record<string, number> = {}
  const missingWistiaCounts: Record<string, number> = {}
  videos?.forEach(v => {
    videoCounts[v.module_id] = (videoCounts[v.module_id] ?? 0) + 1
    if (!v.is_published) draftCounts[v.module_id] = (draftCounts[v.module_id] ?? 0) + 1
    if (v.skool_video_id && v.wistia_hashed_id === 'MISSING___') missingWistiaCounts[v.module_id] = (missingWistiaCounts[v.module_id] ?? 0) + 1
  })
  chapters?.forEach(c => {
    if (!c.is_published) draftCounts[c.module_id] = (draftCounts[c.module_id] ?? 0) + 1
  })

  const modulesWithCounts = (modules ?? []).map(m => ({
    ...m,
    videoCount: videoCounts[m.id] ?? 0,
    draftCount: draftCounts[m.id] ?? 0,
    missingWistiaCount: missingWistiaCounts[m.id] ?? 0,
  }))

  return <ModulesClient initialModules={modulesWithCounts} />
}
