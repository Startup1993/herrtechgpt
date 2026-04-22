# Supabase Email Templates — Herr Tech World Design

Kopiere den HTML-Block jeweils in das entsprechende Feld unter
https://supabase.com/dashboard/project/kgolrqjkghhwdgoeyppt/auth/templates

Alle Templates nutzen `{{ .ConfirmationURL }}` — das setzt Supabase automatisch ein.

Logo-Quelle (öffentlich erreichbar):
`https://kgolrqjkghhwdgoeyppt.supabase.co/storage/v1/object/public/lesson-images/brand/logo.png`

---

## 1) Magic Link

**Subject:**
```
Dein Login-Link für Herr Tech World
```

**Message body (HTML):**
```html
<!DOCTYPE html>
<html lang="de">
<body style="margin:0; padding:0; background:#F5F0EB; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F5F0EB;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px; width:100%; background:#FFFFFF; border-radius:16px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.04);">
          <tr>
            <td align="center" style="padding:24px 32px; background:#FDFBF7; border-bottom:1px solid #EEE8E0;">
              <a href="https://herr.tech" style="text-decoration:none;">
                <img src="https://kgolrqjkghhwdgoeyppt.supabase.co/storage/v1/object/public/lesson-images/brand/logo.png" alt="Herr Tech World" height="26" style="display:block; height:26px; width:auto; margin:0 auto;">
              </a>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:28px 32px 8px;">
              <h1 style="margin:0 0 12px; font-size:22px; line-height:1.3; color:#0F0F13; font-weight:700; text-align:center;">Dein Login-Link</h1>
              <p style="margin:0 0 10px; font-size:15px; line-height:1.6; color:#444; text-align:center;">
                Klick auf den Button unten, um dich bei Herr Tech World einzuloggen. Kein Passwort nötig.
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:16px 32px 8px;">
              <a href="{{ .ConfirmationURL }}"
                 style="display:inline-block; background:#B598E2; color:#FFFFFF; padding:12px 28px; border-radius:10px; text-decoration:none; font-weight:600; font-size:15px;">
                Jetzt einloggen
              </a>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:16px 32px 8px;">
              <div style="font-size:11px; line-height:1.5; color:#999; text-align:center;">
                Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:<br>
                <a href="{{ .ConfirmationURL }}" style="color:#999; word-break:break-all;">{{ .ConfirmationURL }}</a><br><br>
                Der Link ist 1 Stunde gültig und kann nur einmal verwendet werden.
              </div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:24px 32px 28px; border-top:1px solid #EEE8E0;">
              <div style="font-size:12px; line-height:1.5; color:#999; text-align:center;">
                Herr Tech World — Deine KI-Plattform für Content, Business &amp; Wachstum.<br>
                <a href="https://herr.tech" style="color:#B598E2; text-decoration:none;">herr.tech</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 2) Confirm signup

**Subject:**
```
Willkommen in der Herr Tech World — bitte E-Mail bestätigen
```

**Message body (HTML):**
```html
<!DOCTYPE html>
<html lang="de">
<body style="margin:0; padding:0; background:#F5F0EB; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F5F0EB;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px; width:100%; background:#FFFFFF; border-radius:16px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.04);">
          <tr>
            <td align="center" style="padding:24px 32px; background:#FDFBF7; border-bottom:1px solid #EEE8E0;">
              <a href="https://herr.tech" style="text-decoration:none;">
                <img src="https://kgolrqjkghhwdgoeyppt.supabase.co/storage/v1/object/public/lesson-images/brand/logo.png" alt="Herr Tech World" height="26" style="display:block; height:26px; width:auto; margin:0 auto;">
              </a>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:28px 32px 8px;">
              <h1 style="margin:0 0 12px; font-size:22px; line-height:1.3; color:#0F0F13; font-weight:700; text-align:center;">Willkommen in der Herr Tech World</h1>
              <p style="margin:0 0 10px; font-size:15px; line-height:1.6; color:#444; text-align:center;">
                Bestätige deine E-Mail-Adresse, um dein Konto zu aktivieren. Anschließend wirst du direkt eingeloggt.
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:16px 32px 8px;">
              <a href="{{ .ConfirmationURL }}"
                 style="display:inline-block; background:#B598E2; color:#FFFFFF; padding:12px 28px; border-radius:10px; text-decoration:none; font-weight:600; font-size:15px;">
                E-Mail bestätigen
              </a>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:16px 32px 8px;">
              <div style="font-size:11px; line-height:1.5; color:#999; text-align:center;">
                Falls der Button nicht funktioniert, öffne diesen Link:<br>
                <a href="{{ .ConfirmationURL }}" style="color:#999; word-break:break-all;">{{ .ConfirmationURL }}</a>
              </div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:24px 32px 28px; border-top:1px solid #EEE8E0;">
              <div style="font-size:12px; line-height:1.5; color:#999; text-align:center;">
                Herr Tech World — Deine KI-Plattform für Content, Business &amp; Wachstum.<br>
                <a href="https://herr.tech" style="color:#B598E2; text-decoration:none;">herr.tech</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 3) Invite user

**Subject:**
```
Du wurdest in die Herr Tech World eingeladen
```

