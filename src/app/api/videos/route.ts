import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const SKIP_PATTERNS = [
  'Skool_Intro', 'Masterclass_Intro', 'SkoolVideo',
  'street_interview', 'A_nerd', 'I never pay',
  'Referenz', 'Empfehlung', 'KIMarketingClub',
]

const SKIP_PROJECTS = ['Stuff', 'Untitled Folder']

interface WistiaMedia {
  id: number
  hashed_id: string
  name: string
  duration?: number
  created: string
  updated: string
  thumbnail?: { url: string }
  project?: { id: number; name: string }
}

function shouldSkip(name: string): boolean {
  return SKIP_PATTERNS.some((p) => name.toLowerCase().includes(p.toLowerCase()))
}

/** Wistia Thumbnail URL auf höhere Auflösung bringen */
function hdThumbnail(url: string | undefined): string | null {
  if (!url) return null
  // Ersetze die Crop-Größe von 200x120 auf 640x360
  return url.replace(/image_crop_resized=\d+x\d+/, 'image_crop_resized=640x360')
}

/** HTML Entities dekodieren (&amp; → &, etc.) */
function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // ── Wistia-Videos holen ─────────────────────────────────────────────────
  const wistiaKey = process.env.WISTIA_API_KEY
  let wistiaVideos: WistiaMedia[] = []

  if (wistiaKey) {
    try {
      for (let page = 1; page <= 5; page++) {
        const res = await fetch(
          `https://api.wistia.com/v1/medias.json?api_password=${wistiaKey}&per_page=100&page=${page}`,
          { next: { revalidate: 3600 } },
        )
        if (!res.ok) break
        const batch: WistiaMedia[] = await res.json()
        if (!Array.isArray(batch) || batch.length === 0) break
        wistiaVideos.push(...batch)
        if (batch.length < 100) break
      }
    } catch {
      // Fallback unten
    }
  }

  // ── Fallback: knowledge_base wenn kein Wistia ─────────────────────────
  if (wistiaVideos.length === 0) {
    const { data: kbVideos } = await supabase
      .from('knowledge_base')
      .select('video_id, video_name, source, duration_minutes')
      .eq('is_active', true)
      .eq('chunk_index', 0)
      .order('video_name')

    const fallbackVideos = (kbVideos ?? []).map((v) => ({
      id: v.video_id,
      hashedId: v.video_id,
      title: v.video_name,
      duration: v.duration_minutes,
      thumbnail: null as string | null,
      date: null as string | null,
      categories: (v.source ?? '').split(',').filter((s: string) => s && s !== 'wistia'),
    }))

    return NextResponse.json({
      total: fallbackVideos.length,
      folders: [{ id: 'all', name: 'Alle Videos', emoji: '📂', videos: fallbackVideos }],
    })
  }

  // ── Videos filtern + nach Wistia-Ordner gruppieren ────────────────────
  const filtered = wistiaVideos
    .filter((v) => !shouldSkip(v.name))
    .filter((v) => (v.duration ?? 0) >= 60)
    .filter((v) => {
      const projName = v.project?.name ?? ''
      return !SKIP_PROJECTS.some((s) => projName.startsWith(s))
    })

  // Nach Projekt-ID gruppieren
  const folderMap: Record<string, {
    id: number
    name: string
    videos: Array<{
      id: string
      hashedId: string
      title: string
      duration: number
      thumbnail: string | null
      date: string | null
    }>
  }> = {}

  for (const v of filtered) {
    const projId = String(v.project?.id ?? 'other')
    const projName = v.project?.name ?? 'Sonstiges'

    if (!folderMap[projId]) {
      folderMap[projId] = {
        id: v.project?.id ?? 0,
        name: decodeEntities(projName),
        videos: [],
      }
    }

    folderMap[projId].videos.push({
      id: String(v.id),
      hashedId: v.hashed_id,
      title: decodeEntities(v.name),
      duration: Math.round((v.duration ?? 0) / 60),
      thumbnail: hdThumbnail(v.thumbnail?.url),
      date: v.created ? v.created.split('T')[0] : null,
    })
  }

  // Ordner sortieren: erst Module (numerisch), dann Themen, dann Live Calls am Ende
  const folderOrder = (name: string): number => {
    if (name.startsWith('Modul ')) return 0
    if (name === 'Live Calls') return 99
    if (name === 'Sonstiges') return 100
    return 50
  }

  const folders = Object.values(folderMap)
    .filter((f) => f.videos.length > 0)
    .sort((a, b) => {
      const orderDiff = folderOrder(a.name) - folderOrder(b.name)
      if (orderDiff !== 0) return orderDiff
      return a.name.localeCompare(b.name, 'de')
    })
    .map((f) => ({
      ...f,
      videos: f.videos.sort((a, b) => a.title.localeCompare(b.title, 'de')),
    }))

  return NextResponse.json({
    total: filtered.length,
    folders,
  })
}
