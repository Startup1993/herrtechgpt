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

const SKIP_PATTERNS = [
  'Skool_Intro', 'Masterclass_Intro', 'SkoolVideo',
  'street_interview', 'A_nerd', 'I never pay',
  'Referenz', 'Empfehlung', 'KIMarketingClub',
]

interface WistiaMedia {
  id: number
  hashed_id: string
  name: string
  duration?: number
  created: string
  thumbnail?: { url: string }
}

function shouldSkip(name: string): boolean {
  return SKIP_PATTERNS.some((p) => name.toLowerCase().includes(p.toLowerCase()))
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Alle Videos direkt von Wistia holen
  const wistiaVideos: WistiaMedia[] = []
  for (let page = 1; page <= 5; page++) {
    const res = await fetch(
      `https://api.wistia.com/v1/medias.json?api_password=${process.env.WISTIA_API_KEY}&per_page=100&page=${page}`,
      { next: { revalidate: 3600 } }, // 1h Cache
    )
    const batch: WistiaMedia[] = await res.json()
    if (!Array.isArray(batch) || batch.length === 0) break
    wistiaVideos.push(...batch)
    if (batch.length < 100) break
  }

  // Kategorien aus knowledge_base laden (für Videos die schon transkribiert sind)
  const { data: kbData } = await supabase
    .from('knowledge_base')
    .select('video_id, source')
    .eq('chunk_index', 0)
    .eq('is_active', true)

  const categoryMap: Record<string, string[]> = {}
  for (const row of kbData ?? []) {
    const tags = (row.source ?? '')
      .split(',')
      .map((s: string) => s.trim())
      .filter((s: string) => s && s !== 'wistia')
    if (tags.length > 0) {
      categoryMap[row.video_id] = tags
    }
  }

  // Videos filtern und aufbereiten
  const videos = wistiaVideos
    .filter((v) => !shouldSkip(v.name))
    .filter((v) => (v.duration ?? 0) >= 60) // Min. 1 Minute
    .map((v) => ({
      id: String(v.id),
      hashedId: v.hashed_id,
      title: v.name,
      duration: (v.duration ?? 0) / 60, // Sekunden → Minuten
      thumbnail: v.thumbnail?.url ?? null,
      categories: categoryMap[String(v.id)] ?? [],
      created: v.created,
    }))
    .sort((a, b) => a.title.localeCompare(b.title, 'de'))

  // Nach Kategorie gruppieren
  const categorized: Record<string, typeof videos> = {}

  for (const v of videos) {
    if (v.categories.length === 0) {
      if (!categorized['other']) categorized['other'] = []
      categorized['other'].push(v)
    } else {
      for (const tag of v.categories) {
        if (!categorized[tag]) categorized[tag] = []
        categorized[tag].push(v)
      }
    }
  }

  // Live Calls als eigene Kategorie erkennen
  const liveCallVideos = videos.filter(
    (v) => v.title.toLowerCase().includes('live call') ||
           v.title.toLowerCase().includes('live spezial') ||
           v.title.toLowerCase().includes('recording'),
  )
  if (liveCallVideos.length > 0) {
    categorized['live-calls'] = liveCallVideos
  }

  const categoryOrder = [
    'herr-tech', 'ai-prompt', 'content-hook',
    'funnel-monetization', 'business-coach', 'personal-growth',
    'live-calls', 'other',
  ]

  const result = categoryOrder
    .filter((cat) => categorized[cat] && categorized[cat].length > 0)
    .map((cat) => ({
      id: cat,
      label: CATEGORY_LABELS[cat] ?? (cat === 'live-calls' ? 'Live Calls' : 'Sonstiges'),
      emoji: CATEGORY_EMOJIS[cat] ?? (cat === 'live-calls' ? '📡' : '📂'),
      videos: categorized[cat],
    }))

  return NextResponse.json({
    total: videos.length,
    categories: result,
  })
}
