-- Supabase-Advisor "rls_disabled_in_public": RLS für feature_permissions
-- und tier_upsell_copy aktivieren.
--
-- Reads laufen serverseitig mit User-Session (siehe src/lib/permissions.ts,
-- Aufrufer: dashboard/admin layouts/pages) → SELECT-Policy für authenticated.
-- Writes laufen ausschließlich über createAdminClient() (Service Role) im
-- Admin-Endpoint /api/admin/permissions → Service Role bypasst RLS, daher
-- keine zusätzlichen Policies für INSERT/UPDATE/DELETE nötig.

ALTER TABLE public.feature_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tier_upsell_copy ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read feature permissions" ON public.feature_permissions;
CREATE POLICY "Authenticated users can read feature permissions"
  ON public.feature_permissions FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can read upsell copy" ON public.tier_upsell_copy;
CREATE POLICY "Authenticated users can read upsell copy"
  ON public.tier_upsell_copy FOR SELECT
  TO authenticated
  USING (true);
