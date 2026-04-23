# KI Video Creator — Integrations-Handover

**Stand:** 2026-04-22 · **Session-Ergebnis:** End-to-End-MVP läuft auf Staging
**Autor:** Claude (Session 1) → für Claude (Session 2+)

> Diese Datei ist das Briefing für jede weitere Session die am KI Video Creator
> arbeitet. Lies sie VOR dem ersten Tool-Call. Enthält alle kritischen Pfade,
> Credentials-Quellen, Architektur-Begründungen und Gotchas.

---

## TL;DR

Der Video-Creator ist ein separates Next.js-14-Projekt das wir in die herrtechgpt
Toolbox integriert haben. Weil er **FFmpeg + yt-dlp + Remotion + Chromium**
braucht (Vercel kann das nicht), läuft der Backend-Teil als **Docker-Container
auf Hetzner**. Das Frontend liegt in herrtechgpt (Next 16, App Router) und
proxyt alle API-Calls transparent über eine Catch-All-Route zum Hetzner-Worker.

**Was läuft (Staging getestet):** Prompt → Szenen-Skript → Projekt angelegt
**Was fehlt:** Scene-Editor UI, Setup-Seite, Export-Seite, Upload-/URL-Flow E2E-Test

---

## Live-Architektur

```
Browser (staging.herr.tech / world.herr.tech)
    │
    │  /api/video-creator/<path>
    ▼
Vercel: src/app/api/video-creator/[...path]/route.ts
    │  (Catch-All-Proxy, liest VIDEO_CREATOR_INTERNAL_URL
    │   zur Request-Zeit — KEIN Build-Time-Caching)
    ▼
Hetzner VPS CPX22 (178.104.27.49) — vc.herr.tech (Caddy + SSL)
    │  ┌─────────────────────────────────────────────┐
    │  │ Docker Compose: worker + caddy              │
    │  │  worker = herr-tech-video-creator           │
    │  │    Branch: feature/supabase-migration       │
    │  │    Next.js 14 Pages-Router, API-only        │
    │  │    FFmpeg, yt-dlp, Chromium, Remotion       │
    │  │  caddy = Reverse-Proxy + Auto-SSL           │
    │  │  Volumes: tmp/projects, uploads, out        │
    │  └─────────────────────────────────────────────┘
    ▼
Supabase (geteilt mit herrtechgpt)
    - Auth (JWT-Validation via Bearer-Token)
    - profiles.role für Admin-Check, .access_tier für Premium
    - video_creator_stats (Migration 028) via SECURITY DEFINER RPC
```

---

## Wichtige URLs & Pfade

### Remote
| Was | URL |
|---|---|
| Staging-Frontend | `https://staging.herr.tech` (Branch: `main`) |
| Live-Frontend | `https://world.herr.tech` (Branch: `production`) |
| Worker-API (intern, nicht User-facing) | `https://vc.herr.tech` |
| herrtechgpt-Repo | `github.com/Startup1993/herrtechgpt` |
| Worker-Repo | `github.com/jacob-sc/herr-tech-video-creator` (Branch: `feature/supabase-migration`) |
| Hetzner-VPS-Konsole | `console.hetzner.cloud` → Server `herr-tech-video-creator` |
| Supabase | `app.supabase.com` → Projekt `herrtechGPT` (ID: `kgolrqjkghhwdgoeyppt`) |
| Vercel | `vercel.com/jonas-projects/herr-tech-gpt` |
| DNS | GoDaddy (`herr.tech`) |

### Lokal (auf Jacobs Mac)
| Was | Pfad |
|---|---|
| herrtechgpt-Hauptrepo | `/Users/jacob/claude/herrtechgpt` |
| Worktrees dieses Repos | `.claude/worktrees/…` |
| Worker-Hauptrepo (Original, unangetastet) | `/Users/jacob/claude/herr-tech-video-creator` |
| Worker-Migration-Worktree | `/Users/jacob/claude/video-creator-migration` |
| Worker-`.env` (mit echten Keys) | `/Users/jacob/claude/video-creator-migration/.env` (gitignored) |
| SSH-Key für Hetzner | `~/.ssh/hetzner_ed25519` (ohne Passphrase) |

