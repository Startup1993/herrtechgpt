import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const CATEGORY_LABELS: Record<string, string> = {
  'content-hook': 'Content & Hooks',
  'funnel-monetization': 'Funnels & Monetarisierung',
  'personal-growth': 'Mindset & Wachstum',
  'ai-prompt': 'KI-Prompts & Workflows',
  'herr-tech': 'KI-Tools & Automatisierung',
  'business-coach': 'Business-Strategie',
}

const CATEGORY_EMOJIS: Record<string, string> = {
  'content-hook': '🎯',
  'funnel-monetization': '💰',
  'personal-growth': '💛',
  'ai-prompt': '🔧',
  'herr-tech': '🤖',
  'business-coach': '🧠',
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Nur chunk_index=0 pro Video (= ein Eintrag pro Video)
  const { data: videos, error } = await supabase
    .from('knowledge_base')
    .select('video_id, video_name, source, duration_minutes')
    .eq('is_active', true)
    .eq('chunk_index', 0)
    .order('video_name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Gruppiere nach Kategorie
  const categorized: Record<string, Array<{
    id: string
    title: string
    duration: number | null
    categories: string[]
  }>> = {}

  // "Alle Videos" Bucket
  const allVideos: typeof categorized[string] = []

  for (const v of videos ?? []) {
    const tags = (v.source ?? 'wistia')
      .split(',')
      .map((s: string) => s.trim())
      .filter((s: string) => s && s !== 'wistia')

    const videoItem = {
      id: v.video_id,
      title: v.video_name,
      duration: v.duration_minutes,
      categories: tags,
    }

    allVideos.push(videoItem)

    if (tags.length === 0) {
      // Kein Agent-Tag → "Sonstiges"
      if (!categorized['other']) categorized['other'] = []
      categorized['other'].push(videoItem)
    } else {
      for (const tag of tags) {
        if (!categorized[tag]) categorized[tag] = []
        categorized[tag].push(videoItem)
      }
    }
  }

  // In sortiertes Array umwandeln
  const categoryOrder = [
    'herr-tech', 'ai-prompt', 'content-hook',
    'funnel-monetization', 'business-coach', 'personal-growth', 'other',
  ]

  const result = categoryOrder
    .filter((cat) => categorized[cat] && categorized[cat].length > 0)
    .map((cat) => ({
      id: cat,
      label: CATEGORY_LABELS[cat] ?? 'Sonstiges',
      emoji: CATEGORY_EMOJIS[cat] ?? '📂',
      videos: categorized[cat],
    }))

  return NextResponse.json({
    total: allVideos.length,
    categories: result,
  })
}
