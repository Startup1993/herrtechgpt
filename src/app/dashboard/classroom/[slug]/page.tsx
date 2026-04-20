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

  // Fetch videos + chapters in parallel
  const [{ data: videos }, { data: chapters }] = await Promise.all([
    supabase
      .from('module_videos')
      .select('*')
      .eq('module_id', courseModule.id)
      .eq('is_published', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('module_chapters')
      .select('*')
      .eq('module_id', courseModule.id)
      .eq('is_published', true)
      .order('sort_order', { ascending: true }),
  ])

  // Fetch resources for all videos in this module (one query)
  const videoIds = (videos ?? []).map(v => v.id)
  const { data: resources } = videoIds.length > 0
    ? await supabase
        .from('module_video_resources')
        .select('*')
        .in('video_id', videoIds)
        .order('sort_order', { ascending: true })
    : { data: [] }

  // Determine active video
  const activeVideo = videoId
    ? videos?.find(v => v.id === videoId)
    : videos?.[0]

  return (
    <ModuleViewClient
      module={courseModule}
      videos={videos ?? []}
      chapters={chapters ?? []}
      resources={resources ?? []}
      activeVideoId={activeVideo?.id ?? null}
    />
  )
}
