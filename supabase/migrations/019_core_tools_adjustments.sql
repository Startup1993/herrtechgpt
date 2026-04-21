-- Core Tools Anpassungen (nach User-Feedback)
-- - Midjourney raus, Nano Banana 2 rein
-- - Seedance 2.0, Kling AI, Higgsfield rein (neben Sora 2 und Veo 3)
-- - ManyChat rein (DM-Automation Social)
-- Alle idempotent via ON CONFLICT, damit die Migration gefahrlos mehrfach laufen kann.

DELETE FROM public.core_tools WHERE id = 'midjourney';

INSERT INTO public.core_tools (id, name, category, tier, what_for, why_we_use_it, alternatives_handled, relevant_agents, url, icon, sort_order) VALUES

('nano-banana', 'Nano Banana 2',
 'image', 'primary',
 'Bildgenerierung & Bild-Editing',
 'Googles neues Image-Model — beste Qualität für Thumbnails, Hero-Images, Brand-Visuals. Stark im Editing bestehender Bilder.',
 ARRAY['Midjourney', 'DALL-E', 'Stable Diffusion', 'Flux'],
 ARRAY['content-hook', 'ai-prompt'],
 'https://gemini.google.com', '🍌', 11),

('seedance', 'Seedance 2.0',
 'video', 'primary',
 'Text- und Bild-zu-Video Generation',
 'ByteDance Video-Model — sehr starke Motion-Konsistenz und Camera-Control. Komplementär zu Sora 2 und Veo 3.',
 ARRAY['Pika', 'Luma', 'Runway'],
 ARRAY['content-hook', 'ai-prompt'],
 'https://seed.bytedance.com', '💃', 6),

('kling', 'Kling AI',
 'video', 'primary',
 'Text-/Bild-zu-Video mit langen Szenen',
 'Kuaishous Video-Model — bis zu 2 Min Clips, sehr gut bei Charakter-Konsistenz und Motion-Brush.',
 ARRAY['Pika', 'Luma', 'Runway'],
 ARRAY['content-hook', 'ai-prompt'],
 'https://klingai.com', '🎞️', 7),

('higgsfield', 'Higgsfield',
 'video', 'primary',
 'Kamera-Bewegungen & Cinematic-Video',
 'Spezialisiert auf cineastische Camera-Moves (Dolly, Orbit, Crash Zoom) und Motion-Templates für Social-Content.',
 ARRAY['Pika', 'Luma', 'Runway'],
 ARRAY['content-hook', 'ai-prompt'],
 'https://higgsfield.ai', '🎥', 8),

('manychat', 'ManyChat',
 'automation', 'primary',
 'DM-Automation für Instagram, Facebook, WhatsApp',
 'Standard für Lead-Capture aus Social: Kommentar-Trigger, Story-Reply-Flows, Opt-ins. Pflicht für Reach-to-Sales-Funnels.',
 ARRAY['ChatFuel', 'MobileMonkey', 'Respond.io'],
 ARRAY['funnel-monetization', 'content-hook'],
 'https://manychat.com', '💬', 12)

ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  tier = EXCLUDED.tier,
  what_for = EXCLUDED.what_for,
  why_we_use_it = EXCLUDED.why_we_use_it,
  alternatives_handled = EXCLUDED.alternatives_handled,
  relevant_agents = EXCLUDED.relevant_agents,
  url = EXCLUDED.url,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order,
  active = true;

-- Sort-Order neu aufräumen, damit die Reihenfolge in der Admin-UI sinnvoll gruppiert ist
UPDATE public.core_tools SET sort_order = 1  WHERE id = 'claude';
UPDATE public.core_tools SET sort_order = 2  WHERE id = 'claude-code';
UPDATE public.core_tools SET sort_order = 3  WHERE id = 'n8n';
UPDATE public.core_tools SET sort_order = 4  WHERE id = 'sora';
UPDATE public.core_tools SET sort_order = 5  WHERE id = 'veo';
UPDATE public.core_tools SET sort_order = 6  WHERE id = 'seedance';
UPDATE public.core_tools SET sort_order = 7  WHERE id = 'kling';
UPDATE public.core_tools SET sort_order = 8  WHERE id = 'higgsfield';
UPDATE public.core_tools SET sort_order = 9  WHERE id = 'heygen';
UPDATE public.core_tools SET sort_order = 10 WHERE id = 'capcut';
UPDATE public.core_tools SET sort_order = 11 WHERE id = 'nano-banana';
UPDATE public.core_tools SET sort_order = 12 WHERE id = 'manychat';
UPDATE public.core_tools SET sort_order = 13 WHERE id = 'notion';
UPDATE public.core_tools SET sort_order = 14 WHERE id = 'chatgpt';
