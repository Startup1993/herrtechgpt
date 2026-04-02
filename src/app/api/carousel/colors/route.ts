import { NextRequest, NextResponse } from 'next/server'
import { createAnthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { description } = await req.json()
  const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

  const { text } = await generateText({
    model: anthropic('claude-sonnet-4-20250514'),
    messages: [{
      role: 'user',
      content: `Analysiere diese Markenbeschreibung und gib 3 passende Hex-Farben zurück.

Beschreibung: "${description}"

Gib NUR valides JSON zurück:
{
  "primaryColor": "#hex",
  "bgColor": "#hex",
  "textColor": "#hex"
}

Regeln:
- primaryColor: die Hauptmarkenfarbe / Akzentfarbe
- bgColor: Hintergrund (meist #ffffff oder sehr hell)
- textColor: Textfarbe (meist #111111 oder dunkel)`,
    }],
  })

  try {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return NextResponse.json(JSON.parse(cleaned))
  } catch {
    return NextResponse.json({ primaryColor: '#7c3aed', bgColor: '#ffffff', textColor: '#111111' })
  }
}
