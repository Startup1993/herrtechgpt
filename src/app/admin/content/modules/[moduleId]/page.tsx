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

  const [{ data: courseModule }, { data: videos }, { data: allModules }] = await Promise.all([
    admin.from('course_modules').select('*').eq('id', moduleId).single(),
    admin.from('module_videos').select('*').eq('module_id', moduleId).order('sort_order', { ascending: true }),
    admin.from('course_modules').select('id, title, emoji').order('sort_order', { ascending: true }),
  ])

  if (!courseModule) notFound()

  return (
    <ModuleDetailClient
      module={courseModule}
      initialVideos={videos ?? []}
      allModules={allModules ?? []}
    />
  )
}
