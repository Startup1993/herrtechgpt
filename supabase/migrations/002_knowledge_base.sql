-- Knowledge Base Tabelle für Wistia-Transkripte (RAG)
CREATE TABLE IF NOT EXISTS knowledge_base (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id         text NOT NULL,
  video_name       text NOT NULL,
  chunk_text       text NOT NULL,
  chunk_index      integer NOT NULL DEFAULT 0,
  duration_minutes real,
  is_active        boolean DEFAULT true,
  source           text DEFAULT 'wistia',
  created_at       timestamptz DEFAULT now()
);

-- Volltext-Suche auf Deutsch
CREATE INDEX IF NOT EXISTS knowledge_base_fts_idx
  ON knowledge_base USING GIN (to_tsvector('german', chunk_text));

-- Schnelle Suche nach video_id
CREATE INDEX IF NOT EXISTS knowledge_base_video_idx
  ON knowledge_base (video_id);

-- Row Level Security
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;

-- Service Role hat vollen Zugriff (für das Script)
CREATE POLICY "Service role full access"
  ON knowledge_base FOR ALL
  USING (true);

-- Authentifizierte Nutzer können lesen (für den Chat)
CREATE POLICY "Authenticated users can read active knowledge"
  ON knowledge_base FOR SELECT
  TO authenticated
  USING (is_active = true);