### Server (Hetzner)
| Was | Pfad |
|---|---|
| App-Verzeichnis | `/opt/video-creator-worker` (auf dem Server) |
| SSH als root | `ssh -i ~/.ssh/hetzner_ed25519 -o IdentitiesOnly=yes root@178.104.27.49` |
| SSH als deploy | `ssh -i ~/.ssh/hetzner_ed25519 -o IdentitiesOnly=yes deploy@178.104.27.49` |
| Docker-Status | `cd /opt/video-creator-worker && docker compose ps` |
| Worker-Logs | `cd /opt/video-creator-worker && docker compose logs -f worker` |
| Container-Neustart | `cd /opt/video-creator-worker && docker compose restart worker` |
| GitHub-Deploy-Key (read-only) | `/home/deploy/.ssh/github_deploy` |

### Kritische Dateien im herrtechgpt-Frontend
| Zweck | Pfad |
|---|---|
| Toolbox-Übersicht | `src/app/dashboard/ki-toolbox/page.tsx` |
| Video-Creator-Landing (Server: Auth + Tier-Gate) | `src/app/dashboard/ki-toolbox/video-creator/page.tsx` |
| Landing-Client (Projekt-Liste, QuickStart) | `src/app/dashboard/ki-toolbox/video-creator/VideoCreatorHome.tsx` |
| Premium-Gate (für non-premium Users) | `src/app/dashboard/ki-toolbox/video-creator/PremiumGate.tsx` |
| „Neues Projekt"-Form (3 Tabs: URL/Upload/Prompt) | `src/app/dashboard/ki-toolbox/video-creator/new/NewProjectForm.tsx` |
| Scenes-Placeholder (Editor folgt) | `src/app/dashboard/ki-toolbox/video-creator/scenes/[id]/ScenesPlaceholder.tsx` |
| **Proxy-Route zum Worker** | `src/app/api/video-creator/[...path]/route.ts` |
| Client-Lib (fetch-Wrapper mit JWT) | `src/lib/video-creator-api.ts` |
| Access-Tier-Logic (unverändert, bestehend) | `src/lib/access.ts` |
| Supabase-Migration | `supabase/migrations/028_video_creator_stats.sql` |

### Kritische Dateien im Worker
| Zweck | Pfad (relativ zum Worker-Repo) |
|---|---|
| Supabase-JWT-Auth (ersetzt NextAuth) | `src/lib/api-auth.js` |
| Supabase-Client (Service Role) | `src/lib/supabase.js` |
| User-Stats-RPC-Stub | `src/lib/user-stats.js` |
| CORS-Middleware (für Direkt-Tests, nicht für Proxy nötig) | `src/middleware.js` |
| Check-Env-Endpoint (Debug) | `src/pages/api/check-env.js` |
| Google-Imagen-/Gemini-Integration | `src/lib/imagen.js` |
| yt-dlp-Wrapper | `src/lib/ytdlp.js` |
| FFmpeg-Wrapper | `src/lib/ffmpeg.ts` |
| Remotion-Komposition | `src/remotion/…` |
| Dockerfile (Node 22 + FFmpeg + yt-dlp + Chromium) | `Dockerfile` |
| Compose + Caddy | `docker-compose.yml`, `Caddyfile` |
| Bootstrap-Skript (einmalig) | `scripts/hetzner-setup.sh` |

---

## Deploy-Flow (WICHTIG — strikt einhalten)

```
feature-branch → PR → main (= Staging, auto-deploy) → PR main → production (= Live)
```

**NIEMALS direkt auf `production` pushen oder mergen ohne explizite Jacob-Ansage.**
Trigger für Live-Deploy: „deploy live", „auf Produktion", „auf world.herr.tech",
„live schalten", „auf die echte Domain".

