-- ═══════════════════════════════════════════════════════════════════
-- 042_community_url_setting.sql — Community-URL als konfigurierbares Setting
-- ═══════════════════════════════════════════════════════════════════
--
-- Heute ist die Skool-URL hardcoded auf https://www.skool.com/herr-tech.
-- Jacob soll sie im Admin unter "Modus & Defaults" anpassen können
-- (z.B. wenn die Community auf eine andere Plattform umzieht oder
-- ein UTM-Tracking-Param drangehängt werden soll).
-- ═══════════════════════════════════════════════════════════════════

insert into app_settings (key, value, description) values
  (
    'community_url',
    '"https://www.skool.com/herr-tech"'::jsonb,
    'URL der Community (heute Skool). Wird verwendet auf allen "Community beitreten"-Buttons (Pricing-Seite, Tool-Gates, Billing-Seite, Dashboard-Cards). String mit https://-Prefix.'
  )
on conflict (key) do nothing;
