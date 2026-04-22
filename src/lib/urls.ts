// Alle ausgehenden E-Mails (Einladungen, Ticket-Benachrichtigungen, Branding-Links)
// zeigen immer auf die Live-Domain — unabhängig davon, von welcher Umgebung aus sie
// versendet werden. So landen User und Admins nie versehentlich auf Staging/Preview.
export const PRODUCTION_URL = 'https://world.herr.tech'
