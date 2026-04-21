import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import type { TranscriptSegment, SceneAnalysis } from '@/lib/video/types'

export async function POST(req: NextRequest) {
  try {
    const { segments, videoTitle } = await req.json() as {
      segments: TranscriptSegment[]
      videoTitle?: string
    }

    if (!segments?.length) {
      return NextResponse.json({ error: 'Keine Transkript-Segmente' }, { status: 400 })
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })

    const transcriptText = segments
      .map((s) => `[${s.start.toFixed(1)}s - ${s.end.toFixed(1)}s] ${s.text}`)
      .join('\n')

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `Du bist ein präziser Video-Editor für Social Media. Du bekommst ein Transkript mit Zeitstempeln.

${videoTitle ? `VIDEO: "${videoTitle}"` : ''}

TRANSKRIPT:
${transcriptText}

AUFGABE: Analysiere jedes Segment. Entscheide: BEHALTEN oder SCHNEIDEN.

SCHNEIDEN wenn: Doppelter Take, Stottern, Füllwörter, Neustart, schwacher Anfang, unvollständige Sätze.
BEHALTEN wenn: Klare Aussage, Hook, Call-to-Action, einzigartige Info, letzter/bester Take.

Gib ein highlightScore (1-10) für jedes Segment: 10 = absoluter Hook, 1 = filler.

Antworte als JSON-Array:
[
  {
    "sceneId": "scene_1",
    "startTime": 0.0,
    "endTime": 3.5,
    "description": "Kurzbeschreibung",
    "suggestedCut": false,
    "cutReason": "nur wenn suggestedCut=true",
    "highlightScore": 7
  }
]

NUR das JSON-Array, kein Markdown, kein Text drumherum.`,
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''

    // Parse JSON from response
    let scenes: SceneAnalysis[] = []
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        scenes = JSON.parse(jsonMatch[0])
      }
    } catch {
      console.error('JSON parse error:', text.substring(0, 200))
      return NextResponse.json({ error: 'KI-Antwort konnte nicht geparst werden' }, { status: 500 })
    }

    return NextResponse.json({ scenes })
  } catch (error) {
    console.error('Analyse-Fehler:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analyse fehlgeschlagen' },
      { status: 500 }
    )
  }
}
