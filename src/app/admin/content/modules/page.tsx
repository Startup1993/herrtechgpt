import { createAdminClient } from '@/lib/supabase/admin'
import { ModulesClient } from './ModulesClient'

export default async function AdminModulesPage() {
  const admin = createAdminClient()

  const { data: modules } = await admin
    .from('course_modules')
    .select('*')
    .order('sort_order', { ascending: true })

  // Get video counts per module
  const moduleIds = (modules ?? []).map(m => m.id)
  const { data: videos } = moduleIds.length > 0
    ? await admin.from('module_videos').select('module_id').in('module_id', moduleIds)
    : { data: [] }

  const videoCounts: Record<string, number> = {}
  videos?.forEach(v => {
    videoCounts[v.module_id] = (videoCounts[v.module_id] ?? 0) + 1
  })

  const modulesWithCounts = (modules ?? []).map(m => ({
    ...m,
    videoCount: videoCounts[m.id] ?? 0,
  }))

  return <ModulesClient initialModules={modulesWithCounts} />
}
