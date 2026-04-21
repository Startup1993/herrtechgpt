-- Support-Chat mit Admin-Takeover:
--   mode:   'ai'    → KI antwortet (Standard)
--           'human' → Admin antwortet manuell, KI aus
--   status: 'new'      → neu / offen / wartet auf Antwort
--           'answered' → Admin hat geantwortet
--           'resolved' → Admin hat als erledigt markiert

ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS mode text NOT NULL DEFAULT 'ai'
    CHECK (mode IN ('ai','human')),
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new','answered','resolved'));

-- Messages um 'admin' (Admin-Antwort) und 'system' (auto-Marker wie "— an Team weitergeleitet —") erweitern
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_role_check;
ALTER TABLE public.messages ADD CONSTRAINT messages_role_check
  CHECK (role IN ('user','assistant','admin','system'));

-- Index f\u00fcr Admin-Inbox: schnelles Filtern auf offene Tickets
CREATE INDEX IF NOT EXISTS idx_conversations_help_tickets
  ON public.conversations (agent_id, status, updated_at DESC)
  WHERE agent_id = 'help';
