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
      'Du bist ein Experte für Positionierung und Personal Branding für Creator und Online-Unternehmer im deutschsprachigen Raum. Generiere einen professionellen, konkreten Vorschlag für das angegebene Profilfeld. Der Text soll spezifisch und praxisnah sein, nicht generisch. Antworte nur mit dem generierten Text, ohne Erklärungen oder Anführungszeichen.',
    prompt: `Generiere einen Vorschlag für das Feld "${fieldLabel}" eines Creator- und Online-Business-Profils.

Bereits ausgefüllte Felder:
- Hintergrund: ${currentProfile.background || '(noch nicht ausgefüllt)'}
- Business & Nische: ${currentProfile.market || '(noch nicht ausgefüllt)'}
- Zielgruppe: ${currentProfile.target_audience || '(noch nicht ausgefüllt)'}
- Angebote: ${currentProfile.offer || '(noch nicht ausgefüllt)'}

Generiere einen passenden, konkreten Text für das Feld "${fieldLabel}".`,
  })

  return Response.json({ text })
}
