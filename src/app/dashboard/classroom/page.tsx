import { createClient } from '@/lib/supabase/server'
import { ClassroomClient } from './ClassroomClient'

export default async function ClassroomPage() {
  const supabase = await createClient()

  const { data: modules } = await supabase
    .from('course_modules')
    .select('*')
    .eq('is_published', true)
    .order('sort_order', { ascending: true })

  // Get video counts
  const moduleIds = (modules ?? []).map(m => m.id)
  const { data: videos } = moduleIds.length > 0
    ? await supabase
        .from('module_videos')
        .select('module_id, duration_seconds')
        .eq('is_published', true)
        .in('module_id', moduleIds)
    : { data: [] }

  const counts: Record<string, { count: number; duration: number }> = {}
  videos?.forEach(v => {
    if (!counts[v.module_id]) counts[v.module_id] = { count: 0, duration: 0 }
    counts[v.module_id].count++
    counts[v.module_id].duration += v.duration_seconds ?? 0
  })

  const modulesWithStats = (modules ?? []).map(m => ({
    id: m.id,
    title: m.title,
    slug: m.slug,
    description: m.description,
    emoji: m.emoji,
    sort_order: m.sort_order,
    videoCount: counts[m.id]?.count ?? 0,
    totalDurationMin: Math.round((counts[m.id]?.duration ?? 0) / 60),
  }))

  return <ClassroomClient modules={modulesWithStats} />
}
