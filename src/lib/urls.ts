// Alle ausgehenden E-Mails (Einladungen, Ticket-Benachrichtigungen, Branding-Links)
// zeigen immer auf die Live-Domain — unabhängig davon, von welcher Umgebung aus sie
// versendet werden. So landen User und Admins nie versehentlich auf Staging/Preview.
export const PRODUCTION_URL = 'https://world.herr.tech'

/**
 * Gibt die Basis-URL der aktuellen Umgebung zurück (für Checkout-Redirects,
 * Webhook-URLs etc.). Reihenfolge:
 *   1. NEXT_PUBLIC_APP_URL (explizit gesetzt)
 *   2. VERCEL_URL (automatisch auf Vercel Preview-Deployments)
 *   3. PRODUCTION_URL als Fallback
 *
 * Im Unterschied zu PRODUCTION_URL bleibt ein Staging-User auf Staging nach
 * dem Checkout — das ist beim Testen wichtig.
 */
export function getAppUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL
  if (explicit) return explicit.replace(/\/$/, '')

  const vercel = process.env.VERCEL_URL
  if (vercel) return `https://${vercel}`

  return PRODUCTION_URL
}
