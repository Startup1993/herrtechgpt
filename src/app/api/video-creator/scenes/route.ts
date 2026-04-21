import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(req: NextRequest) {
  try {
    const { prompt, sceneCount } = await req.json() as {
      prompt: string
      sceneCount?: number
    }

    if (!prompt?.trim()) {
      return NextResponse.json({ error: 'Prompt erforderlich' }, { status: 400 })
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })

    const count = sceneCount ?? 6

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `Du bist ein kreativer Video-Regisseur. Erstelle ein Szenen-Skript für ein kurzes Social-Media Video.

THEMA / PROMPT:
${prompt}

Erstelle genau ${count} Szenen. Jede Szene hat:
- title: Kurzer Szenen-Titel
- description: Was in der Szene visuell passiert (1-2 Sätze)
- voiceover: Der gesprochene Text für diese Szene (1-2 Sätze, natürlich, auf Deutsch)
- imagePrompt: Ein detaillierter englischer Prompt für ein KI-Bildgenerator (Stil: modern, clean, professional)
- durationSeconds: Empfohlene Dauer in Sekunden (3-8)

Die erste Szene sollte ein starker Hook sein. Die letzte Szene ein Call-to-Action.

Antworte NUR als JSON-Array:
[
  {
    "title": "Hook",
    "description": "...",
    "voiceover": "...",
    "imagePrompt": "...",
    "durationSeconds": 5
  }
]`,
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''

    let scenes = []
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        scenes = JSON.parse(jsonMatch[0])
      }
    } catch {
      return NextResponse.json({ error: 'KI-Antwort konnte nicht geparst werden' }, { status: 500 })
    }

    // Add IDs
    scenes = scenes.map((scene: Record<string, unknown>, i: number) => ({
      ...scene,
      id: `scene_${i + 1}`,
      index: i,
      status: 'pending',
    }))

    return NextResponse.json({ scenes })
  } catch (error) {
    console.error('Scene generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Szenen-Generierung fehlgeschlagen' },
      { status: 500 }
    )
  }
}
