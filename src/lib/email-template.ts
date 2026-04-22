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