- **Staging-Deploy:** Jeder Merge nach `main` auf Vercel (Branch `main` →
  `staging.herr.tech`). Auf Staging liegt Vercel-Deployment-Protection
  (User muss eingeloggt sein, curl ohne Token sieht 401).
- **Live-Deploy:** Separater PR `main → production`. Nur auf Ansage.
- **Worker-Deploys:** Der Worker lebt in einem anderen Repo
  (`jacob-sc/herr-tech-video-creator`). Aktueller Branch:
  `feature/supabase-migration`. Nach Änderungen:
  ```bash
  ssh deploy@178.104.27.49
  cd /opt/video-creator-worker
  git pull
  docker compose up -d --build
  ```

---

## Wichtige Architektur-Entscheidungen (und warum)

### 1) Worker als separater Service auf Hetzner, nicht auf Vercel
Vercel kann kein FFmpeg, yt-dlp, Remotion, Chromium. Timeouts (60s Hobby,
300s Pro Edge). Keine persistenten Volumes. → Hetzner CPX22 (3 vCPU, 4GB
RAM, 80GB SSD, 7,99€/Monat) mit Docker. Reicht für aktuelle Last.

### 2) Catch-All Proxy-Route statt Next.js `rewrites()`
Vorherige Version: `next.config.ts` mit `async rewrites()` die
`VIDEO_CREATOR_INTERNAL_URL` zur Build-Zeit gelesen hat. Problem: Wenn die
ENV nach einem Build gesetzt wird, zieht Vercel den Wert nicht nach —
Build-Manifest cached die rewrite-Regel. Führte zu hartnäckigen 404s
trotz korrekt gesetzter ENV.

**Aktuelle Lösung:** `src/app/api/video-creator/[...path]/route.ts` —
reguläre Route-Handler, liest `process.env.VIDEO_CREATOR_INTERNAL_URL`
bei jedem Request, streamt Body + Headers (inkl. `Authorization: Bearer`)
durch, gibt Worker-Response 1:1 zurück. Robust gegen ENV-Änderungen.

### 3) Auth via Supabase-JWT statt NextAuth
Worker hatte ursprünglich NextAuth + Prisma. Weil das Frontend eh
Supabase-Auth nutzt, haben wir NextAuth + Prisma komplett entfernt.
Worker validiert jetzt den Supabase-Access-Token via `supabase.auth.getUser(jwt)`.
Admin-Check über `profiles.role === 'admin'`.

**Ablauf:** Frontend holt Token via `supabase.auth.getSession()`, schickt
`Authorization: Bearer <token>` an Vercel-Proxy, Vercel leitet Header
transparent zum Worker weiter, Worker validiert.

### 4) Prisma + Neon komplett raus, direkt Supabase
Prisma wurde nur für NextAuth-User-Tabellen genutzt. Die Projekt-Daten
liegen ohnehin als JSON-Files im Worker-Filesystem. Mit NextAuth weg
entfällt jegliche Prisma-Notwendigkeit. User-Stats
(projectsCreated/imagesGenerated/videosGenerated) → neue Supabase-Tabelle
`video_creator_stats` + atomare SECURITY DEFINER RPC.

### 5) Projekt-Daten: JSON auf Worker-Volume, nicht in DB
Die 1960-Zeilen Scene-Editor-UI arbeitet auf einem großen Projekt-JSON mit
allen Szenen, Bildern, Video-Refs etc. Das bleibt im Worker-Filesystem
(`tmp/projects/{id}/project.json`). Grund: FFmpeg/Remotion braucht eh
lokale Files beim Rendering. Supabase Storage wäre Overhead ohne Vorteil.

### 6) `vc.herr.tech` statt sichtbarer API-Domain
Der Worker braucht HTTPS (für Caddy-SSL). DNS-A-Record bei GoDaddy:
`vc.herr.tech → 178.104.27.49`. Aber User sehen die Domain nie, weil
alles über `/api/video-creator/*` auf der Haupt-Domain läuft.

