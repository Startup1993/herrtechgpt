import { createAnthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'

export async function GET() {
  const key = process.env.ANTHROPIC_API_KEY

  try {
    const anthropic = createAnthropic({ apiKey: key })

    const { text } = await generateText({
      model: anthropic('claude-sonnet-4-5-20250929'),
      prompt: 'Say "Hello"',
    })

    return Response.json({ success: true, model: 'claude-sonnet-4-5-20250929', text })
  } catch {
    // Try claude-3-5-sonnet
    try {
      const anthropic = createAnthropic({ apiKey: key })

      const { text } = await generateText({
        model: anthropic('claude-3-5-sonnet-20241022'),
        prompt: 'Say "Hello"',
      })

      return Response.json({ success: true, model: 'claude-3-5-sonnet-20241022', text })
    } catch (e2: unknown) {
      const error = e2 as Error & { status?: number; body?: unknown }
      return Response.json({
        success: false,
        error: error.message,
        status: error.status,
        body: error.body,
      }, { status: 500 })
    }
  }
}
