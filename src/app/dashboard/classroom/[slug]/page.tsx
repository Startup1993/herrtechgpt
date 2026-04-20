import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ModuleViewClient } from './ModuleViewClient'

export default async function ModuleViewPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ video?: string }>
}) {
  const { slug } = await params
  const { video: videoId } = await searchParams

  const supabase = await createClient()

  const { data: courseModule } = await supabase
    .from('course_modules')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!courseModule) notFound()

  const { data: videos } = await supabase
    .from('module_videos')
    .select('*')
    .eq('module_id', courseModule.id)
    .eq('is_published', true)
    .order('sort_order', { ascending: true })

  // Determine active video
  const activeVideo = videoId
    ? videos?.find(v => v.id === videoId)
    : videos?.[0]

  return (
    <ModuleViewClient
      module={courseModule}
      videos={videos ?? []}
      activeVideoId={activeVideo?.id ?? null}
    />
  )
}
