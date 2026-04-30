-- ═══════════════════════════════════════════════════════════════════
-- 043_feature_permissions_learning_path.sql
-- Erweitert den CHECK-Constraint um 'learning_path' als gültiges Feature.
-- Damit kann der Admin in /admin/groups die Lernpfad-Anzeige pro Tier
-- ein-/ausblenden — analog zu classroom/chat/toolbox.
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE feature_permissions
  DROP CONSTRAINT IF EXISTS feature_permissions_feature_check;

ALTER TABLE feature_permissions
  ADD CONSTRAINT feature_permissions_feature_check
  CHECK (feature = ANY (ARRAY['classroom'::text, 'chat'::text, 'toolbox'::text, 'learning_path'::text]));