---

## Env-Variablen (Quellen)

### Vercel (herrtechgpt-Projekt — Settings → Environment Variables)
- `VIDEO_CREATOR_INTERNAL_URL=https://vc.herr.tech` (Production, Preview, Development)
  - **GOTCHA:** Muss als Project-Variable angelegt sein, nicht nur Shared.
    Sonst ist sie im Runtime nicht verfügbar. Falls Shared: explizit linken.

### Hetzner `/opt/video-creator-worker/.env` (auf Server, gitignored)
- `DOMAIN=vc.herr.tech`
- `ALLOWED_ORIGINS=https://world.herr.tech,https://staging.herr.tech`
- `NEXT_PUBLIC_SUPABASE_URL=<aus Supabase Data API>`
- `SUPABASE_SERVICE_ROLE_KEY=<aus Supabase API Keys → Secret keys, beginnt mit sb_secret_>`
- `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `FAL_KEY`, `GOOGLE_API_KEY`
- `GOOGLE_CLOUD_PROJECT` (optional, für Vertex-Imagen-Fallback)

**Lokale Referenz (auf Mac, für Re-Uploads):**
`/Users/jacob/claude/video-creator-migration/.env`

---

## Was funktioniert (End-to-End auf Staging getestet)

- ✅ Toolbox-Kachel „KI Video Creator" → Landing
- ✅ Premium-Gate für basic/alumni Users
- ✅ Admin-Zugriff ohne Premium-Check
- ✅ „Von Prompt"-Flow: Prompt → Claude → Szenen-Skript → Projekt erstellt
- ✅ Redirect auf Scenes-Placeholder nach Projekt-Erstellung

## Was implementiert aber noch nicht E2E-getestet

- ⚠ „Upload"-Flow (Datei-Upload → Worker speichert → Setup-Page)
- ⚠ „Von URL"-Flow (YouTube/Insta/TikTok → yt-dlp → Processing)
- ⚠ Karussell-Generator (existiert seit längerer Zeit, Kachel ist aktiv)

## Was NOCH NICHT implementiert (nächste Sessions)

### Hohe Priorität — Scene-Editor (~1960 Zeilen UI)
Das Herzstück. Muss portiert werden von
`herr-tech-video-creator/src/pages/scenes/[id].js` (Pages-Router, JS) zu
`herrtechgpt/src/app/dashboard/ki-toolbox/video-creator/scenes/[id]/` (App-Router, TS).

Features: Szenen-Editor mit Bild-Generierung (Gemini-3-Pro-Image = „nano banana"),
Video-Generierung (FAL Kling/Veo3), Character-Management, Reference-Images,
Szenen splitten/einfügen/löschen/reordern.

**Empfehlung:** Eine eigene Session dafür. Nicht zusammen mit anderen Sachen
machen — zu groß für sauberen Commit, und kleinere Chunks ermöglichen Tests.
Aufteilbar in:
1. Grund-Layout + Szenen-Liste anzeigen
2. Text/Timing editieren
3. Bild-Generierung + Upload
4. Video-Generierung + Polling
5. Character + Reference Images
6. Split/Insert/Reorder

### Setup-Page (Processing-SSE)
Nach URL-/Upload-Flow: Sprach-Auswahl, Style, dann Live-Progress während
yt-dlp + Whisper + Szenen-Erkennung laufen. Server-Sent Events vom Worker.
Original: `herr-tech-video-creator/src/pages/setup/[id].js`.

### Export-Page (Remotion-Render + Download)
Am Ende: alle Szenen zu einem finalen MP4 zusammenrendern, Overlay-Subtitles,
Audio-Track, 16:9 / 9:16 / 1:1. Original: `herr-tech-video-creator/src/pages/export/[id].js`.

### Live-Deploy (main → production)
Nur auf explizite Ansage von Jacob (CLAUDE.md-Regel).

---

## Gotchas & Lessons Learned

### Vercel rewrites() sind build-time-brittle
Wenn du je wieder an `next.config.ts` Rewrites denkst die externe Services
ansprechen und mit ENVs konfiguriert sind: **lass es.** Nimm Route Handler
(`app/api/.../[...path]/route.ts`). Die lesen ENVs zur Request-Zeit,
nicht Build-Zeit. Kostet ~100ms extra pro Request (für Proxy), aber
zuverlässig.

### Hetzner-Rebuild injiziert SSH-Keys nicht immer
Bei Rebuild des Cloud-Servers: Der SSH-Key-Auswahl-Dialog wird nicht
immer angezeigt. Wenn der neue Key nicht in `authorized_keys` ankommt:
- `Reset Root Password` funktioniert nur wenn `qemu-guest-agent` läuft
  (tut es oft nicht direkt nach Rebuild)
- **Verlässlich:** Rescue-Mode aktivieren → mit Rescue-Passwort einloggen
  (SSH-Flag `-o PubkeyAuthentication=no -o PreferredAuthentications=password`
  damit SSH nicht nach der Passphrase vom lokalen Mac-Key fragt) →
  Disk mounten (`mount /dev/sda1 /mnt`) → Key in
  `/mnt/root/.ssh/authorized_keys` schreiben → reboot.

### GoDaddy DNS-Propagation
Dauert 2–30 Min. Test via `dig +short vc.herr.tech @8.8.8.8` (Google's
Resolver ist meist schnell). Cloudflare-Proxy-Modus ist bei Caddy-SSL
**nicht** kompatibel — wenn DNS bei Cloudflare läge, müsste „DNS only"
(graue Wolke) aktiv sein.

### Supabase: neue API-Keys (sb_publishable_/sb_secret_)
Nicht mehr das klassische JWT-Format (`eyJhbGc…`). Beide funktionieren
mit `@supabase/supabase-js` v2.45+, aber immer den **Secret key**
nehmen (nicht publishable) für Service-Role-Clients im Worker.

### FAL-Key: Zwei Namen möglich
Worker-Code akzeptiert `FAL_KEY` ODER `FAL_API_KEY`. Der Check-Env-Endpoint
prüfte anfangs nur `FAL_API_KEY` — führte zu falschen Fehlermeldungen.
Ist jetzt gefixt, aber bei Debugging im Hinterkopf behalten.

### Vercel Preview-Protection blockt curl-Tests
Staging-URL verlangt User-Authentifizierung. `curl https://staging.herr.tech/api/...`
ohne Token = 401. Zum Testen entweder im Browser (eingeloggt) oder via
Vercel Protection Bypass Token.

