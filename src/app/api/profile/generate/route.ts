import { createAnthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { field, currentProfile } = await req.json()

  const fieldLabels: Record<string, string> = {
    background: 'Hintergrund',
    market: 'Markt',
    target_audience: 'Zielgruppe',
    offer: 'Angebot',
  }

  const fieldLabel = fieldLabels[field] || field

  const anthropic = createAnthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })

  const { text } = await generateText({
    model: anthropic('claude-sonnet-4-20250514'),
    system:
      'Du bist ein Experte für Immobilienmakler-Positionierung im deutschsprachigen Raum (DACH). Generiere einen professionellen, konkreten Vorschlag für das angegebene Profilfeld. Der Text soll spezifisch und praxisnah sein, nicht generisch. Antworte nur mit dem generierten Text, ohne Erklärungen oder Anführungszeichen.',
    prompt: `Generiere einen Vorschlag für das Feld "${fieldLabel}" eines Immobilienmakler-Profils.

Bereits ausgefüllte Felder:
- Hintergrund: ${currentProfile.background || '(noch nicht ausgefüllt)'}
- Markt: ${currentProfile.market || '(noch nicht ausgefüllt)'}
- Zielgruppe: ${currentProfile.target_audience || '(noch nicht ausgefüllt)'}
- Angebot: ${currentProfile.offer || '(noch nicht ausgefüllt)'}

Generiere einen passenden, konkreten Text für das Feld "${fieldLabel}".`,
  })

  return Response.json({ text })
}
