/**
 * Generiert 2-3 Sätze Beschreibung pro Video aus Transkripten (knowledge_base)
 * oder aus Titel + Projektname für Videos ohne Transkript.
 *
 * Usage: node scripts/generate-descriptions.mjs
 * Requires: ANTHROPIC_API_KEY, WISTIA_API_KEY, SUPABASE keys in .env.local
 */

import { readFileSync } from 'fs'

// ── .env.local laden ─────────────────────────────────────────────────────────
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
const env = Object.fromEntries(
  envFile.split('\n').filter(l => l && !l.startsWith('#')).map(l => {
    const eq = l.indexOf('=')
    return [l.slice(0, eq), l.slice(eq + 1)]
  })
)

const ANTHROPIC_KEY = env.ANTHROPIC_API_KEY
const WISTIA_KEY = env.WISTIA_API_KEY
const SB_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SB_KEY = env.SUPABASE_SERVICE_ROLE_KEY

if (!ANTHROPIC_KEY || !WISTIA_KEY || !SB_URL || !SB_KEY) {
  console.error('Missing env vars. Check .env.local')
  process.exit(1)
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function supabaseGet(path) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
  })
  return res.json()
}

async function supabaseUpsert(table, rows) {
  const res = await fetch(`${SB_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify(rows),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Supabase upsert failed: ${err}`)
  }
}

async function claudeGenerate(prompt) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Claude API error: ${err}`)
  }
  const data = await res.json()
  return data.content[0].text.trim()
}

function decodeEntities(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('📥 Lade Wistia-Videos...')

  // 1. Alle Wistia-Videos holen
  let allVideos = []
  for (let page = 1; page <= 5; page++) {
    const res = await fetch(
      `https://api.wistia.com/v1/medias.json?api_password=${WISTIA_KEY}&per_page=100&page=${page}`
    )
    const batch = await res.json()
    if (!Array.isArray(batch) || batch.length === 0) break
    allVideos.push(...batch)
    if (batch.length < 100) break
  }
  console.log(`  ${allVideos.length} Videos von Wistia geladen`)

  // 2. Bereits generierte Beschreibungen laden
  const existing = await supabaseGet('video_descriptions?select=video_id')
  const existingIds = new Set(existing.map(e => e.video_id))
  console.log(`  ${existingIds.size} Beschreibungen bereits vorhanden`)

  // 3. Transkripte aus knowledge_base laden (erste 2 Chunks pro Video)
  const transcripts = await supabaseGet(
    'knowledge_base?select=video_id,video_name,chunk_text,chunk_index&is_active=eq.true&chunk_index=lte.1&order=video_id,chunk_index&limit=200'
  )

  // Gruppieren nach video_id
  const transcriptMap = {}
  for (const t of transcripts) {
    if (!transcriptMap[t.video_id]) {
      transcriptMap[t.video_id] = { name: t.video_name, text: '' }
    }
    transcriptMap[t.video_id].text += ' ' + t.chunk_text
  }
  console.log(`  ${Object.keys(transcriptMap).length} Videos mit Transkript`)

  // 4. Videos filtern die noch keine Beschreibung haben
  const todo = allVideos
    .filter(v => (v.duration ?? 0) >= 60)
    .filter(v => !existingIds.has(String(v.id)))

  console.log(`\n🚀 ${todo.length} Videos brauchen Beschreibungen\n`)

  let generated = 0
  const rows = []

  for (let i = 0; i < todo.length; i++) {
    const video = todo[i]
    {
      const videoId = String(video.id)
      const title = decodeEntities(video.name)
      const project = decodeEntities(video.project?.name ?? '')
      const transcript = transcriptMap[videoId]

      let prompt
      if (transcript && transcript.text.length > 100) {
        const preview = transcript.text.slice(0, 1500)
        prompt = `Du schreibst eine kurze Video-Beschreibung für eine Lernplattform (KI-Marketing-Community).

Video-Titel: "${title}"
Kurs/Ordner: "${project}"
Transkript-Auszug:
"""
${preview}
"""

Schreibe genau 2-3 Sätze auf Deutsch, die beschreiben was man in diesem Video lernt.
Schreibe in der 2. Person ("Du lernst...", "Du erfährst...").
Keine Einleitung, kein "In diesem Video" — direkt zum Inhalt.
Maximal 200 Zeichen.`
      } else {
        prompt = `Du schreibst eine kurze Video-Beschreibung für eine Lernplattform (KI-Marketing-Community).

Video-Titel: "${title}"
Kurs/Ordner: "${project}"

Schreibe genau 2-3 Sätze auf Deutsch, die beschreiben was man vermutlich in diesem Video lernt (basierend auf Titel und Kursname).
Schreibe in der 2. Person ("Du lernst...", "Du erfährst...").
Keine Einleitung, kein "In diesem Video" — direkt zum Inhalt.
Maximal 200 Zeichen.`
      }

      try {
        const description = await claudeGenerate(prompt)
        rows.push({ video_id: videoId, description })
        generated++
        console.log(`  ✅ ${title.slice(0, 50)}...`)
      } catch (err) {
        console.error(`  ❌ ${title}: ${err.message}`)
      }
    }

    // Alle 10 Videos in Supabase speichern
    if (rows.length >= 10) {
      await supabaseUpsert('video_descriptions', rows)
      rows.length = 0
    }

    // Rate limit: 13s zwischen Requests (max 5/Min)
    if (i < todo.length - 1) {
      await new Promise(r => setTimeout(r, 13000))
    }
  }

  // Rest speichern
  if (rows.length > 0) {
    await supabaseUpsert('video_descriptions', rows)
  }

  console.log(`\n✅ Fertig! ${generated} Beschreibungen generiert.`)
}

main().catch(console.error)
