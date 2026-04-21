-- Unread-Flag f\u00fcr User-Seite: wird auf true gesetzt wenn Admin in einem
-- Help-Ticket antwortet, und auf false wenn der User den Chat \u00f6ffnet.
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS user_has_unread boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_conversations_user_unread
  ON public.conversations (user_id, user_has_unread)
  WHERE user_has_unread = true;
