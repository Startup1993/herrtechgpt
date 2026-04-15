-- Tracking für laufende AssemblyAI-Transkriptionen (async)
CREATE TABLE IF NOT EXISTS public.pending_transcripts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id text NOT NULL UNIQUE,
  video_name text NOT NULL,
  duration_minutes real,
  transcript_id text NOT NULL,
  status text NOT NULL DEFAULT 'queued',  -- queued | processing | completed | error
  error_message text,
  submitted_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_pending_transcripts_status ON public.pending_transcripts(status);

ALTER TABLE public.pending_transcripts ENABLE ROW LEVEL SECURITY;

-- Nur Service Role darf lesen/schreiben (Cron nutzt Service Key)
CREATE POLICY "Service role full access"
  ON public.pending_transcripts FOR ALL
  USING (true);

-- Log für abgeschlossene Sync-Runs + potenziell veraltete Videos
CREATE TABLE IF NOT EXISTS public.sync_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  run_at timestamptz DEFAULT now(),
  new_videos_found integer DEFAULT 0,
  videos_submitted integer DEFAULT 0,
  videos_completed integer DEFAULT 0,
  obsolete_flagged text[] DEFAULT '{}',
  notes text
);

ALTER TABLE public.sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read sync_log"
  ON public.sync_log FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role full access on sync_log"
  ON public.sync_log FOR ALL
  USING (true);
