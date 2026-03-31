import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

export const maxDuration = 60

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'OpenAI API Key nicht konfiguriert' }, { status: 500 })

  try {
    const formData = await request.formData()
    const file = formData.get('video') as File | null
    if (!file) return NextResponse.json({ error: 'Keine Datei hochgeladen' }, { status: 400 })

    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: 'Datei zu groß (max. 25 MB)' }, { status: 400 })
    }

    const openai = new OpenAI({ apiKey })

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      response_format: 'verbose_json',
      language: 'de',
    })

    return NextResponse.json({
      text: transcription.text,
      segments: (transcription as { segments?: { start: number; end: number; text: string }[] }).segments ?? [],
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Transkription fehlgeschlagen'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
