@AGENTS.md

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
