-- =============================================================================
-- email_templates: editierbare Texte für alle System-Mails.
-- =============================================================================
-- Bisher waren Subject + alle Texte hardcoded in src/lib/email-template.ts.
-- Jetzt: Admin kann Subject, Headline, Intro, CTA-Label, P.S. etc. pro
-- Template über /admin/emails anpassen, ohne Deploy.
--
-- Die HTML-Struktur (Layout, Logo, Feature-Liste) bleibt im Code —
-- nur die Texte sind editierbar. Defaults stehen weiterhin im Code
-- (registry.ts). Wenn ein Feld in der DB nicht gesetzt ist, greift Default.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.email_templates (
  key text PRIMARY KEY,
  subject text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "email_templates_admin_read" ON public.email_templates;
CREATE POLICY "email_templates_admin_read" ON public.email_templates
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Schreiben läuft ausschließlich über den Service-Role-Client (Admin-API).