### Docker Compose ENVs werden beim Start gecacht
Wenn du die `.env` auf dem Server änderst: `docker compose up -d --build`
(nicht nur `restart`) damit die neuen Werte in die Container injiziert werden.
Oder: `docker compose down && docker compose up -d`.

---

## Security-Status

### API-Keys im Chat-Verlauf
Während dieser Session sind API-Keys mehrfach im Chat-Log gelandet
(FAL, Anthropic, OpenAI, Google, Supabase Secret) — teils durch
unzureichenden Redact-Filter bei `docker compose config`, teils durch
system-reminders die `.env`-Edits nach jeder Datei-Änderung anzeigten.

**Empfehlung:** Wenn der Chat nicht streng privat ist → Keys rotieren:
- Anthropic Console → altes Key löschen, neues
- OpenAI Platform → API Keys → Rotate
- fal.ai Dashboard → Keys → Revoke + neu
- Google AI Studio → API Key revoken + neu
- Supabase → API Keys → Secret key revoken + neu (PLUS: in Vercel
  `SUPABASE_SERVICE_ROLE_KEY` ersetzen UND auf Hetzner in `.env` +
  `docker compose up -d --build`)

Wenn Chat privat bleibt → nix zu tun.

### Vercel Deployment Protection
Standard-mäßig aktiv auf Staging/Preview. Das ist bewusst so
(verhindert dass Test-Deploys public sind). Für echte Endnutzer-Tests
muss man auf Live-Domain deployen (`world.herr.tech`).

