# KI Video Creator — Architektur & Handover

**Stand:** 2026-04-23 · **Status:** Produktiv, SSO-Flow live
**Autor:** Claude → für alle folgenden Sessions

> **Erste Anlaufstelle für jeden Chat der am Video Creator arbeitet.** Lies diese Datei VOR dem ersten Tool-Call. Enthält die aktuelle Architektur, alle kritischen Pfade, Credentials-Quellen und die typischen Fallstricke.

---

## TL;DR (30 Sekunden)

Der **Video Creator ist eine eigenständige App** auf `vc.herr.tech` (Hetzner VPS, Docker). Die herrtechgpt-Plattform (`staging.herr.tech` / `world.herr.tech`) enthält **keine Video-Creator-UI mehr** — nur noch eine Toolbox-Kachel, die via SSO zum Worker weiterleitet.

- **Frontend & Backend** des Video Creators: beides im Worker-Repo, läuft auf Hetzner
- **Login**: Supabase-Session wird per URL-Fragment-Handshake vom herrtechgpt-Browser an den Worker übergeben → Worker setzt eigene HttpOnly-Cookies
- **Theme** (Light/Dark), **Back-URL** (staging vs. world) werden beim selben Handshake mitgegeben
- **Keine Proxy-Route mehr auf Vercel**, keine Frontend-Portierung in herrtechgpt nötig

---

## Architektur-Diagramm

```
┌─────────────────────────────────────────────────┐
│  Browser                                        │
│  ┌───────────────────┐    ┌──────────────────┐  │
│  │ staging.herr.tech │    │  vc.herr.tech    │  │
│  │ (herrtechgpt)     │    │  (Video Creator) │  │
│  │                   │    │                  │  │
│  │ /dashboard/       │    │ /projects        │  │
│  │   ki-toolbox/     │    │ /scenes/[id]     │  │
│  │   video-creator   │    │ /setup/[id]      │  │
│  │   (nur Kachel!)   │    │ /videos/[id]     │  │
│  │   → SSO-Redirect  │    │ /export/[id]     │  │
│  └─────────┬─────────┘    └────────┬─────────┘  │
│            │                       │            │
│            │  Tokens im Fragment   │            │
│            └───────────────────────┘            │
│                                                 │
└──────┬─────────────────────────┬────────────────┘
       │                         │
       ▼                         ▼
┌─────────────────┐       ┌──────────────────────┐
│  Vercel         │       │  Hetzner CPX22       │
│  herrtechgpt    │       │  178.104.27.49       │
│  (Next 16)      │       │                      │
│                 │       │  Docker Compose:     │
│                 │       │  ├─ worker (Next 14) │
│                 │       │  │   FFmpeg, yt-dlp, │
│                 │       │  │   Remotion,       │
│                 │       │  │   Chromium        │
│                 │       │  └─ caddy            │
│                 │       │      Auto-SSL        │
│                 │       │      Reverse-Proxy   │
│                 │       └──────────┬───────────┘
│                 │                  │
│                 └──────────────────┤
│                                    │
│        Supabase (geteilt)          │
│   ┌────────────────────────────┐   │
│   │ Auth (JWT-Validation)      │   │
│   │ profiles (role, tier)      │   │
│   │ video_creator_stats (028)  │   │
│   └────────────────────────────┘   │
└────────────────────────────────────┘
```

### Wie der User-Flow funktioniert

1. User ist auf `staging.herr.tech` oder `world.herr.tech` eingeloggt
2. Klickt in der Toolbox auf „KI Video Creator"
3. **`src/app/dashboard/ki-toolbox/video-creator/page.tsx`** (Server Component):
   - prüft Session via Supabase
   - prüft Premium-Tier (fällt auf `<PremiumGate>` zurück falls nicht premium/admin)
   - rendert **`<SSORedirect workerUrl="https://vc.herr.tech" />`**
4. **`SSORedirect.tsx`** (Client Component):
   - holt `supabase.auth.getSession()` im Browser
   - liest aktuelles Theme aus `useTheme()` + `window.location.origin`
   - baut URL: `https://vc.herr.tech/sso?next=/projects#at=<token>&rt=<refresh>&theme=dark&back=https://staging.herr.tech/dashboard/ki-toolbox`
   - `window.location.replace(url)` — Tokens sind im **Fragment** (`#`), landen nie in Server-Logs/Referrer
