import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { ModuleDetailClient } from './ModuleDetailClient'

export default async function ModuleDetailPage({
  params,
}: {
  params: Promise<{ moduleId: string }>
}) {
  const { moduleId } = await params
  const admin = createAdminClient()

  // Auto-link orphan lessons from past Skool-syncs (idempotent, cheap UPDATE)
  try { await admin.rpc('link_orphan_lessons') } catch {}

  const [{ data: courseModule }, { data: videos }, { data: chapters }, { data: allModules }] = await Promise.all([
    admin.from('course_modules').select('*').eq('id', moduleId).single(),
    admin.from('module_videos').select('*').eq('module_id', moduleId).order('sort_order', { ascending: true }),
    admin.from('module_chapters').select('*').eq('module_id', moduleId).order('sort_order', { ascending: true }),
    admin.from('course_modules').select('id, title, emoji').order('sort_order', { ascending: true }),
  ])

  if (!courseModule) notFound()

  return (
    <ModuleDetailClient
      module={courseModule}
      initialVideos={videos ?? []}
      initialChapters={chapters ?? []}
      allModules={allModules ?? []}
    />
  )
}
