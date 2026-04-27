// Gemeinsames HTML-Layout für alle ausgehenden Herr-Tech-World-Mails.
// Konsistentes Branding: Logo zentriert, Primärfarbe #B598E2, kleiner Fallback-Link.

import { PRODUCTION_URL } from './urls'

const LOGO_URL = 'https://kgolrqjkghhwdgoeyppt.supabase.co/storage/v1/object/public/lesson-images/brand/logo.png'

export interface EmailCta {
  label: string
  href: string
}

export interface RenderEmailOptions {
  // Hauptüberschrift ("Dein Login-Link", "Neues Support-Ticket", etc.)
  heading: string
  // Einführungstext direkt unter Heading (plain text oder einfaches HTML).
  intro: string
  // Optionaler CTA-Button.
  cta?: EmailCta
  // Optionaler Kleintext nach CTA (z.B. "Link ist 1 Stunde gültig")
  footerNote?: string
  // Preheader (erscheint in Mail-Client-Preview neben Subject)
  preheader?: string
}

export function renderEmail(opts: RenderEmailOptions): string {
  const preheader = opts.preheader ?? opts.intro.replace(/<[^>]+>/g, '').slice(0, 100)
  const siteUrl = PRODUCTION_URL

  return `<!DOCTYPE html>
<html lang="de">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(opts.heading)}</title>
  </head>
  <body style="margin:0; padding:0; background:#F5F0EB; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <span style="display:none; max-height:0; overflow:hidden; color:transparent;">
      ${escapeHtml(preheader)}
    </span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F5F0EB;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px; width:100%; background:#FFFFFF; border-radius:16px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.04);">
            <tr>
              <td align="center" style="padding:24px 32px; background:#FDFBF7; border-bottom:1px solid #EEE8E0;">
                <a href="${siteUrl}" style="text-decoration:none;">
                  <img src="${LOGO_URL}" alt="Herr Tech World" height="26" style="display:block; height:26px; width:auto; margin:0 auto;">
                </a>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:28px 32px 8px;">
                <h1 style="margin:0 0 12px; font-size:22px; line-height:1.3; color:#0F0F13; font-weight:700; text-align:center;">
                  ${escapeHtml(opts.heading)}
                </h1>
                <div style="font-size:15px; line-height:1.6; color:#444; text-align:center;">
                  ${opts.intro}
                </div>
              </td>
            </tr>
            ${opts.cta ? `
            <tr>
              <td align="center" style="padding:16px 32px 8px;">
                <a href="${opts.cta.href}"
                   style="display:inline-block; background:#B598E2; color:#FFFFFF; padding:12px 28px;
                          border-radius:10px; text-decoration:none; font-weight:600; font-size:15px;">
                  ${escapeHtml(opts.cta.label)}
                </a>
              </td>
            </tr>` : ''}
            ${opts.footerNote ? `
            <tr>
              <td align="center" style="padding:16px 32px 8px;">
                <div style="font-size:11px; line-height:1.5; color:#999; text-align:center;">
                  ${opts.footerNote}
                </div>
              </td>
            </tr>` : ''}
            <tr>
              <td align="center" style="padding:24px 32px 28px; border-top:1px solid #EEE8E0;">
                <div style="font-size:12px; line-height:1.5; color:#999; text-align:center;">
                  Herr Tech World — Deine KI-Plattform für Content, Business &amp; Wachstum.<br>
                  <a href="${siteUrl}" style="color:#B598E2; text-decoration:none;">${siteUrl.replace(/^https?:\/\//, '')}</a>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// ─────────────────────────────────────────────────────────────────────────────
// Newsletter-Launch-Mail: exklusive Einladung für Coming-Soon-Signups.
// Größerer Hero, Feature-Liste, persönliche Note ("Du warst zuerst da").
// Nur für Newsletter-Invites — nicht für generische Admin-Einladungen.
// ─────────────────────────────────────────────────────────────────────────────

export interface NewsletterInviteOptions {
  loginLink: string
}

export function renderNewsletterInviteEmail(opts: NewsletterInviteOptions): string {
  const siteUrl = PRODUCTION_URL
  const preheader = 'Die Herr Tech World ist offen für dich. Ein Klick und du bist drin.'

  return `<!DOCTYPE html>
<html lang="de">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Die Herr Tech World ist offen für dich</title>
  </head>
  <body style="margin:0; padding:0; background:#F5F0EB; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <span style="display:none; max-height:0; overflow:hidden; color:transparent;">
      ${escapeHtml(preheader)}
    </span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F5F0EB;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px; width:100%; background:#FFFFFF; border-radius:16px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.04);">
            <tr>
              <td align="center" style="padding:24px 32px; background:#FDFBF7; border-bottom:1px solid #EEE8E0;">
                <a href="${siteUrl}" style="text-decoration:none;">
                  <img src="${LOGO_URL}" alt="Herr Tech World" height="26" style="display:block; height:26px; width:auto; margin:0 auto;">
                </a>
              </td>
            </tr>

            <tr>
              <td align="left" style="padding:36px 36px 8px;">
                <div style="font-size:12px; letter-spacing:0.18em; text-transform:uppercase; color:#B598E2; font-weight:700; margin-bottom:16px;">
                  Es ist soweit
                </div>
                <h1 style="margin:0 0 16px; font-size:30px; line-height:1.15; color:#0F0F13; font-weight:800; letter-spacing:-0.01em;">
                  Du warst zuerst da.<br>
                  <span style="color:#B598E2;">Jetzt bist du drin.</span>
                </h1>
                <p style="margin:0 0 14px; font-size:16px; line-height:1.6; color:#333;">
                  Hey!
                </p>
                <p style="margin:0 0 14px; font-size:16px; line-height:1.6; color:#333;">
                  Du hast dich eingetragen, als wir noch nicht einmal live waren.
                  Jetzt ist es soweit: Die <strong>Herr Tech World</strong> ist offen —
                  und du bist einer der Ersten, die reindürfen.
                </p>
                <p style="margin:0 0 8px; font-size:16px; line-height:1.6; color:#333;">
                  Was dich drinnen erwartet:
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:4px 36px 24px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="padding:8px 0; font-size:15px; line-height:1.5; color:#333;">
                      🎬&nbsp;&nbsp;<strong>KI Video Creator</strong> — du tippst, die KI dreht.
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0; font-size:15px; line-height:1.5; color:#333;">
                      🎨&nbsp;&nbsp;<strong>Karussell-Generator</strong> — ein Klick, Instagram-Post fertig.
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0; font-size:15px; line-height:1.5; color:#333;">
                      🤖&nbsp;&nbsp;<strong>6 KI-Coaches</strong> trainiert auf Herr Techs Inhalten.
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0; font-size:15px; line-height:1.5; color:#333;">
                      🎓&nbsp;&nbsp;<strong>Classroom</strong> mit allen Lern-Modulen.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:8px 36px 12px;">
                <a href="${opts.loginLink}"
                   style="display:inline-block; background:#B598E2; color:#FFFFFF; padding:16px 40px;
                          border-radius:12px; text-decoration:none; font-weight:700; font-size:16px;">
                  Jetzt in die Herr Tech World
                </a>
                <div style="font-size:13px; color:#999; margin-top:12px;">
                  Ein Klick, und du bist drin. Kein Passwort, kein Formular.
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:20px 36px 8px;">
                <p style="margin:0 0 12px; font-size:15px; line-height:1.6; color:#333;">
                  Dein Flo
                </p>
                <p style="margin:0; font-size:13px; line-height:1.55; color:#666; font-style:italic;">
                  P.S.: Wenn du wissen willst, wie wir das mit Claude gebaut haben —
                  genau das zeigen wir dir im KI Marketing Club. 🚀
                </p>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:24px 32px 28px; margin-top:12px; border-top:1px solid #EEE8E0;">
                <div style="font-size:11px; line-height:1.5; color:#999; text-align:center;">
                  Falls der Button nicht funktioniert, kopiere diesen Link:<br>
                  <span style="word-break:break-all; color:#999;">${opts.loginLink}</span><br><br>
                  Der Link ist zeitlich begrenzt gültig und kann nur einmal verwendet werden.
                </div>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:16px 32px 24px; border-top:1px solid #EEE8E0;">
                <div style="font-size:12px; line-height:1.5; color:#999; text-align:center;">
                  Herr Tech World — Deine KI-Plattform für Content, Business &amp; Wachstum.<br>
                  <a href="${siteUrl}" style="color:#B598E2; text-decoration:none;">${siteUrl.replace(/^https?:\/\//, '')}</a>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin-Einladung (Magic Link): wenn ein Admin einen User manuell hinzufügt.
// Hero-Layout wie die Newsletter-Launch-Mail — warmer, persönlicher Ton.
// ─────────────────────────────────────────────────────────────────────────────

export interface InviteEmailOptions {
  loginLink: string
  firstName?: string | null
}

export function renderInviteEmail(opts: InviteEmailOptions): string {
  const siteUrl = PRODUCTION_URL
  const greeting = opts.firstName ? `Hey ${escapeHtml(opts.firstName)}!` : 'Hey!'
  const preheader = 'Deine Einladung in die Herr Tech World — ein Klick und du bist drin.'

  return `<!DOCTYPE html>
<html lang="de">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Willkommen in der Herr Tech World</title>
  </head>
  <body style="margin:0; padding:0; background:#F5F0EB; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <span style="display:none; max-height:0; overflow:hidden; color:transparent;">
      ${escapeHtml(preheader)}
    </span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F5F0EB;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px; width:100%; background:#FFFFFF; border-radius:16px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.04);">
            <tr>
              <td align="center" style="padding:24px 32px; background:#FDFBF7; border-bottom:1px solid #EEE8E0;">
                <a href="${siteUrl}" style="text-decoration:none;">
                  <img src="${LOGO_URL}" alt="Herr Tech World" height="26" style="display:block; height:26px; width:auto; margin:0 auto;">
                </a>
              </td>
            </tr>

            <tr>
              <td align="left" style="padding:36px 36px 8px;">
                <div style="font-size:12px; letter-spacing:0.18em; text-transform:uppercase; color:#B598E2; font-weight:700; margin-bottom:16px;">
                  Willkommen an Bord
                </div>
                <h1 style="margin:0 0 16px; font-size:30px; line-height:1.15; color:#0F0F13; font-weight:800; letter-spacing:-0.01em;">
                  Deine Einladung in die<br>
                  <span style="color:#B598E2;">Herr Tech World.</span>
                </h1>
                <p style="margin:0 0 14px; font-size:16px; line-height:1.6; color:#333;">
                  ${greeting}
                </p>
                <p style="margin:0 0 14px; font-size:16px; line-height:1.6; color:#333;">
                  Schön, dass du da bist. Du bist eingeladen in die
                  <strong>Herr Tech World</strong> — deine KI-Plattform für Content,
                  Business &amp; Wachstum.
                </p>
                <p style="margin:0 0 8px; font-size:16px; line-height:1.6; color:#333;">
                  Was dich erwartet:
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:4px 36px 24px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="padding:8px 0; font-size:15px; line-height:1.5; color:#333;">
                      🎬&nbsp;&nbsp;<strong>KI Video Creator</strong> — du tippst, die KI dreht.
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0; font-size:15px; line-height:1.5; color:#333;">
                      🎨&nbsp;&nbsp;<strong>Karussell-Generator</strong> — ein Klick, Instagram-Post fertig.
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0; font-size:15px; line-height:1.5; color:#333;">
                      🤖&nbsp;&nbsp;<strong>6 KI-Coaches</strong> trainiert auf Herr Techs Inhalten.
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0; font-size:15px; line-height:1.5; color:#333;">
                      🎓&nbsp;&nbsp;<strong>Classroom</strong> mit über 170 h Lernmaterial.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:8px 36px 12px;">
                <a href="${opts.loginLink}"
                   style="display:inline-block; background:#B598E2; color:#FFFFFF; padding:16px 40px;
                          border-radius:12px; text-decoration:none; font-weight:700; font-size:16px;">
                  Jetzt einloggen
                </a>
                <div style="font-size:13px; color:#999; margin-top:12px;">
                  Ein Klick, und du bist drin. Kein Passwort, kein Formular.
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:20px 36px 8px;">
                <p style="margin:0 0 12px; font-size:15px; line-height:1.6; color:#333;">
                  Dein Flo
                </p>
                <p style="margin:0; font-size:13px; line-height:1.55; color:#666; font-style:italic;">
                  P.S.: Fragen oder Feedback? Schreib einfach im Hilfe-Chat
                  in der Plattform — wir sind für dich da.
                </p>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:24px 32px 16px; margin-top:12px; border-top:1px solid #EEE8E0;">
                <div style="font-size:11px; line-height:1.5; color:#999; text-align:center;">
                  Falls der Button nicht funktioniert, kopiere diesen Link:<br>
                  <span style="word-break:break-all; color:#999;">${opts.loginLink}</span><br><br>
                  Der Link ist zeitlich begrenzt gültig und kann nur einmal verwendet werden.
                </div>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:16px 32px 24px; border-top:1px solid #EEE8E0;">
                <div style="font-size:12px; line-height:1.5; color:#999; text-align:center;">
                  Herr Tech World — Deine KI-Plattform für Content, Business &amp; Wachstum.<br>
                  <a href="${siteUrl}" style="color:#B598E2; text-decoration:none;">${siteUrl.replace(/^https?:\/\//, '')}</a>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

// ─────────────────────────────────────────────────────────────────────────────
// Skool-Mitglieder-Einladung: exklusiv für aktive KI Marketing Club Teilnehmer.
// ─────────────────────────────────────────────────────────────────────────────

export interface SkoolInviteOptions {
  claimLink: string
  firstName?: string | null
  /**
   * Credits-pro-Monat aus dem Plan-S (für die Toolbox-Bullet-Zeile).
   * Optional — fällt auf 200 zurück, falls nicht übergeben.
   */
  creditsPerMonth?: number | null
  /**
   * Mode bestimmt Wording:
   *  - 'active' (default): aktives Club-Mitglied → kostenloser Vollzugriff
   *  - 'alumni': Ex-Club-Mitglied → lebenslanger Classroom-Zugang,
   *    für Tools/Chat wieder beitreten
   */
  mode?: 'active' | 'alumni'
}

export function renderSkoolInviteEmail(opts: SkoolInviteOptions): string {
  if (opts.mode === 'alumni') {
    return renderSkoolAlumniInviteEmail(opts)
  }
  const siteUrl = PRODUCTION_URL
  const greeting = opts.firstName ? `Hey ${escapeHtml(opts.firstName)}!` : 'Hey!'
  const preheader = 'Dein Zugang zur Herr Tech World als KI Marketing Club Mitglied'

  return `<!DOCTYPE html>
<html lang="de">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Dein Zugang zur Herr Tech World</title>
  </head>
  <body style="margin:0; padding:0; background:#F5F0EB; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <span style="display:none; max-height:0; overflow:hidden; color:transparent;">
      ${escapeHtml(preheader)}
    </span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F5F0EB;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px; width:100%; background:#FFFFFF; border-radius:16px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.04);">
            <tr>
              <td align="center" style="padding:24px 32px; background:#FDFBF7; border-bottom:1px solid #EEE8E0;">
                <a href="${siteUrl}" style="text-decoration:none;">
                  <img src="${LOGO_URL}" alt="Herr Tech World" height="26" style="display:block; height:26px; width:auto; margin:0 auto;">
                </a>
              </td>
            </tr>

            <tr>
              <td align="left" style="padding:36px 36px 8px;">
                <div style="font-size:12px; letter-spacing:0.18em; text-transform:uppercase; color:#B598E2; font-weight:700; margin-bottom:16px;">
                  Exklusiv für Club-Mitglieder
                </div>
                <h1 style="margin:0 0 16px; font-size:28px; line-height:1.2; color:#0F0F13; font-weight:800; letter-spacing:-0.01em;">
                  Die Herr Tech World<br>
                  <span style="color:#B598E2;">wartet auf dich.</span>
                </h1>
                <p style="margin:0 0 14px; font-size:16px; line-height:1.6; color:#333;">
                  ${greeting}
                </p>
                <p style="margin:0 0 14px; font-size:16px; line-height:1.6; color:#333;">
                  Als Mitglied im <strong>KI Marketing Club</strong> hast du ab sofort
                  kostenlosen Zugriff auf die <strong>Herr Tech World</strong> — deine
                  KI-Plattform mit Classroom, Chat-Agenten und der kompletten Toolbox
                  (inkl. ${opts.creditsPerMonth ?? 200} Credits/Monat).
                </p>
                <p style="margin:0 0 14px; font-size:16px; line-height:1.6; color:#333;">
                  Der Zugang ist für dich <strong>gratis</strong>, solange du im Club bist.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:4px 36px 24px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="padding:8px 0; font-size:15px; line-height:1.5; color:#333;">
                      🎓&nbsp;&nbsp;<strong>Classroom</strong> — alle Lern-Module, alle Videos.
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0; font-size:15px; line-height:1.5; color:#333;">
                      🤖&nbsp;&nbsp;<strong>6 KI-Coaches</strong>, trainiert auf Herr Techs Inhalten.
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0; font-size:15px; line-height:1.5; color:#333;">
                      🎨&nbsp;&nbsp;<strong>Toolbox</strong> — Karussells, Video-Editor, Video-Creator.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:8px 36px 12px;">
                <a href="${opts.claimLink}"
                   style="display:inline-block; background:#B598E2; color:#FFFFFF; padding:16px 40px;
                          border-radius:12px; text-decoration:none; font-weight:700; font-size:16px;">
                  Jetzt Zugang aktivieren
                </a>
                <div style="font-size:13px; color:#999; margin-top:12px;">
                  Einmal klicken, Account erstellen, fertig.
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:20px 36px 8px;">
                <p style="margin:0; font-size:13px; line-height:1.55; color:#666; font-style:italic;">
                  Gut zu wissen: Wenn du den Club später verlässt, bleibt dir dein
                  Classroom-Zugang als Alumni lebenslang erhalten.
                </p>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:24px 32px 16px; margin-top:12px; border-top:1px solid #EEE8E0;">
                <div style="font-size:11px; line-height:1.5; color:#999; text-align:center;">
                  Falls der Button nicht funktioniert, kopiere diesen Link:<br>
                  <span style="word-break:break-all; color:#999;">${opts.claimLink}</span><br><br>
                  Der Link ist 30 Tage gültig.
                </div>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:16px 32px 24px; border-top:1px solid #EEE8E0;">
                <div style="font-size:12px; line-height:1.5; color:#999; text-align:center;">
                  Herr Tech World — Deine KI-Plattform für Content, Business &amp; Wachstum.<br>
                  <a href="${siteUrl}" style="color:#B598E2; text-decoration:none;">${siteUrl.replace(/^https?:\/\//, '')}</a>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

// ─────────────────────────────────────────────────────────────────────────────
// Alumni-Einladung: für ehemalige KI Marketing Club Mitglieder.
// Lebenslanger Classroom-Zugang, kein Plan S, kein Premium —
// für Tools/Chat/Toolbox müssen sie wieder dem Club beitreten.
// ─────────────────────────────────────────────────────────────────────────────

function renderSkoolAlumniInviteEmail(opts: SkoolInviteOptions): string {
  const siteUrl = PRODUCTION_URL
  const greeting = opts.firstName ? `Hey ${escapeHtml(opts.firstName)}!` : 'Hey!'
  const preheader = 'Dein lebenslanger Classroom-Zugang als Alumni des KI Marketing Club'

  return `<!DOCTYPE html>
<html lang="de">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Dein Alumni-Zugang zur Herr Tech World</title>
  </head>
  <body style="margin:0; padding:0; background:#F5F0EB; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <span style="display:none; max-height:0; overflow:hidden; color:transparent;">
      ${escapeHtml(preheader)}
    </span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F5F0EB;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px; width:100%; background:#FFFFFF; border-radius:16px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.04);">
            <tr>
              <td align="center" style="padding:24px 32px; background:#FDFBF7; border-bottom:1px solid #EEE8E0;">
                <a href="${siteUrl}" style="text-decoration:none;">
                  <img src="${LOGO_URL}" alt="Herr Tech World" height="26" style="display:block; height:26px; width:auto; margin:0 auto;">
                </a>
              </td>
            </tr>

            <tr>
              <td align="left" style="padding:36px 36px 8px;">
                <div style="font-size:12px; letter-spacing:0.18em; text-transform:uppercase; color:#B598E2; font-weight:700; margin-bottom:16px;">
                  Für Alumni des KI Marketing Club
                </div>
                <h1 style="margin:0 0 16px; font-size:28px; line-height:1.2; color:#0F0F13; font-weight:800; letter-spacing:-0.01em;">
                  Dein Wissen,<br>
                  <span style="color:#B598E2;">für immer.</span>
                </h1>
                <p style="margin:0 0 14px; font-size:16px; line-height:1.6; color:#333;">
                  ${greeting}
                </p>
                <p style="margin:0 0 14px; font-size:16px; line-height:1.6; color:#333;">
                  Du warst Mitglied im <strong>KI Marketing Club</strong>. Auch wenn dein
                  aktiver Zugang abgelaufen ist — die Inhalte, mit denen du gelernt hast,
                  bleiben dir <strong>lebenslang erhalten</strong>.
                </p>
                <p style="margin:0 0 14px; font-size:16px; line-height:1.6; color:#333;">
                  In der <strong>Herr Tech World</strong> findest du als Alumni weiterhin
                  freien Zugriff auf den kompletten <strong>Classroom</strong>:
                  alle Lern-Module, alle Videos, jederzeit verfügbar.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:4px 36px 24px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="padding:8px 0; font-size:15px; line-height:1.5; color:#333;">
                      🎓&nbsp;&nbsp;<strong>Classroom</strong> — alle Lern-Module, lebenslang.
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0; font-size:15px; line-height:1.5; color:#666;">
                      🔒&nbsp;&nbsp;<strong>KI-Coaches &amp; Toolbox</strong> — exklusiv für aktive Club-Mitglieder.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:8px 36px 12px;">
                <a href="${opts.claimLink}"
                   style="display:inline-block; background:#B598E2; color:#FFFFFF; padding:16px 40px;
                          border-radius:12px; text-decoration:none; font-weight:700; font-size:16px;">
                  Classroom-Zugang aktivieren
                </a>
                <div style="font-size:13px; color:#999; margin-top:12px;">
                  Einmal klicken, Account erstellen, fertig.
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:20px 36px 8px;">
                <p style="margin:0; font-size:13px; line-height:1.55; color:#666; font-style:italic;">
                  Wenn du wieder vollen Zugriff auf KI-Coaches, Toolbox und alle Tools willst,
                  kannst du jederzeit dem KI Marketing Club erneut beitreten — und schaltest
                  damit automatisch Plan S in der Herr Tech World wieder frei.
                </p>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:24px 32px 16px; margin-top:12px; border-top:1px solid #EEE8E0;">
                <div style="font-size:11px; line-height:1.5; color:#999; text-align:center;">
                  Falls der Button nicht funktioniert, kopiere diesen Link:<br>
                  <span style="word-break:break-all; color:#999;">${opts.claimLink}</span><br><br>
                  Der Link ist 30 Tage gültig.
                </div>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:16px 32px 24px; border-top:1px solid #EEE8E0;">
                <div style="font-size:12px; line-height:1.5; color:#999; text-align:center;">
                  Herr Tech World — Deine KI-Plattform für Content, Business &amp; Wachstum.<br>
                  <a href="${siteUrl}" style="color:#B598E2; text-decoration:none;">${siteUrl.replace(/^https?:\/\//, '')}</a>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}
