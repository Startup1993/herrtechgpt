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
    systemPrompt: 'Du bist Herr Tech — ein hilfreicher KI-Assistent für Creator und Online-Unternehmer im deutschsprachigen Raum. Du hilfst bei allen Themen rund um Online Business, KI-Tools, Content, Marketing und persönliches Wachstum. Antworte direkt, praxisnah und auf Deutsch.',
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

  // RAG: Search community knowledge base for relevant content
  const lastQuery = messages[messages.length - 1]?.content ?? ''
  let knowledgeContext = ''
  if (lastQuery.length > 10) {
    try {
      // Extract keywords from the query (remove short words)
      const searchTerms = lastQuery
        .replace(/[^\w\säöüÄÖÜß]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 3)
        .slice(0, 8)
        .join(' | ')

      if (searchTerms) {
        const { data: knowledgeChunks } = await supabase
          .from('knowledge_base')
          .select('chunk_text, video_name')
          .eq('is_active', true)
          .textSearch('chunk_text', searchTerms)
          .limit(4)

        if (knowledgeChunks && knowledgeChunks.length > 0) {
          const context = knowledgeChunks
            .map((row) => `[Quelle: ${row.video_name}]\n${row.chunk_text}`)
            .join('\n\n---\n\n')

          knowledgeContext = `\n\n--- Relevantes Community-Wissen ---\n${context}\n--- Ende Community-Wissen ---\n\nDieses Wissen stammt aus unseren Community-Kursen. Beziehe es in deine Antwort mit ein, wenn es relevant ist. Zitiere die Quelle wenn passend.`
        }
      }
    } catch {
      // Knowledge search is optional — chat works without it
    }
  }

  const fullSystemPrompt = agent.systemPrompt + profileContext + knowledgeContext

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
