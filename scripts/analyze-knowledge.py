"""
KI-Relevanzanalyse der Wissensbasis
Vergleicht alle Transkripte chronologisch und deaktiviert überholte Inhalte.

Verwendung:
  python3 scripts/analyze-knowledge.py

Was es tut:
1. Liest alle Videos aus der Supabase knowledge_base
2. Ordnet sie chronologisch (Live Calls haben Datum im Namen)
3. Schickt eine Zusammenfassung an Claude
4. Claude entscheidet welche Inhalte durch neuere ersetzt wurden
5. Veraltete Videos werden automatisch deaktiviert
"""

import requests
import json
import re
import os
from datetime import datetime
from typing import Optional

# ─── Konfiguration (aus .env.local oder Umgebungsvariablen) ────────────────────
def _load_env():
    env_path = os.path.join(os.path.dirname(__file__), '..', '.env.local')
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, v = line.split('=', 1)
                    os.environ.setdefault(k.strip(), v.strip())

_load_env()

SUPABASE_URL  = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_KEY  = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
ANTHROPIC_KEY = os.environ.get("ANTHROPIC_API_KEY", "")

SUPABASE_HEADERS = {
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "apikey": SUPABASE_KEY,
    "Content-Type": "application/json",
}


# ─── Datum aus Videoname extrahieren ───────────────────────────────────────────

def extract_date(name: str) -> Optional[datetime]:
    """Extrahiert Datum aus Live-Call-Namen wie '2025_07_03' oder '2025-07-03'."""
    # Format: 2025_07_03 oder 2025-07-03
    match = re.search(r'(202\d)[_-](\d{2})[_-](\d{2})', name)
    if match:
        try:
            return datetime(int(match.group(1)), int(match.group(2)), int(match.group(3)))
        except ValueError:
            pass
    # Live Calls ohne Datum aber neuere Struktur → als aktuell behandeln
    if any(kw in name.lower() for kw in ['live call', 'recording', 'aufzeichnung']):
        return datetime(2025, 1, 1)  # Fallback: irgendwann 2025
    return None  # Strukturierte Kursvideos → kein Datum (älteres Kursmaterial)


# ─── Supabase Funktionen ───────────────────────────────────────────────────────

def get_all_videos() -> list:
    """Holt alle Videos mit ersten 2 Chunks aus der Wissensbasis."""
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/knowledge_base",
        headers=SUPABASE_HEADERS,
        params={
            "select": "video_id,video_name,chunk_text,chunk_index,duration_minutes,is_active",
            "order": "video_id,chunk_index",
        }
    )
    chunks = r.json()

    # Gruppieren: video_id → {info, first_chunks}
    videos = {}
    for c in chunks:
        vid = c["video_id"]
        if vid not in videos:
            videos[vid] = {
                "video_id": vid,
                "video_name": c["video_name"],
                "duration_minutes": c.get("duration_minutes", 0),
                "is_active": c["is_active"],
                "preview": "",
            }
        # Nur erste 2 Chunks als Preview (ca. 1000 Wörter)
        if c["chunk_index"] < 2:
            videos[vid]["preview"] += c["chunk_text"] + " "

    return list(videos.values())


def set_video_active(video_id: str, is_active: bool, reason: str):
    """Aktiviert oder deaktiviert ein Video."""
    r = requests.patch(
        f"{SUPABASE_URL}/rest/v1/knowledge_base",
        headers=SUPABASE_HEADERS,
        params={"video_id": f"eq.{video_id}"},
        json={"is_active": is_active}
    )
    status = "✅ Aktiv" if is_active else "❌ Deaktiviert"
    print(f"  {status}: {reason}")
    return r.status_code in [200, 204]


# ─── Claude Analyse ────────────────────────────────────────────────────────────

