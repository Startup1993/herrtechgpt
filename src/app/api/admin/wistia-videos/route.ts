import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

interface WistiaMedia {
  id: number
  hashed_id: string
  name: string
  duration?: number
  created: string
  thumbnail?: { url: string }
}

const SKIP_PATTERNS = [
  'Skool_Intro', 'Masterclass_Intro', 'SkoolVideo',
  'street_interview', 'A_nerd', 'I never pay',
  'Referenz', 'Empfehlung', 'KIMarketingClub',
]

function shouldSkip(name: string): boolean {
  return SKIP_PATTERNS.some((p) => name.toLowerCase().includes(p.toLowerCase()))
}

// Returns all Wistia videos with assignment info (which module they belong to)
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const wistiaKey = process.env.WISTIA_API_KEY
  if (!wistiaKey) return NextResponse.json({ videos: [], assigned: {}, error: 'WISTIA_API_KEY not set' })

  // Fetch all Wistia videos
  const wistiaVideos: WistiaMedia[] = []
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

  const filtered = wistiaVideos
    .filter(v => !shouldSkip(v.name))
    .filter(v => (v.duration ?? 0) >= 60)
    .map(v => ({
      hashedId: v.hashed_id,
      title: v.name,
      duration: v.duration ?? 0,
      thumbnail: v.thumbnail?.url ?? null,
    }))
    .sort((a, b) => a.title.localeCompare(b.title, 'de'))

  // Get assignments
  const admin = createAdminClient()
  const { data: assignedVideos } = await admin
    .from('module_videos')
    .select('wistia_hashed_id, module_id')

  const assigned: Record<string, string> = {}
  assignedVideos?.forEach(v => {
    assigned[v.wistia_hashed_id] = v.module_id
  })

  return NextResponse.json({ videos: filtered, assigned, total: filtered.length })
}
