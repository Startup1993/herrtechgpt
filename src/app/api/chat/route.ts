import { streamText, generateText, UIMessage } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createClient } from '@/lib/supabase/server'
import { getAgent } from '@/lib/agents'

export const maxDuration = 60

export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const body = await req.json()

  // AI SDK v6 TextStreamChatTransport sends: { messages, ...body }
  // where body fields come from the transport config
  const agentId = body.agentId
  const conversationId = body.conversationId
  const rawMessages: UIMessage[] = body.messages ?? []

  const generalAgent = {
    id: 'general',
    systemPrompt: 'Du bist ein hilfreicher AI-Assistent für Immobilienprofis im deutschsprachigen Raum (DACH). Du kannst bei allen Themen rund um Immobilien helfen — von Marktfragen über Marketing bis hin zu rechtlichen Grundlagen. Antworte professionell, praxisnah und auf Deutsch.',
  }

  const agent = agentId === 'general' ? generalAgent : getAgent(agentId)
  if (!agent) {
    return new Response('Agent not found', { status: 404 })
  }

  // Convert UIMessage format to simple role/content for streamText
  const messages = rawMessages.map((msg) => {
    let content = ''
    const msgAny = msg as unknown as { content?: string; parts?: Array<{ type: string; text?: string }> }
    if (typeof msgAny.content === 'string' && msgAny.content) {
      content = msgAny.content
    } else if (Array.isArray(msgAny.parts)) {
      content = msgAny.parts
        .filter((p) => p.type === 'text' && p.text)
        .map((p) => p.text!)
        .join('')
    }
    return {
      role: msg.role as 'user' | 'assistant',
      content,
    }
  }).filter((msg) => msg.content.length > 0)

  if (messages.length === 0) {
    return new Response('No messages', { status: 400 })
  }

  // Load user profile for context injection
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Build system prompt with profile context
  let profileContext = ''
  if (profile) {
    const parts = []
    if (profile.background) parts.push(`Hintergrund: ${profile.background}`)
    if (profile.market) parts.push(`Markt: ${profile.market}`)
    if (profile.target_audience)
      parts.push(`Zielgruppe: ${profile.target_audience}`)
    if (profile.offer) parts.push(`Angebot: ${profile.offer}`)
    if (profile.platforms?.length)
      parts.push(`Aktive Plattformen: ${profile.platforms.join(', ')}`)

    if (parts.length > 0) {
      profileContext = `\n\n--- Nutzerprofil ---\n${parts.join('\n')}\n--- Ende Nutzerprofil ---\n\nBerücksichtige dieses Nutzerprofil in all deinen Antworten. Passe deine Empfehlungen, Texte und Ratschläge an den Hintergrund, Markt, die Zielgruppe und das Angebot des Nutzers an.`
    }
  }

  const fullSystemPrompt = agent.systemPrompt + profileContext

  const anthropic = createAnthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })

  const lastUserMessage = messages[messages.length - 1]

  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    system: fullSystemPrompt,
    messages,
    onFinish: async ({ text }) => {
      // Persist messages
      if (lastUserMessage?.role === 'user') {
        await supabase.from('messages').insert({
          conversation_id: conversationId,
          role: 'user',
          content: lastUserMessage.content,
        })
      }

      await supabase.from('messages').insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: text,
      })

      // Update conversation timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId)

      // Auto-generate title after first exchange
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conversationId)

      if (count && count <= 2) {
        try {
          const { text: title } = await generateText({
            model: anthropic('claude-sonnet-4-20250514'),
            system:
              'Generiere einen sehr kurzen Titel (3-5 Wörter, auf Deutsch) für diese Unterhaltung basierend auf der ersten Nachricht des Nutzers. Antworte nur mit dem Titel, ohne Anführungszeichen.',
            prompt: lastUserMessage.content,
          })

          await supabase
            .from('conversations')
            .update({ title: title.trim() })
            .eq('id', conversationId)
        } catch {
          // Title generation is optional
        }
      }
    },
  })

  return result.toTextStreamResponse()
}
