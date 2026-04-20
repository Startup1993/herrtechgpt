import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const SKIP_PATTERNS = [
  'Skool_Intro', 'Masterclass_Intro', 'SkoolVideo',
  'street_interview', 'A_nerd', 'I never pay',
  'Referenz', 'Empfehlung', 'KIMarketingClub',
]

/** Skool-Ordner in exakter Reihenfolge */
const SKOOL_FOLDER_ORDER = [
  'Einfach starten - Der rote Faden!',
  'KI Marketing Course',
  'KI Content Erstellung',
  'Seedance 2.0',
  'Claude',
  'KI Vertrieb',
  'KI Telefonie',
  'Rechtliche Grenzen von KI',
  'Viralen Content finden & Automatisieren',
  'Viral mit Veo3',
  'Super Viral mit SORA 2',
  'KI Agenten & Automatisierung',
  'Zur Prompt Legende werden',
  'KI SEO',
  'KI Toolboard',
  'KI Musik',
  'Passives Einkommen mit KI',
  'Community Wünsche',
  'Aufzeichnungen der Live Calls',
]

/**
 * Explizite Zuordnung: Wistia-Projektname → Skool-Kursname
 * Mehrere Wistia-Projekte können in denselben Skool-Ordner gemappt werden.
 */
const WISTIA_TO_SKOOL: Record<string, string> = {
  // Module → Skool-Kurse
  'Modul 1 - KI Marketing':          'KI Marketing Course',
  'Modul 2 - KI Content Erstellung': 'KI Content Erstellung',
  'Modul 3 - KI Vertrieb':           'KI Vertrieb',

  // Exakte / nahe Matches
  'KI Telefonie':                     'KI Telefonie',
  'Rechtliche Grenzen von KI':        'Rechtliche Grenzen von KI',
  'KI Musik':                         'KI Musik',
  'Passives Einkommen mit KI':        'Passives Einkommen mit KI',
  'Community Wünsche':                'Community Wünsche',

  // Umbenennungen Wistia → Skool
  'KI Agenten':                       'KI Agenten & Automatisierung',
  'Automatisierung':                  'KI Agenten & Automatisierung',
  'Live Calls':                       'Aufzeichnungen der Live Calls',
  'KI im SEO':                        'KI SEO',
  'Toolboard':                        'KI Toolboard',
  'Prompting':                        'Zur Prompt Legende werden',
  'Veo3':                             'Viral mit Veo3',
  'Sora2':                            'Super Viral mit SORA 2',
  'Content Automatisierung':          'Viralen Content finden & Automatisieren',
  'Social Media':                     'Viralen Content finden & Automatisieren',

  // Einfach starten
  'Just start!':                      'Einfach starten - Der rote Faden!',
  'Willkommen zum KI Marketing Club!':'Einfach starten - Der rote Faden!',

  // Weitere Zuordnungen
  'AI Video Creations':               'Seedance 2.0',
  'Anleitung Adobe Express':          'KI Content Erstellung',
  'Viral mit KI Musik':               'KI Musik',
  'Webseite':                         'KI Marketing Course',
  'Landingpage':                      'KI Marketing Course',
  'Kunden':                           'KI Vertrieb',
  'Webinar 14.04.2026':               'Aufzeichnungen der Live Calls',
}

/** Findet den passenden Skool-Ordner für einen Wistia-Projektnamen */
function matchSkoolFolder(wistiaName: string): { name: string; order: number } | null {
  const decoded = decodeEntities(wistiaName).trim()
  const skoolName = WISTIA_TO_SKOOL[decoded]
  if (!skoolName) return null

  const order = SKOOL_FOLDER_ORDER.indexOf(skoolName)
  if (order === -1) return null

  return { name: skoolName, order }
}

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

  // ── Beschreibungen aus Supabase laden ──────────────────────────────────
  const { data: descRows } = await supabase
    .from('video_descriptions')
    .select('video_id, description')
  const descMap: Record<string, string> = {}
  for (const d of descRows ?? []) {
    descMap[d.video_id] = d.description
  }

  // ── Videos filtern + nach Skool-Ordner gruppieren ──────────────────────
  const filtered = wistiaVideos
    .filter((v) => !shouldSkip(v.name))
    .filter((v) => (v.duration ?? 0) >= 60)

  // Nach Skool-Ordner gruppieren (nur Videos deren Wistia-Projekt einem Skool-Ordner entspricht)
  const folderMap: Record<string, {
    id: number
    name: string
    order: number
    videos: Array<{
      id: string
      hashedId: string
      title: string
      description: string | null
      duration: number
      thumbnail: string | null
      date: string | null
    }>
  }> = {}

  for (const v of filtered) {
    const projName = v.project?.name ?? ''
    const match = matchSkoolFolder(projName)
    if (!match) continue // Wistia-Ordner nicht in Skool → ausblenden

    const key = match.name

    if (!folderMap[key]) {
      folderMap[key] = {
        id: v.project?.id ?? 0,
        name: match.name,
        order: match.order,
        videos: [],
      }
    }

    folderMap[key].videos.push({
      id: String(v.id),
      hashedId: v.hashed_id,
      title: decodeEntities(v.name),
      description: descMap[String(v.id)] ?? null,
      duration: Math.round((v.duration ?? 0) / 60),
      thumbnail: hdThumbnail(v.thumbnail?.url),
      date: v.created ? v.created.split('T')[0] : null,
    })
  }

  // Sortierung nach Skool-Reihenfolge
  const folders = Object.values(folderMap)
    .filter((f) => f.videos.length > 0)
    .sort((a, b) => a.order - b.order)
    .map(({ order: _order, ...f }) => ({
      ...f,
      // Standard: nach Datum (neueste zuerst), Frontend kann umsortieren
      videos: f.videos.sort((a, b) => {
        if (!a.date && !b.date) return 0
        if (!a.date) return 1
        if (!b.date) return -1
        return b.date.localeCompare(a.date)
      }),
    }))

  const totalInFolders = folders.reduce((n, f) => n + f.videos.length, 0)

  return NextResponse.json({
    total: totalInFolders,
    folders,
  })
}
