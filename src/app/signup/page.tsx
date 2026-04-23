import { redirect } from 'next/navigation'

/**
 * Legacy-Route /signup — wurde mit dem Unified-Auth-Flow überflüssig
 * (siehe /login: legt bei unbekannter Email automatisch Account an).
 * Redirect bewahrt alte externe Links (z.B. aus E-Mails, Anzeigen).
 */
export default function SignupPage() {
  redirect('/login')
}
