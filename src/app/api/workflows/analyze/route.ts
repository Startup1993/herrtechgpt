import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createAnthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'

export const maxDuration = 60

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { transcript, context } = await request.json()
  if (!transcript) return NextResponse.json({ error: 'Kein Transkript' }, { status: 400 })

  const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const systemPrompt = `Du bist ein erfahrener Video-Editor und Content-Stratege. Du analysierst Video-Transkripte und gibst konkrete Empfehlungen für Schnitt, Struktur und visuelle Elemente.`

  const userPrompt = `Analysiere dieses Video-Transkript${context ? ` (Kontext: ${context})` : ''} und gib mir:

1. **Zusammenfassung** (2-3 Sätze was das Video behandelt)
2. **Szenen-Analyse** (liste jede Szene mit Timestamp, Inhalt und Bewertung auf)
3. **Schnitt-Empfehlungen** (welche Teile kürzen, welche betonen)
4. **Hook-Empfehlung** (beste Eröffnungsszene für maximale Aufmerksamkeit)
5. **Titel-Vorschläge** (3 Optionen für verschiedene Plattformen)

Transkript:
${transcript}

Antworte auf Deutsch, strukturiert und praxisnah.`

  const { text } = await generateText({
    model: anthropic('claude-sonnet-4-20250514'),
    system: systemPrompt,
    prompt: userPrompt,
  })

  return NextResponse.json({ analysis: text })
}
