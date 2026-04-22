@AGENTS.md

# Projekt-Steckbrief: Herr Tech GPT

## Was ist das?
KI-Lern- und Coaching-Plattform für deutschsprachige Unternehmer. Powered by "Herr Tech" (Florian Hübner).

## Tech-Stack
- **Framework:** Next.js 16.2.1 (App Router) + React 19 + TypeScript
- **Styling:** Tailwind CSS v4 (`@theme inline` in globals.css)
- **DB + Auth:** Supabase (PostgreSQL + Auth + RLS)
- **AI:** Claude API via `@ai-sdk/anthropic` + `@ai-sdk/react`
- **Videos:** Wistia API + AssemblyAI Transkription
- **Node:** v22 erforderlich (`nvm use 22` bzw. `$HOME/.nvm/versions/node/v22.22.2/bin`)

## Routen-Struktur (NEU — Dashboard-First)
```
/dashboard                          → Startseite (3 Kacheln + Lernpfad)
/dashboard/classroom                → Video-Bibliothek (Wistia)
/dashboard/herr-tech-gpt            → Chat-Landing (6 Agenten als Karten)
/dashboard/herr-tech-gpt/[convId]   → Chat-Konversation
/dashboard/ki-toolbox               → Tool-Übersicht (Carousel, Video-Editor, Video-Creator)
/dashboard/ki-toolbox/carousel      → Instagram-Karussell-Generator
/dashboard/ki-toolbox/video-editor  → KI Video Editor
/dashboard/ki-toolbox/video-creator → KI Video Creator
/dashboard/help                     → Hilfe-Chat + Tickets
/dashboard/account                  → Profil, Einstellungen, Dark Mode
/dashboard/path                     → Lernpfad-Anzeige
/dashboard/onboarding               → Onboarding-Quiz

/admin                              → Admin Dashboard (KPIs)
/admin/users                        → Nutzerverwaltung
/admin/groups                       → Gruppen & Rechte
/admin/content/agents               → Assistenten verwalten
/admin/content/knowledge            → Wissensbasis verwalten
/admin/content/videos               → Video-Sync-Status
/admin/tickets                      → Support-Tickets
```

## DB-Tabellen (Supabase)
- `profiles` — User-Profil (role, access_tier, learning_path, background, market, etc.)
- `conversations` — Chat-Konversationen (user_id, agent_id, title)
- `messages` — Chat-Nachrichten (conversation_id, role, content)
- `saved_content` — Gespeicherte KI-Antworten
- `knowledge_base` — Video-Transkript-Chunks (FTS deutsch, agent-Zuordnung)
- `pending_transcripts` — AssemblyAI Transkriptions-Queue
- `sync_log` — Wistia-Sync-Protokoll
- `agent_configs` — Agent-Konfigurationen (CRUD via Admin)

## 6 KI-Agenten (`src/lib/agents.ts`)
herr-tech (Standard), content-hook, funnel-monetization, personal-growth, ai-prompt, business-coach

## Design
- **Primärfarbe:** Herr Tech Lila `#B598E2` (Hover: `#9b51e0`)
- **Light:** Background `#F5F0EB`, Surface `#FFFFFF`
- **Dark:** Background `#0F0F13`, Surface `#1A1A23`
- **Logo:** `/public/logo.png` — NIEMALS verzerren (`object-contain`, feste Höhe)
- **Font:** Geist Sans
- **Responsive-First:** Mobile → Tablet → Desktop

## Sidebar-Konzept: Drill-Down (3 Modi)
1. **Haupt-Sidebar:** Dashboard, Classroom, Herr Tech GPT, KI Toolbox, Hilfe, (Admin)
2. **Chat-Sidebar:** ← Zurück, Agenten-Liste, Letzte Chats, Neuer Chat
3. **Admin-Sidebar:** ← Zurück, Dashboard, Nutzer, Gruppen, Inhalte, Tickets

## Zugriffstiers
- **Free (basic):** Classroom (Videos) ✅ | Chat ❌ | Toolbox ❌
- **Premium:** Alles ✅
- **Admin:** Alles ✅ + Admin-Bereich

# Git-Kollaboration (Jacob & Jonas)

## Grundregeln
- **Niemals direkt auf `main` pushen** — immer Feature-Branch erstellen
- Vor neuer Arbeit: `git fetch --all && git pull --rebase origin main`
- Branch-Namensschema: `feature/kurze-beschreibung` oder `fix/kurze-beschreibung`
- Kollaborator Jonas: jonas@startup-creator.com

## Wenn der Benutzer „push", „pushen", „hochladen", „rausschicken" o.Ä. sagt:
1. `git status` + `git log --oneline origin/main..HEAD` prüfen — was haben wir gebaut?
2. Falls auf `main`: automatisch Feature-Branch erstellen (`git checkout -b feature/...`)
3. Geänderte Dateien committen mit prägnanter Commit-Message
4. Branch pushen und PR erstellen: `gh pr create --title "..." --body "..."`
5. **Niemals** `git push origin main` direkt ausführen — immer PR-Workflow

## Wenn Branches zusammengeführt werden sollen (Merge):
1. `git fetch --all` — neuesten Stand holen
2. Konflikte analysieren bevor rebase/merge: `git diff feature-branch...origin/main`
3. `git rebase origin/main` bevorzugen (saubere History, kein Merge-Commit-Chaos)
4. Bei inhaltlichen Konflikten: Benutzer fragen, welche Version Priorität hat
5. Nach Merge: Branch löschen (`git branch -d feature/...`)

## Push-Checkliste (immer durchgehen)
- [ ] Bin ich auf einem Feature-Branch? (`git branch --show-current`)
- [ ] Sind alle gewünschten Änderungen committed?
- [ ] Gibt es neue Commits auf `main` die ich nicht habe? (`git log HEAD..origin/main --oneline`)
- [ ] PR-Beschreibung erklärt was und warum?

# Deployment (Vercel)

## Environments
- **Live/Production:** `world.herr.tech` → deployed vom Branch `production`
- **Staging:** `herr-tech-gpt-git-main-*.vercel.app` (Preview-URL für `main`) → deployed automatisch bei jedem Merge nach `main`
- **Feature Previews:** Jeder PR bekommt automatisch eine eigene Vercel-Preview-URL

## Deploy-Flow (IMMER einhalten)
```
Feature-Branch → PR → main (Staging)  →  PR main → production (Live)
```
1. Arbeit läuft auf Feature-Branch (`feature/...` oder `fix/...`)
2. PR gegen `main` → nach Merge automatisch auf Staging-URL deployed
3. Jacob testet auf Staging
4. **NUR wenn Jacob explizit sagt „deploy live" / „auf Produktion" / „live schalten"** → PR `main → production` erstellen
5. Nach Jacobs OK: PR mergen → Vercel deployed automatisch auf `world.herr.tech`

## WICHTIG — Claude-Regeln
- **NIEMALS** direkt auf `production` pushen oder mergen ohne explizite Ansage
- **NIEMALS** Production-Deploy aus eigenem Antrieb anstoßen, auch nicht wenn „alles fertig" wirkt
- Bei „push"/„pushen" ohne Zusatz → immer nach `main` (Staging), nie auf `production`
- Explizite Live-Trigger sind nur: „deploy live", „auf Produktion deployen", „auf world.herr.tech", „live schalten", „auf die echte Domain"
- Bei Unsicherheit: **nachfragen**, nicht raten
