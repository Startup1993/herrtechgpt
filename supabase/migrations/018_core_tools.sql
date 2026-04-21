-- Core Tools: HerrTech Tech-Stack Whitelist
-- Diese Tabelle ist die Single Source of Truth für alle Tools, die Assistenten empfehlen dürfen.
-- Admin-UI: /assistants/admin/tools
--
-- Funktionsweise:
-- 1. Admin pflegt die Tools in dieser Tabelle (Add/Edit/Archive)
-- 2. Chat-Route zieht bei jedem Request die aktiven Tools pro Agent
-- 3. Tools werden in den System-Prompt injiziert
-- 4. Assistent empfiehlt nur noch Tools aus dieser Liste

CREATE TABLE IF NOT EXISTS public.core_tools (
  id text PRIMARY KEY,                        -- Slug, z.B. "claude", "n8n"
  name text NOT NULL,                         -- Anzeigename: "Claude"
  category text NOT NULL,                     -- "ki-chat" | "automation" | "video" | "image" | "video-edit" | "video-avatar" | "knowledge" | "coding" | "design"
  tier text NOT NULL DEFAULT 'primary',       -- "primary" | "secondary" | "fallback"
  what_for text NOT NULL,                     -- Kurzbeschreibung: "Chat, Code, Agents"
  why_we_use_it text,                         -- Begründung: "Beste Coding-Skills, Skills-System"
  alternatives_handled text[] DEFAULT '{}',   -- Tools, die User fragen könnte: ["ChatGPT", "Gemini"]
  relevant_agents text[] DEFAULT '{}',        -- Welche Agenten das Tool kennen: ["content-hook", "funnel-monetization"]
  url text,                                   -- Offizielle Website
  icon text,                                  -- Emoji
  active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_core_tools_active ON public.core_tools(active);
CREATE INDEX IF NOT EXISTS idx_core_tools_agents ON public.core_tools USING GIN(relevant_agents);
CREATE INDEX IF NOT EXISTS idx_core_tools_tier ON public.core_tools(tier);

ALTER TABLE public.core_tools ENABLE ROW LEVEL SECURITY;

-- Alle eingeloggten User dürfen lesen (für Chat-Route)
CREATE POLICY "Authenticated users can read core tools"
  ON public.core_tools FOR SELECT
  TO authenticated
  USING (active = true);

-- Nur Admins können schreiben
CREATE POLICY "Admins can modify core tools"
  ON public.core_tools FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Service Role (für Seeding)
CREATE POLICY "Service role full access"
  ON public.core_tools FOR ALL
  TO service_role
  USING (true);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_core_tools_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_core_tools_updated_at
  BEFORE UPDATE ON public.core_tools
  FOR EACH ROW
  EXECUTE FUNCTION update_core_tools_updated_at();

-- =============================================================================
-- SEED: 10 Platzhalter-Tools
-- =============================================================================
-- WICHTIG: Diese Einträge sind BEISPIELE, basierend auf der Diskussion:
-- - Claude 80% + n8n 20% für Automation
-- - Aktueller Fokus auf Claude, Sora 2
--
-- Der Admin sollte das über /assistants/admin/tools anpassen.
-- Die Daten sind nur vorgeseedet, damit die Chat-Route sofort funktioniert.
-- =============================================================================

INSERT INTO public.core_tools (id, name, category, tier, what_for, why_we_use_it, alternatives_handled, relevant_agents, url, icon, sort_order) VALUES

('claude', 'Claude',
 'ki-chat', 'primary',
 'Chat, Code, Reasoning, Agents, Automation',
 'Unser Rückgrat. Beste Coding-Skills, stärkstes Reasoning, nativer Skills-Support. 80% unserer KI-Arbeit läuft hier.',
 ARRAY['ChatGPT', 'Gemini', 'Mistral'],
 ARRAY['content-hook', 'funnel-monetization', 'personal-growth', 'ai-prompt', 'herr-tech', 'business-coach'],
 'https://claude.ai', '🤖', 1),

('claude-code', 'Claude Code',
 'coding', 'primary',
 'Autonomer Coding-Agent im Terminal',
 'Ersetzt Cursor und viele n8n-Workflows. Wenn du etwas automatisieren willst — erst hier versuchen, bevor du zu n8n gehst.',
 ARRAY['Cursor', 'Copilot', 'Windsurf'],
 ARRAY['ai-prompt', 'herr-tech'],
 'https://claude.com/claude-code', '⌨️', 2),

('n8n', 'n8n',
 'automation', 'primary',
 'Multi-Step-Workflows zwischen APIs',
 'Die 20%, die Claude allein nicht macht. Open-Source, selbst-hostbar, ohne Task-Limits. Für API-Chaining und Triggers.',
 ARRAY['Make', 'Zapier', 'Pipedream', 'Integromat'],
 ARRAY['funnel-monetization', 'herr-tech'],
 'https://n8n.io', '🔗', 3),

('sora', 'Sora 2',
 'video', 'primary',
 'Text-zu-Video Generation',
 'OpenAIs Video-Model. Für realistische Short-Clips, Hook-Intros und Cinematic-Content.',
 ARRAY['Pika', 'Luma', 'Runway'],
 ARRAY['content-hook', 'ai-prompt'],
 'https://openai.com/sora', '🎬', 4),

('veo', 'Veo 3',
 'video', 'primary',
 'Text-zu-Video mit nativem Audio',
 'Googles Video-Model. Stärker bei Audio-Cues und längeren Szenen. Komplementär zu Sora.',
 ARRAY['Pika', 'Luma', 'Runway'],
 ARRAY['content-hook', 'ai-prompt'],
 'https://deepmind.google/technologies/veo', '🎥', 5),

('heygen', 'HeyGen',
 'video-avatar', 'primary',
 'KI-Avatare und Voice-Clones',
 'Für Talking-Head-Content ohne selbst vor die Kamera zu gehen. Multi-Language ready.',
 ARRAY['Synthesia', 'D-ID', 'Captions'],
 ARRAY['content-hook'],
 'https://heygen.com', '🧑‍💼', 6),

('capcut', 'CapCut',
 'video-edit', 'primary',
 'Video-Schnitt (Mobile + Desktop)',
 'Unser Standard für Reels/TikTok-Schnitt. Auto-Captions, Effects, schnell.',
 ARRAY['Premiere', 'DaVinci', 'Final Cut'],
 ARRAY['content-hook'],
 'https://capcut.com', '✂️', 7),

('midjourney', 'Midjourney',
 'image', 'primary',
 'Bildgenerierung',
 'Beste ästhetische Qualität für Thumbnails, Hero-Images und Brand-Visuals.',
 ARRAY['DALL-E', 'Stable Diffusion', 'Flux'],
 ARRAY['content-hook', 'ai-prompt'],
 'https://midjourney.com', '🎨', 8),

('notion', 'Notion',
 'knowledge', 'primary',
 'Second Brain, Docs, Projektmanagement',
 'Unsere Knowledge Base. Docs, SOPs, Client-Tracking. Mit Claude-Integration super für Recherche-Workflows.',
 ARRAY['Obsidian', 'Roam', 'Coda'],
 ARRAY['herr-tech', 'ai-prompt', 'business-coach'],
 'https://notion.so', '📚', 9),

('chatgpt', 'ChatGPT',
 'ki-chat', 'secondary',
 'Alternative zu Claude, besonders für DALL-E und Code Interpreter',
 'Nutzen wir ergänzend zu Claude. Stark bei Bild-Generation in-Chat und bei Custom GPTs.',
 ARRAY['Gemini', 'Copilot'],
 ARRAY['content-hook', 'funnel-monetization', 'personal-growth', 'ai-prompt', 'herr-tech', 'business-coach'],
 'https://chatgpt.com', '💬', 10)

ON CONFLICT (id) DO NOTHING;
