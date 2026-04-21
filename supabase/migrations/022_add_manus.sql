-- Manus als neues Tool aufnehmen.
-- Kontext: Manus wurde von Meta übernommen, Nano Banana 2 ist integriert.
-- Starker autonomer Agent für Ads, Wettbewerbsanalysen und Daten-Dives.
-- Relevant für content-hook (Ads), funnel-monetization (Ads + Analyses),
-- business-coach (Analyses) und herr-tech (agentic automation).

INSERT INTO public.core_tools (id, name, category, tier, what_for, why_we_use_it, alternatives_handled, relevant_agents, url, icon, sort_order) VALUES

('manus', 'Manus',
 'automation', 'primary',
 'Autonomer KI-Agent für Ads, Analysen und Recherche-Workflows',
 'Seit Meta-Übernahme mit Nano Banana 2 integriert — starker Agent für Ad-Creatives, Wettbewerbsanalysen und Daten-Dives. Hält komplette Multi-Step-Tasks aus, ohne dass man ständig nachschubsen muss.',
 ARRAY['AutoGPT', 'AgentGPT', 'Devin'],
 ARRAY['content-hook', 'funnel-monetization', 'business-coach', 'herr-tech'],
 'https://manus.im', '🤝', 14)

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

-- Sort-Order: Manus nach ChatGPT einsortieren, ChatGPT auf 15 schieben
UPDATE public.core_tools SET sort_order = 1  WHERE id = 'claude';
UPDATE public.core_tools SET sort_order = 2  WHERE id = 'claude-code';
UPDATE public.core_tools SET sort_order = 3  WHERE id = 'n8n';
UPDATE public.core_tools SET sort_order = 4  WHERE id = 'veo';
UPDATE public.core_tools SET sort_order = 5  WHERE id = 'seedance';
UPDATE public.core_tools SET sort_order = 6  WHERE id = 'kling';
UPDATE public.core_tools SET sort_order = 7  WHERE id = 'higgsfield';
UPDATE public.core_tools SET sort_order = 8  WHERE id = 'heygen';
UPDATE public.core_tools SET sort_order = 9  WHERE id = 'capcut';
UPDATE public.core_tools SET sort_order = 10 WHERE id = 'nano-banana';
UPDATE public.core_tools SET sort_order = 11 WHERE id = 'manychat';
UPDATE public.core_tools SET sort_order = 12 WHERE id = 'notion';
UPDATE public.core_tools SET sort_order = 13 WHERE id = 'chatgpt';
UPDATE public.core_tools SET sort_order = 14 WHERE id = 'manus';
