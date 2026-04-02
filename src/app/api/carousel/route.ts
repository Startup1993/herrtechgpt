import { NextRequest, NextResponse } from 'next/server'
import { createAnthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { blogPost, slideCount = 7, handle = '', refinePrompt, currentSlides } = await req.json()

  const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

  // ── Refine mode: modify existing slides based on a prompt ──────────────────
  if (refinePrompt && currentSlides) {
    const { text } = await generateText({
      model: anthropic('claude-sonnet-4-20250514'),
      messages: [{
        role: 'user',
        content: `Du bist ein Social-Media-Experte. Hier sind die aktuellen Karussell-Slides als JSON:

${JSON.stringify(currentSlides, null, 2)}

Aufgabe: Überarbeite die Slides entsprechend dieser Anweisung:
"${refinePrompt}"

Regeln:
- Behalte die gleiche Anzahl Slides und Slide-Typen (title, content, cta)
- Behalte die JSON-Struktur exakt gleich
- Ändere nur das, was die Anweisung verlangt
- Bullets: max. 8 Wörter pro Punkt

Gib NUR das aktualisierte JSON zurück, kein Text davor oder danach:
{ "slides": [...] }`,
      }],
    })
    try {
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      return NextResponse.json(JSON.parse(cleaned))
    } catch {
      return NextResponse.json({ error: 'Parse error', raw: text }, { status: 500 })
    }
  }

  // ── Generate mode: create slides from blog post ────────────────────────────
  const { text } = await generateText({
    model: anthropic('claude-sonnet-4-20250514'),
    messages: [{
      role: 'user',
      content: `Du bist ein Social-Media-Experte. Strukturiere diesen Text in genau ${slideCount} Instagram-Karussell-Slides.

TEXT:
${blogPost}

Regeln:
- Slide 1: Titel-Slide (type: "title") — starke Headline, kurzer Untertitel
- Slide 2–${slideCount - 1}: Content-Slides (type: "content") — 1 klare Headline + max. 3 kurze Bullet Points (max. 8 Wörter pro Bullet)
- Letzter Slide: CTA (type: "cta") — kurzer Call-to-Action Text + folgen/speichern/teilen Aufforderung

Wichtig: Kurz und prägnant. Kein langer Fließtext. Bullets max. 8 Wörter.

Gib NUR valides JSON zurück, kein Text davor oder danach:
{
  "slides": [
    { "type": "title", "headline": "...", "subtitle": "..." },
    { "type": "content", "headline": "...", "bullets": ["...", "...", "..."] },
    { "type": "cta", "headline": "...", "cta": "...", "handle": "${handle}" }
  ]
}`,
    }],
  })

  try {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const data = JSON.parse(cleaned)
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Parse error', raw: text }, { status: 500 })
  }
}
