import { NextRequest, NextResponse } from 'next/server'
import { createAnthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 30

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { url } = await req.json()

  // Fetch the website HTML
  let html = ''
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CarouselBot/1.0)' },
      signal: AbortSignal.timeout(8000),
    })
    html = await res.text()
  } catch {
    return NextResponse.json({ error: 'URL konnte nicht geladen werden' }, { status: 400 })
  }

  // Extract all hex colors from HTML/CSS
  const hexMatches = [...html.matchAll(/#([0-9a-fA-F]{6})\b/g)].map(m => m[0])
  const colorFreq: Record<string, number> = {}
  for (const c of hexMatches) {
    const lower = c.toLowerCase()
    // Skip near-white, near-black, grays
    const r = parseInt(lower.slice(1, 3), 16)
    const g = parseInt(lower.slice(3, 5), 16)
    const b = parseInt(lower.slice(5, 7), 16)
    if (r > 240 && g > 240 && b > 240) continue
    if (r < 20 && g < 20 && b < 20) continue
    const isGray = Math.max(r, g, b) - Math.min(r, g, b) < 20
    if (isGray) continue
    colorFreq[lower] = (colorFreq[lower] || 0) + 1
  }

  const topColors = Object.entries(colorFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([color]) => color)

  if (topColors.length === 0) {
    return NextResponse.json({ error: 'Keine Farben gefunden' }, { status: 400 })
  }

  // Let Claude pick the best brand colors from the extracted list
  const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  const { text } = await generateText({
    model: anthropic('claude-sonnet-4-20250514'),
    messages: [{
      role: 'user',
      content: `Du bist ein Branding-Experte. Ich habe diese Farben von der Website "${url}" extrahiert:

${topColors.join(', ')}

Wähle die besten Farben für Instagram-Karussell-Slides aus und gib NUR valides JSON zurück:
{
  "primaryColor": "#hex",
  "bgColor": "#hex",
  "textColor": "#hex",
  "accentColor": "#hex",
  "headlineFont": "Inter",
  "bodyFont": "Inter",
  "headlineFontWeight": "700",
  "bodyFontWeight": "400",
  "lineHeight": "1.6",
  "letterSpacing": "0em",
  "spacious": false,
  "googleFontsQuery": "family=Inter:wght@400;700"
}

Regeln:
- primaryColor: die markanteste Markenfarbe
- bgColor: hell/weiß oder sehr heller Ton
- textColor: dunkel genug für Lesbarkeit
- accentColor: zweite Akzentfarbe für CTA-Slide`,
    }],
  })

  try {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return NextResponse.json(JSON.parse(cleaned))
  } catch {
    return NextResponse.json({ primaryColor: topColors[0], bgColor: '#ffffff', textColor: '#111111', accentColor: topColors[1] ?? topColors[0] })
  }
}