def analyze_with_claude(video_summaries: str) -> dict:
    """
    Schickt alle Video-Zusammenfassungen an Claude.
    Claude entscheidet welche Videos veraltete Inhalte haben.
    """
    prompt = f"""Du analysierst die Wissensbasis einer KI-Marketing-Community.
Unten siehst du alle Videos mit ihrem Inhalt, sortiert chronologisch (älteste zuerst).

Deine Aufgabe:
1. Identifiziere Tools, Strategien oder Plattformen die in älteren Videos empfohlen werden, aber in neueren Live Calls als veraltet bezeichnet oder durch bessere Alternativen ersetzt wurden.
2. Identifiziere Videos die Tools beschreiben die mittlerweile eingestellt wurden (z.B. Sora von OpenAI).
3. Entscheide für jedes Video ob es noch relevant ist.

Wichtige Regeln:
- Live Calls (mit Datum im Namen) sind IMMER aktueller als nummerierten Kursvideos
- Wenn ein neuerer Live Call sagt "Tool X ist veraltet, nutzt jetzt Y" → alle Videos zu Tool X deaktivieren
- Nummerierten Kursmodule (01-, 02- etc.) sind Grundlagen und oft zeitlos → nur deaktivieren wenn klar überholt
- Im Zweifel: AKTIV lassen (lieber zu viel als zu wenig)

Antworte NUR mit einem JSON-Array im Format:
[
  {{
    "video_id": "12345678",
    "should_be_active": true/false,
    "reason": "Kurze Begründung auf Deutsch"
  }},
  ...
]

Hier sind die Videos:

{video_summaries}
"""

    r = requests.post(
        "https://api.anthropic.com/v1/messages",
        headers={
            "x-api-key": ANTHROPIC_KEY,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
        json={
            "model": "claude-opus-4-5",
            "max_tokens": 4096,
            "messages": [{"role": "user", "content": prompt}]
        }
    )

    text = r.json()["content"][0]["text"]

    # JSON aus Antwort extrahieren
    match = re.search(r'\[.*\]', text, re.DOTALL)
    if match:
        return json.loads(match.group())
    return []


# ─── Hauptprogramm ─────────────────────────────────────────────────────────────

def main():
    print("🔍 KI-Relevanzanalyse der Wissensbasis")
    print("=" * 50)

    print("📋 Lade Videos aus Supabase...")
    videos = get_all_videos()
    print(f"   {len(videos)} Videos gefunden")

    # Chronologisch sortieren: Live Calls mit Datum zuerst/zuletzt je nach Datum
    def sort_key(v):
        d = extract_date(v["video_name"])
        return d.timestamp() if d else 0  # Kursvideos ohne Datum → ganz am Anfang

    videos.sort(key=sort_key)

    # Video-Zusammenfassungen für Claude aufbauen
    print("\n📝 Bereite Analyse vor...")
    summaries = []
    for v in videos:
        date = extract_date(v["video_name"])
        date_str = date.strftime("%Y-%m-%d") if date else "Kursvideo (kein Datum)"
        preview = v["preview"][:800].strip()  # Max 800 Zeichen pro Video
        summaries.append(
            f"VIDEO_ID: {v['video_id']}\n"
            f"TITEL: {v['video_name']}\n"
            f"DATUM: {date_str}\n"
            f"DAUER: {round(v['duration_minutes'])} min\n"
            f"INHALT (Auszug): {preview}\n"
            f"---"
        )

    video_summaries = "\n\n".join(summaries)

    # An Claude senden (max. 100 Videos auf einmal um Kontext-Limit zu vermeiden)
    print(f"🤖 Sende {len(videos)} Videos an Claude zur Analyse...")
    print("   (Das dauert ca. 20-30 Sekunden...)\n")

    decisions = analyze_with_claude(video_summaries)

    if not decisions:
        print("❌ Keine Entscheidungen erhalten. Überprüfe die API-Verbindung.")
        return

    print(f"✅ Claude hat {len(decisions)} Entscheidungen getroffen:\n")

    # Entscheidungen anwenden
    activated = 0
    deactivated = 0
    for decision in decisions:
        vid_id = str(decision.get("video_id", ""))
        should_active = decision.get("should_be_active", True)
        reason = decision.get("reason", "")

        # Aktuellen Status finden
        current = next((v for v in videos if v["video_id"] == vid_id), None)
        if not current:
            continue

        # Nur ändern wenn nötig
        if current["is_active"] != should_active:
            print(f"📹 {current['video_name']}")
            set_video_active(vid_id, should_active, reason)
            if should_active:
                activated += 1
            else:
                deactivated += 1
        # Bereits korrekt → kurz anzeigen
        elif not should_active:
            print(f"📹 {current['video_name']} → bereits deaktiviert ✓")

    print("\n" + "=" * 50)
    print(f"✅ Aktiviert:    {activated}")
    print(f"❌ Deaktiviert:  {deactivated}")
    print(f"\n🎉 Wissensbasis ist jetzt auf dem aktuellen Stand!")
    print("   Tipp: Führe dieses Script monatlich aus um neue Live Calls einzubeziehen.")


if __name__ == "__main__":
    main()