5. Worker `/sso.js` (Client-Page):
   - liest Fragment-Werte
   - POSTed `access_token + refresh_token` an `/api/auth/sso`
   - Worker verifiziert Token über `supabase.auth.getUser(token)`
   - Setzt HttpOnly-Cookies `sb-at`, `sb-rt` auf `vc.herr.tech`
   - Speichert `htvc-theme` + `htvc-back` als normale Cookies (Client-read)
   - `window.location.replace('/projects')` (Default) bzw. `/` (wenn Liste leer)
6. User ist im Video Creator eingeloggt, im richtigen Theme, mit funktionierendem „← World"-Button

---

## Repositories & Pfade

### Worker-Repo
- **GitHub:** `github.com/jacob-sc/herr-tech-video-creator`
- **Default-Branch:** `feature/restore-ui` (auf diesem Branch läuft der Hetzner-Container)
- **Lokal:** `/Users/jacob/claude/video-creator-migration`
- **Pre-Strip-Referenz:** UI stammt aus Commit `b2560ab^` (zurückgeholt via `git checkout`)

### herrtechgpt-Repo (dieser hier)
- **GitHub:** `github.com/Startup1993/herrtechgpt`
- **Default-Branch:** `main` (→ Staging), `production` (→ Live)
- **Video-Creator-Relevanter Code:**
  - `src/app/dashboard/ki-toolbox/page.tsx` — Toolbox-Übersicht, Kachel mit Herr-Tech-Lila-Icon
  - `src/app/dashboard/ki-toolbox/video-creator/page.tsx` — Server-Component mit Auth + Premium-Gate
  - `src/app/dashboard/ki-toolbox/video-creator/SSORedirect.tsx` — Client-Component für Handshake
  - `src/app/dashboard/ki-toolbox/video-creator/PremiumGate.tsx` — Non-Premium-Fallback
  - `src/components/sidebar.tsx` — Drill-Down-Eintrag für Toolbox
  - `supabase/migrations/028_video_creator_stats.sql` — User-Stats-Tabelle + SECURITY DEFINER RPC

### Gelöscht in PR #43 (sind **nicht** mehr da):
- `src/lib/video-creator-api.ts`
- `src/app/api/video-creator/[...path]/route.ts` (Proxy-Route)
- `src/app/dashboard/ki-toolbox/video-creator/VideoCreatorHome.tsx`
- `src/app/dashboard/ki-toolbox/video-creator/NewProjectForm.tsx`
- `src/app/dashboard/ki-toolbox/video-creator/ScenesView.tsx`
- Unterrouten `new/`, `scenes/`, `setup/`

**Wenn ein Chat diese Dateien wiederbelebt hat — das ist ein Fehler.** Die Architektur-Entscheidung war bewusst: Statt 8000 Zeilen UI zu portieren, nutzen wir die komplette restaurierte UI auf dem Worker.

---

## Hetzner-Server

| Was | Wert |
|---|---|
| IP | `178.104.27.49` |
| Domain | `vc.herr.tech` (GoDaddy A-Record) |
| Server-Typ | CPX22 (3 vCPU, 4 GB RAM, 80 GB SSD) |
| SSH (root) | `ssh -i ~/.ssh/hetzner_ed25519 -o IdentitiesOnly=yes root@178.104.27.49` |
| SSH (deploy) | `ssh -i ~/.ssh/hetzner_ed25519 -o IdentitiesOnly=yes deploy@178.104.27.49` |
| App-Verzeichnis | `/opt/video-creator-worker` |
| Container-Namen | `video-creator-worker-worker-1`, `video-creator-worker-caddy-1` |
| Volumes (persistent) | `worker-projects` → `/app/data/projects`, `worker-uploads` → `/app/uploads`, `worker-out` → `/app/out` |

### Deploy-Befehle

```bash
# Deploy nach Push auf Worker-Branch:
ssh -i ~/.ssh/hetzner_ed25519 -o IdentitiesOnly=yes deploy@178.104.27.49
cd /opt/video-creator-worker
git pull
docker compose up -d --build

# Status / Logs:
docker compose ps
docker compose logs -f worker
docker compose logs -f caddy
```