### Worker-CORS + Firewall
Worker akzeptiert CORS nur von `world.herr.tech` und `staging.herr.tech`
(via `ALLOWED_ORIGINS` env). Für Proxy-Traffic via Vercel ist CORS eh
irrelevant (same-origin vom Browser her). Nur relevant falls man den
Worker direkt aus einem Browser anspricht zum Debuggen.

UFW-Firewall auf Hetzner: nur 22 (SSH), 80, 443 offen.

---

## Typische Debug-Wege

### „Worker error 404" im Frontend
- Check: ist `VIDEO_CREATOR_INTERNAL_URL` in Vercel als Project-Variable?
- Check: hat der letzte Deploy die ENV gezogen? → „Redeploy ohne Build Cache"
- Check: antwortet `https://vc.herr.tech/api/check-env` (direkt gegen Worker)?
  Wenn nein → Worker-Problem.
  Wenn ja → Proxy-Route-Problem.

### Worker nicht erreichbar
```bash
ssh -i ~/.ssh/hetzner_ed25519 -o IdentitiesOnly=yes deploy@178.104.27.49
cd /opt/video-creator-worker
docker compose ps              # laufen beide Container?
docker compose logs worker     # Fehler im Worker?
docker compose logs caddy      # SSL-Probleme?
```

### SSL-Zertifikat-Fehler bei Caddy
Üblicherweise DNS noch nicht propagiert. Check:
```bash
dig +short vc.herr.tech @8.8.8.8
```
Muss `178.104.27.49` zurückgeben. Caddy retryt alle 60s automatisch.

### „nicht konfiguriert"-State im Landing
Server-Component liest `process.env.VIDEO_CREATOR_INTERNAL_URL`.
Wenn das auf dem deployten Vercel fehlt: ENV falsch gesetzt / nicht
verlinkt / Build-Cache. Gleiches Fix wie bei 404.

---

## Offene PRs / Open Tabs

| Repo | Branch | Status |
|---|---|---|
| herrtechgpt | `claude/loving-swanson-c13821` | PR #24 (gemerged), PR #40 (gemerged). Neue Commits möglich. |
| herr-tech-video-creator | `feature/supabase-migration` | gepusht, läuft als Live-Worker. Nicht auf `main` gemerged. |

**Nächste Session:** Vermutlich neuer Feature-Branch `feature/video-creator-scenes-editor`
für den Scene-Editor, PR gegen `main` (= Staging).

---

## Kontakt & Kollaborator

- Jacob (Owner, Repo-Admin): jacob@startup-creator.com
- Jonas (Kollaborator): jonas@startup-creator.com

## Checkliste vor größeren Änderungen

- [ ] Feature-Branch aus `main` erstellt
- [ ] Tests/Build lokal grün (`npm run build` mit Node 22 in PATH)
- [ ] Bei Worker-Änderungen: im Worker-Repo separaten Branch, auch dort Build grün
- [ ] Bei ENV-Änderungen: Vercel UND Hetzner-`.env` updaten
- [ ] Bei Supabase-Schema-Änderungen: neue Migration + Run im SQL-Editor
- [ ] PR gegen `main` (Staging), nicht gegen `production`
- [ ] Nach Merge: auf Staging testen bevor Live-Deploy angefragt wird

---

**Letzte Session endete mit:** Erfolgreicher End-to-End-Prompt-Flow auf Staging.
Projekt `proj_1776880790742_2b94631d` angelegt. Placeholder für Scenes-Editor
zeigt „Projekt erfolgreich angelegt" + ehrlicher Hinweis dass Editor folgt.
