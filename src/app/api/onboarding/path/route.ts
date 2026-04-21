import { NextRequest, NextResponse } from 'next/server'
import { createAnthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { agents } from '@/lib/agents'

export const maxDuration = 60

interface QuizAnswers {
  experience_level: string
  primary_goal: string
  weekly_time: string
  biggest_challenge: string
  background?: string
  market?: string
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const answers = (await req.json()) as QuizAnswers

  // Lade alle verfügbaren Videos aus der Wissensbasis (nur 1 Chunk pro Video als Preview)
  const { data: videos } = await supabase
    .from('knowledge_base')
    .select('video_id, video_name, chunk_text, source, duration_minutes')
    .eq('is_active', true)
    .eq('chunk_index', 0)
    .limit(100)

  const videoCatalog = (videos ?? []).map((v) => ({
    id: v.video_id,
    title: v.video_name,
    preview: (v.chunk_text ?? '').slice(0, 300),
    duration: v.duration_minutes,
    tags: (v.source ?? '').split(',').filter((s: string) => s && s !== 'wistia'),
  }))

  const agentList = agents.map((a) => ({
    id: a.id,
    name: a.name,
    description: a.description,
    bestFor: a.bestFor,
  }))

  const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

  const prompt = `Du bist ein persönlicher KI-Lerncoach. Ein neues Community-Mitglied hat gerade das Onboarding-Quiz ausgefüllt. Erstelle einen individuellen Lernpfad der sofort überblickbar und motivierend ist — nicht überfordernd.

QUIZ-ANTWORTEN:
- Erfahrungslevel mit KI: ${answers.experience_level}
- Wichtigstes Ziel (nächste 90 Tage): ${answers.primary_goal}
- Zeit pro Woche: ${answers.weekly_time}
- Größte Hürde aktuell: ${answers.biggest_challenge}
${answers.background ? `- Hintergrund: ${answers.background}` : ''}
${answers.market ? `- Nische: ${answers.market}` : ''}

VERFÜGBARE VIDEOS (Community-Wissensbasis):
${JSON.stringify(videoCatalog, null, 2)}

VERFÜGBARE KI-ASSISTENTEN:
${JSON.stringify(agentList, null, 2)}

Deine Aufgabe:
1. Wähle genau 5–7 Videos aus, die für DIESE Person am relevantesten sind — in der richtigen Reihenfolge (Grundlagen zuerst, dann fortgeschritten).
2. Empfehle 2–3 Assistenten, die sofort helfen.
3. Erstelle einen 30/60/90-Tage-Plan mit konkreten Meilensteinen — jeweils 2–3 Bullet Points pro Phase.
4. Schreibe eine persönliche Begrüßung (1–2 Sätze), die Bezug auf die Antworten nimmt.

Antworte NUR mit valid JSON in diesem Format:
{
  "greeting": "Persönliche Begrüßung, max. 2 Sätze",
  "focus_summary": "In 1 Satz: Worauf sollte sich diese Person die nächsten 90 Tage fokussieren?",
  "videos": [
    { "id": "videoId", "title": "Video-Titel", "why": "Warum genau dieses Video für dich, 1 Satz" }
  ],
  "agents": [
    { "id": "agent-id", "why": "Warum dieser Assistent für dich, 1 Satz" }
  ],
  "milestones": {
    "30": ["Meilenstein 1", "Meilenstein 2"],
    "60": ["Meilenstein 1", "Meilenstein 2"],
    "90": ["Meilenstein 1", "Meilenstein 2"]
  }
}`

  const { text } = await generateText({
    model: anthropic('claude-sonnet-4-5-20250929'),
    messages: [{ role: 'user', content: prompt }],
  })

  let learningPath
  try {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    learningPath = JSON.parse(cleaned)
  } catch {
    return NextResponse.json({ error: 'Parse error', raw: text }, { status: 500 })
  }

  // Speichere Quiz-Antworten und generierten Pfad
  await supabase
    .from('profiles')
    .update({
      experience_level: answers.experience_level,
      primary_goal: answers.primary_goal,
      weekly_time: answers.weekly_time,
      biggest_challenge: answers.biggest_challenge,
      learning_path: learningPath,
      learning_path_generated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  return NextResponse.json(learningPath)
}
