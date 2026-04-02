"""
Agenten-Kategorisierung der Wissensbasis
Weist jedem Video die relevanten Agenten-IDs zu.

Verwendung:
  python3 scripts/categorize-knowledge.py

Agenten:
  content-hook        → Hooks, viraler Content, Skripte, Social Media
  funnel-monetization → Sales, Funnels, Leadgenerierung, E-Mail, LinkedIn
  personal-growth     → Mindset, Produktivität, persönliche Entwicklung
  ai-prompt           → Prompting, ChatGPT, KI-Nutzung, Workflows
  herr-tech           → KI-Tools, Automatisierung, n8n, Make, Tech
  business-coach      → Business-Strategie, Wachstum, Positionierung
"""

import requests
import json
import re
import os
import time

# ─── Konfiguration ─────────────────────────────────────────────────────────────
def _load_env():
    for path in [
        os.path.join(os.path.dirname(__file__), '..', '.env.local'),
        os.path.join(os.path.dirname(__file__), '..', '..', '..', '..', '.env.local'),
    ]:
        if os.path.exists(path):
            with open(path) as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        k, v = line.split('=', 1)
                        os.environ[k.strip()] = v.strip()
            return

_load_env()

SUPABASE_URL  = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_KEY  = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
ANTHROPIC_KEY = os.environ.get("ANTHROPIC_API_KEY", "")

SUPABASE_HEADERS = {
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "apikey": SUPABASE_KEY,
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
}

AGENT_IDS = [
    "content-hook",
    "funnel-monetization",
    "personal-growth",
    "ai-prompt",
    "herr-tech",
    "business-coach",
]

# ─── Supabase ──────────────────────────────────────────────────────────────────

def get_all_videos() -> list:
    """Holt alle Videos (einen Chunk pro Video als Preview)."""
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/knowledge_base",
        headers=SUPABASE_HEADERS,
        params={
            "select": "video_id,video_name,chunk_text,chunk_index,relevant_agents",
            "chunk_index": "eq.0",
            "order": "video_id",
        }
    )
    r.raise_for_status()
    return r.json()


def update_agents(video_id: str, agents: list[str]):
    """Speichert die relevant_agents für ein Video."""
    r = requests.patch(
        f"{SUPABASE_URL}/rest/v1/knowledge_base",
        headers=SUPABASE_HEADERS,
        params={"video_id": f"eq.{video_id}"},
        json={"relevant_agents": agents}
    )
    return r.status_code in [200, 204]


# ─── Claude Kategorisierung ────────────────────────────────────────────────────

def categorize_batch(videos: list) -> list:
    """
    Schickt eine Gruppe von Videos an Claude.
    Claude weist jedem Video die passenden Agent-IDs zu.
    """
    lines = []
    for v in videos:
        preview = v["chunk_text"][:600].strip()
        lines.append(
            f"VIDEO_ID: {v['video_id']}\n"
            f"TITEL: {v['video_name']}\n"
            f"INHALT: {preview}\n---"
        )

    prompt = f"""Du kategorisierst Videos einer KI-Marketing-Community für verschiedene KI-Assistenten.

Verfügbare Agenten-IDs und ihre Themen:
- content-hook: Hooks, viraler Content, Social Media Skripte, Algorithmus, Storytelling, Content-Strategie
- funnel-monetization: Sales Funnels, Monetarisierung, Leadgenerierung, E-Mail Marketing, LinkedIn Akquise, Kaltakquise, Verkaufsgespräche
- personal-growth: Mindset, Produktivität, persönliche Entwicklung, Motivation
- ai-prompt: Prompting-Techniken, ChatGPT-Nutzung, KI-Workflows, Prompt Engineering
- herr-tech: KI-Tools allgemein, Automatisierung, n8n, Make, Tech-Setup, Video-Generierung, KI-Avatare, Tools-Vergleich
- business-coach: Business-Strategie, Unternehmenswachstum, Skalierung, Positionierung, Community-Aufbau

Regeln:
- Ein Video kann mehrere Agenten haben (wenn es mehrere Themen abdeckt)
- Live Calls decken oft mehrere Themen ab → mehrere Agenten vergeben
- Sei großzügig: wenn ein Thema auch nur am Rande vorkommt, den Agenten trotzdem vergeben
- Kurze Videos (<2 min) die Intros/Testimonials sind → leeres Array []

Antworte NUR mit einem JSON-Array:
[
  {{"video_id": "12345678", "agents": ["content-hook", "herr-tech"]}},
  ...
]

Videos:

{chr(10).join(lines)}
"""

    r = requests.post(
        "https://api.anthropic.com/v1/messages",
        headers={
            "x-api-key": ANTHROPIC_KEY,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
        json={
            "model": "claude-sonnet-4-5-20250929",
            "max_tokens": 2048,
            "messages": [{"role": "user", "content": prompt}]
        }
    )

    resp = r.json()
    if "content" not in resp:
        raise Exception(f"API Fehler: {resp.get('error', resp)}")

    text = resp["content"][0]["text"]
    match = re.search(r'\[.*\]', text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            print(f"   JSON Parse Fehler. Antwort: {text[:300]}")
    return []


# ─── Hauptprogramm ─────────────────────────────────────────────────────────────

def main():
    print("🏷️  Agenten-Kategorisierung der Wissensbasis")
    print("=" * 50)

    print("📋 Lade Videos aus Supabase...")
    videos = get_all_videos()

    # Nur Videos ohne Kategorie (neu oder noch nicht kategorisiert)
    uncategorized = [v for v in videos if not v.get("relevant_agents")]
    already_done  = len(videos) - len(uncategorized)

    print(f"   {len(videos)} Videos gesamt")
    print(f"   {already_done} bereits kategorisiert")
    print(f"   {len(uncategorized)} werden jetzt kategorisiert\n")

    if not uncategorized:
        print("✅ Alle Videos bereits kategorisiert!")
        return

    # Batches à 20 Videos (Rate-Limit: 10k tokens/min)
    BATCH_SIZE = 20
    batches = [uncategorized[i:i+BATCH_SIZE] for i in range(0, len(uncategorized), BATCH_SIZE)]
    total_updated = 0

    for i, batch in enumerate(batches):
        print(f"🤖 Batch {i+1}/{len(batches)} ({len(batch)} Videos)...")
        decisions = categorize_batch(batch)

        for d in decisions:
            vid_id = str(d.get("video_id", ""))
            agents = d.get("agents", [])
            # Nur gültige Agent-IDs übernehmen
            valid_agents = [a for a in agents if a in AGENT_IDS]

            video = next((v for v in batch if v["video_id"] == vid_id), None)
            if not video:
                continue

            name = video["video_name"]
            if valid_agents:
                update_agents(vid_id, valid_agents)
                print(f"   ✅ {name[:50]} → {', '.join(valid_agents)}")
            else:
                update_agents(vid_id, [])
                print(f"   ⬜ {name[:50]} → (kein Agent)")
            total_updated += 1

        if i < len(batches) - 1:
            print("   ⏳ Warte 65s (Rate-Limit)...")
            time.sleep(65)

    print(f"\n{'=' * 50}")
    print(f"✅ {total_updated} Videos kategorisiert!")
    print("\nJetzt kann jeder Agent gezielt auf sein Wissen zugreifen.")


if __name__ == "__main__":
    main()
