-- Sora 2 raus aus Tech-Stack.
-- Grund: OpenAI schaltet Sora im April 2026 ab — nicht mehr empfehlenswert.
-- Stattdessen: Anfragen nach Sora werden auf Veo 3 / Seedance / Kling / Higgsfield umgeleitet.

-- 1) Sora 2 löschen
DELETE FROM public.core_tools WHERE id = 'sora';

-- 2) "Sora 2" / "Sora" in alternatives_handled der verbleibenden Video-Tools,
--    damit der Chat höflich weg-lenkt wenn jemand nach Sora fragt
UPDATE public.core_tools
SET alternatives_handled = alternatives_handled || ARRAY['Sora 2', 'Sora']
WHERE id IN ('veo', 'seedance', 'kling', 'higgsfield')
  AND NOT ('Sora 2' = ANY(alternatives_handled));

-- 3) Sort-Order neu vergeben (Lücke schließen)
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