**Wichtig:** `git pull` zieht den aktuell ausgecheckten Branch. Aktuell ist das `feature/restore-ui`. Wenn du auf einem anderen Branch arbeitest, vorher auf Server `git checkout <branch>`.

---

## Env-Variablen

### Vercel (herrtechgpt-Projekt, Project-Variables)

- `VIDEO_CREATOR_PUBLIC_URL=https://vc.herr.tech` (optional, Default ist `https://vc.herr.tech` im Code)
- **`VIDEO_CREATOR_INTERNAL_URL` wird NICHT mehr benötigt** — die alte Proxy-Route ist weg. Falls die ENV noch gesetzt ist: harmlos, einfach drin lassen.

### Hetzner `/opt/video-creator-worker/.env` (auf Server, gitignored)

```ini
DOMAIN=vc.herr.tech
ALLOWED_ORIGINS=https://world.herr.tech,https://staging.herr.tech

NEXT_PUBLIC_SUPABASE_URL=<aus Supabase → Settings → API>
SUPABASE_SERVICE_ROLE_KEY=<Secret key, beginnt mit sb_secret_>

ANTHROPIC_API_KEY=<console.anthropic.com>
OPENAI_API_KEY=<platform.openai.com>
FAL_KEY=<fal.ai/dashboard/keys>
GOOGLE_API_KEY=<aistudio.google.com/apikey>

# Optional für Vertex-Imagen-Fallback:
GOOGLE_CLOUD_PROJECT=<...>
GOOGLE_CLOUD_LOCATION=us-central1
```

**Nach Änderungen:** `docker compose up -d --build` (nicht nur `restart` — Compose-ENVs werden beim Start gecacht).

---

## Auth-Details im Worker

- **`src/lib/api-auth.js`**: `requireAuth()` akzeptiert ZWEI Quellen:
  1. `Authorization: Bearer <token>` — für Direktaufrufe (Tests, externe Clients)
  2. Cookie `sb-at` — für Browser-Requests nach SSO-Handshake
- **`src/lib/use-session.js`**: Drop-in-Ersatz für `next-auth/react` (hook `useSession()` + `signOut()`) über `/api/auth/me` bzw. `/api/auth/signout`
- **`src/pages/_app.js`**: globaler Auth-Guard — redirected Unauthenticated zu `/auth/signin` (Ausnahmen: `/sso`, `/auth/signin` selbst)
- **Token-Lifetime:** Supabase Access-Token ~1h, Refresh-Token ~30 Tage. Bei Ablauf geht der User auf `/auth/signin` und wird zur Plattform zurückgeschickt (Re-SSO via Kachel-Klick).

### User-Switch-Verhalten

Jeder Kachel-Klick in herrtechgpt triggert den SSO-Handshake komplett neu. Die Worker-Cookies werden dadurch **immer überschrieben**. Heißt: Logout auf herrtechgpt + Login als anderer User + Kachel-Klick = neuer User im Worker, alter Cookie weg.

**Edge-Case (nicht blockiert):** Wer `vc.herr.tech/projects` direkt aus dem Bookmark öffnet ohne über die Kachel zu gehen, sieht bis zu 1h die alte Session (bis Access-Token abläuft). Das ist Supabase-Limitation — Token-Revocation serverseitig existiert nicht. In der Praxis irrelevant, da der Standardweg die Kachel ist.

---

## Theme-System im Worker

- **`src/app/globals.css`**: CSS-Variables-Set für Dark (default) und Light (`[data-theme="light"]`). **Accent ist in beiden Modes `#B598E2`** (Herr-Tech-Lila, identisch zu World). Kein Tailwind-Purple.
- **`src/lib/theme.js`**: `T`-Objekt mit CSS-Variable-Strings als Drop-in-Ersatz für die alten inline-`const T = {...}`-Blöcke
- **`src/lib/theme-context.js`**: `<ThemeProvider>` + `useTheme()` Hook
- **`src/pages/_app.js`**: Inline-No-Flash-Script im `<head>` verhindert Theme-Flash beim Laden
- **Theme-Toggle** im NavBar (Komponente `src/components/NavBar.jsx`) persistiert via Cookie `htvc-theme`
- **Initial-Theme aus herrtechgpt**: kommt beim SSO im URL-Fragment an (`&theme=light|dark`), Worker speichert es und nutzt es sofort

