/**
 * Slack-Benachrichtigungen fürs Coaching-Cockpit.
 * Ein Incoming-Webhook auf den Coaching-Channel, URL in SLACK_COACHING_WEBHOOK_URL.
 * Fehlt die Variable, passiert nichts (kein Fehler, kein Mail-Ersatz hier).
 */

export function slackConfigured(): boolean {
  return !!process.env.SLACK_COACHING_WEBHOOK_URL
}

export async function postCoachingSlack(text: string, blocks?: unknown[]): Promise<boolean> {
  const url = process.env.SLACK_COACHING_WEBHOOK_URL
  if (!url) return false
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(blocks ? { text, blocks } : { text }),
    })
    return res.ok
  } catch (err) {
    console.error('[coaching] Slack-Post fehlgeschlagen:', err)
    return false
  }
}

export function mrkdwnEscape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
