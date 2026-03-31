-- Content Library: Saved AI responses
CREATE TABLE IF NOT EXISTS public.saved_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  agent_id TEXT,
  agent_name TEXT,
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.saved_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own saved content"
  ON public.saved_content
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