---

## Projekt-Daten (Worker-Volume)

- Projekt-JSONs liegen unter `/app/data/projects/<projectId>/project.json` (NICHT `/app/tmp/projects` — das war der Volume-Bug bis PR #1/#2 im Worker-Repo)
- Screenshots: `/app/data/projects/<id>/screenshots/`
- Generierte Bilder: `/app/data/projects/<id>/generated-images/`
- Generierte Videos: `/app/data/projects/<id>/generated-videos/`
- Uploads (Original-Videos): `/app/uploads/`
- Exports (Remotion-Output): `/app/out/`

**Alle Ordner sind Docker-Volumes** → überleben Container-Rebuilds.

Warum JSON und nicht Supabase? FFmpeg + Remotion + yt-dlp arbeiten eh lokal auf dem Dateisystem. Supabase Storage wäre Overhead ohne Vorteil.

---

## Deploy-Flow (strikt einhalten!)

### herrtechgpt (Standard Next-App)
```
feature-branch → PR → main (= Staging, auto-deploy Vercel) → PR main → production (= Live, nur auf Ansage!)
```

### Worker
```
feature-branch → PR → main (im Worker-Repo) → Jacob pullt auf Hetzner
```
Der Worker hat **kein automatisches Deploy**. Nach Merge auf Worker-main (oder direkter Push auf den aktuell gecheckten Branch auf dem Server) muss manuell `git pull && docker compose up -d --build` auf der Hetzner-Box gelaufen werden. Aktuelle Branch-Spitze am Server ist `feature/restore-ui`.

### ⚠ Geteilte Supabase-DB
Live und Staging nutzen dieselbe Supabase-Instanz. Bei DB-Änderungen (Migration, Seed, Bulk-Update): **immer vorher Jacob fragen**.

---

## Typische Debug-Wege

### „Worker nicht erreichbar"
```bash
ssh -i ~/.ssh/hetzner_ed25519 -o IdentitiesOnly=yes deploy@178.104.27.49
cd /opt/video-creator-worker
docker compose ps              # beide Container up?
docker compose logs --tail=50 worker
docker compose logs --tail=50 caddy
curl -sS https://vc.herr.tech/api/check-env   # API-Keys sichtbar? (Keys werden maskiert zurückgegeben)
```

### „SSO funktioniert nicht / User landet auf /auth/signin"
1. Browser-Konsole: ist `supabase.auth.getSession()` auf der herrtechgpt-Seite nicht-null?
2. Prüfe URL nach Redirect: Wenn `vc.herr.tech/auth/signin?next=...` → `/sso`-Handler hat die Tokens nicht durchbekommen
3. Caddy-Log: `docker compose logs caddy | grep "/sso\|/api/auth/sso"` — was kam tatsächlich rein?

### „Light-Mode sieht falsch aus"
- Accent muss `#B598E2` sein, nicht `#8b51e0` oder `#a855f7` (Tailwind-Purple). Check `src/app/globals.css` im Worker-Repo.
- Hardcoded-Farben in Pages: sollten auf `T.xxx` umgestellt sein (z.B. `T.card`, `T.border`, `T.muted`). Inline-Hex-Codes in Pages sind Tech-Debt.

### „Projekt-Daten nach Rebuild weg"
**Darf nicht mehr passieren** seit PR #1/#2 im Worker-Repo. Falls doch: check `docker-compose.yml` — `worker-projects:/app/data/projects` MUSS so stehen (nicht `/app/tmp/projects`!).

### „Preview-URL sperrt mich aus (401)"
Vercel hat Deployment-Protection auf Staging/Preview. Erfordert eingeloggten Vercel-User.

---

## Wichtige Architektur-Entscheidungen (und warum)

### 1. Worker auf Hetzner statt Vercel
FFmpeg, yt-dlp, Remotion, Chromium — auf Vercel nicht machbar. 60s-Timeout, keine persistenten Volumes. Hetzner CPX22 reicht für aktuelle Last.

### 2. SSO-Redirect statt Frontend-Portierung
Nach einem Versuch, die 1960-Zeilen-Scene-Editor in herrtechgpt zu portieren (PR #42 „Chunk 1"): festgestellt dass der komplette Flow (Upload, URL-Import, Setup, Scenes, Videos, Export) ~8000 Zeilen UI umfasst. Port hätte Wochen gedauert. Stattdessen: restaurierte komplette UI im Worker, SSO-Handshake für Sessions + Theme + Back-URL.

### 3. Cookie-Auth statt Bearer im Worker-Frontend
Alle bestehenden `fetch('/api/...')`-Calls im restaurierten Frontend funktionieren ohne Änderung, weil `requireAuth` zusätzlich das `sb-at`-Cookie akzeptiert.

### 4. Projekte als JSON auf Dateisystem
FFmpeg/Remotion braucht lokale Dateien. Supabase Storage wäre unnötig. Volume-Mount auf `/app/data/projects` sorgt für Persistence.

### 5. Bei leerer Projekt-Liste direkt zu `/`
User-Feedback: Erst-Besucher sollen nicht auf leere „Meine Projekte"-Seite fallen. `projects.js` redirected automatisch zu `/` wenn Liste leer.

---

## Wichtige Lessons (damit sie nicht wieder passieren)

- **Vercel rewrites() sind build-time-brittle.** Falls je wieder ein Proxy benötigt wird: Route-Handler (`app/api/.../[...path]/route.ts`), nicht `next.config.ts`.
- **Docker-Volume-Pfade im Code und in `docker-compose.yml` müssen übereinstimmen.** Früher war das nicht so → alle Daten gingen beim Rebuild verloren.
- **Supabase Access-Tokens sind nicht server-revocable.** Token-basierte Auth bedeutet: alter User kann bis Expiry Zugriff behalten. Akzeptabel für dieses Tool, aber als Architektur-Caveat zu wissen.
- **FAL-Key: Worker-Code akzeptiert `FAL_KEY` ODER `FAL_API_KEY`.** Beide Namen gleichwertig.
- **Supabase v2 API-Keys:** Service-Role beginnt mit `sb_secret_`, nicht mehr das klassische `eyJ…`-JWT-Format.
- **Hetzner-Rebuild injiziert SSH-Keys nicht zuverlässig.** Rescue-Mode ist verlässlicher als „Reset Root Password".

---

## Was funktioniert (End-to-End getestet)

- ✅ SSO-Flow (Staging + Live)
- ✅ Theme-Sync (Light ↔ Dark) zwischen herrtechgpt und Worker
- ✅ Back-Button „← World" führt zu Origin-Dashboard
- ✅ User-Switch via zweiten Login in herrtechgpt
- ✅ Neues Projekt via Prompt (Claude → Szenen-Skript)
- ✅ Neues Projekt via URL (YouTube/Insta/TikTok → yt-dlp → Whisper → Szenen)
- ✅ Neues Projekt via Upload (MP4 → Whisper → Szenen)
- ✅ Scene-Editor: Bild-Generierung (Gemini 3 Pro, Imagen-Fallback)
- ✅ Video-Generierung (FAL Kling v3 Standard, Veo 3.1 Lite)
- ✅ Remotion-Export als MP4
- ✅ Auto-Redirect zu `/` wenn Liste leer
- ✅ Bei Volume-Recreate: Daten bleiben (PR #1/#2 im Worker)
- ✅ Admin sieht Owner-Badges auf Projekt-Liste

---

## Checkliste vor größeren Änderungen

- [ ] Feature-Branch aus korrektem Base-Branch erstellt (`main` in herrtechgpt, `feature/restore-ui` im Worker falls Worker-Änderung)
- [ ] Lokaler Build grün (`npm run build` mit Node 22)
- [ ] Falls ENV-Änderungen: Vercel UND Hetzner-`.env` aktualisiert
- [ ] Falls Supabase-Schema: neue Migration + nach Rücksprache im SQL-Editor ausgeführt
- [ ] PR gegen `main`, nicht `production` (es sei denn explizit Live-Deploy gewünscht)
- [ ] Nach Merge: auf Staging testen. Bei Worker-Änderungen: `git pull && docker compose up -d --build` auf Hetzner

---

## Kontakt

- Jacob (Owner): jacob@startup-creator.com
- Jonas (Kollaborator): jonas@startup-creator.com