**Message body (HTML):**
```html
<!DOCTYPE html>
<html lang="de">
<body style="margin:0; padding:0; background:#F5F0EB; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F5F0EB;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px; width:100%; background:#FFFFFF; border-radius:16px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.04);">
          <tr>
            <td align="center" style="padding:24px 32px; background:#FDFBF7; border-bottom:1px solid #EEE8E0;">
              <a href="https://herr.tech" style="text-decoration:none;">
                <img src="https://kgolrqjkghhwdgoeyppt.supabase.co/storage/v1/object/public/lesson-images/brand/logo.png" alt="Herr Tech World" height="26" style="display:block; height:26px; width:auto; margin:0 auto;">
              </a>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:28px 32px 8px;">
              <h1 style="margin:0 0 12px; font-size:22px; line-height:1.3; color:#0F0F13; font-weight:700; text-align:center;">Du wurdest eingeladen</h1>
              <p style="margin:0 0 10px; font-size:15px; line-height:1.6; color:#444; text-align:center;">
                Du wurdest in die Herr Tech World eingeladen — deiner KI-Plattform für Content, Business &amp; Wachstum. Klick unten, um direkt einzusteigen.
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:16px 32px 8px;">
              <a href="{{ .ConfirmationURL }}"
                 style="display:inline-block; background:#B598E2; color:#FFFFFF; padding:12px 28px; border-radius:10px; text-decoration:none; font-weight:600; font-size:15px;">
                Einladung annehmen
              </a>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:16px 32px 8px;">
              <div style="font-size:11px; line-height:1.5; color:#999; text-align:center;">
                Falls der Button nicht funktioniert, öffne diesen Link:<br>
                <a href="{{ .ConfirmationURL }}" style="color:#999; word-break:break-all;">{{ .ConfirmationURL }}</a>
              </div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:24px 32px 28px; border-top:1px solid #EEE8E0;">
              <div style="font-size:12px; line-height:1.5; color:#999; text-align:center;">
                Herr Tech World — Deine KI-Plattform für Content, Business &amp; Wachstum.<br>
                <a href="https://herr.tech" style="color:#B598E2; text-decoration:none;">herr.tech</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 4) Reset Password

**Subject:**
```
Passwort zurücksetzen — Herr Tech World
```

> Hinweis: Da Herr Tech World auf Magic-Link-Login umgestellt ist, wird dieses Template normalerweise nicht ausgelöst.

**Message body (HTML):**
```html
<!DOCTYPE html>
<html lang="de">
<body style="margin:0; padding:0; background:#F5F0EB; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F5F0EB;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px; width:100%; background:#FFFFFF; border-radius:16px; overflow:hidden;">
          <tr>
            <td align="center" style="padding:24px 32px; background:#FDFBF7; border-bottom:1px solid #EEE8E0;">
              <a href="https://herr.tech" style="text-decoration:none;">
                <img src="https://kgolrqjkghhwdgoeyppt.supabase.co/storage/v1/object/public/lesson-images/brand/logo.png" alt="Herr Tech World" height="26" style="display:block; height:26px; width:auto; margin:0 auto;">
              </a>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:28px 32px 8px;">
              <h1 style="margin:0 0 12px; font-size:22px; line-height:1.3; color:#0F0F13; font-weight:700; text-align:center;">Passwort zurücksetzen</h1>
              <p style="margin:0 0 10px; font-size:15px; line-height:1.6; color:#444; text-align:center;">
                Klick auf den Button, um ein neues Passwort festzulegen.
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:16px 32px 8px;">
              <a href="{{ .ConfirmationURL }}"
                 style="display:inline-block; background:#B598E2; color:#FFFFFF; padding:12px 28px; border-radius:10px; text-decoration:none; font-weight:600; font-size:15px;">
                Passwort zurücksetzen
              </a>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:24px 32px 28px; border-top:1px solid #EEE8E0;">
              <div style="font-size:12px; line-height:1.5; color:#999; text-align:center;">
                Herr Tech World — <a href="https://herr.tech" style="color:#B598E2; text-decoration:none;">herr.tech</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 5) Change Email

**Subject:**
```
E-Mail-Adresse ändern — Herr Tech World
```

**Message body (HTML):**
```html
<!DOCTYPE html>
<html lang="de">
<body style="margin:0; padding:0; background:#F5F0EB; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F5F0EB;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px; width:100%; background:#FFFFFF; border-radius:16px; overflow:hidden;">
          <tr>
            <td align="center" style="padding:24px 32px; background:#FDFBF7; border-bottom:1px solid #EEE8E0;">
              <a href="https://herr.tech" style="text-decoration:none;">
                <img src="https://kgolrqjkghhwdgoeyppt.supabase.co/storage/v1/object/public/lesson-images/brand/logo.png" alt="Herr Tech World" height="26" style="display:block; height:26px; width:auto; margin:0 auto;">
              </a>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:28px 32px 8px;">
              <h1 style="margin:0 0 12px; font-size:22px; line-height:1.3; color:#0F0F13; font-weight:700; text-align:center;">E-Mail-Adresse ändern</h1>
              <p style="margin:0 0 10px; font-size:15px; line-height:1.6; color:#444; text-align:center;">
                Bitte bestätige die neue Adresse, um die Änderung abzuschließen.
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:16px 32px 8px;">
              <a href="{{ .ConfirmationURL }}"
                 style="display:inline-block; background:#B598E2; color:#FFFFFF; padding:12px 28px; border-radius:10px; text-decoration:none; font-weight:600; font-size:15px;">
                Änderung bestätigen
              </a>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:24px 32px 28px; border-top:1px solid #EEE8E0;">
              <div style="font-size:12px; line-height:1.5; color:#999; text-align:center;">
                Herr Tech World — <a href="https://herr.tech" style="color:#B598E2; text-decoration:none;">herr.tech</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```
