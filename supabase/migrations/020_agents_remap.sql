-- Agenten-Neudefinition (Reach Machine, Sales Engine, Automation Lab, AI Power User,
-- AI Video Studio, Scale Coach — personal-growth versteckt).
--
-- Code-Teil (Umbenennung via src/lib/agents.ts) braucht keine DB-Migration, weil
-- Agent-IDs (content-hook, funnel-monetization, herr-tech, ai-prompt, business-coach)
-- unverändert bleiben — alte Conversations funktionieren weiter.
--
-- Diese Migration kümmert sich nur um die Tool-Zuordnungen:
-- 1. NEUER Agent `ai-video-studio` bekommt die relevanten Video-/Image-/Basis-Tools
-- 2. `personal-growth` wird aus allen Tool-Zuordnungen entfernt (Agent versteckt)

-- 1) ai-video-studio zu relevanten Tools hinzufügen (idempotent)
UPDATE public.core_tools
SET relevant_agents = relevant_agents || ARRAY['ai-video-studio']
WHERE id IN (
  'claude',        -- Basis-KI auch für Video-Konzeption
  'chatgpt',       -- Alternative Basis-KI
  'sora',          -- Sora 2
  'veo',           -- Veo 3
  'seedance',      -- Seedance 2.0
  'kling',         -- Kling AI
  'higgsfield',    -- Higgsfield
  'heygen',        -- HeyGen Avatare
  'capcut',        -- Finishing
  'nano-banana'    -- Thumbnails/Frames
)
AND NOT ('ai-video-studio' = ANY(relevant_agents));

-- 2) personal-growth aus allen Tool-Zuordnungen entfernen (hidden agent)
UPDATE public.core_tools
SET relevant_agents = array_remove(relevant_agents, 'personal-growth')
WHERE 'personal-growth' = ANY(relevant_agents);
