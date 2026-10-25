-- ============================================================
-- Journal d'audit des actions admin (impersonation…)
-- À exécuter dans Supabase > SQL Editor
-- ============================================================
--
-- Trace qui a consulté quel compte et quand (RGPD, confiance des agences).
-- Écrit uniquement côté serveur via le service role (src/lib/audit.ts).

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id       uuid        NOT NULL,
  admin_email    text,
  action         text        NOT NULL,          -- 'impersonation_start', 'impersonation_stop'…
  target_user_id uuid,
  ip             text,
  user_agent     text,
  details        jsonb,
  created_at     timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS admin_audit_log_created_idx ON admin_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_log_target_idx  ON admin_audit_log (target_user_id, created_at DESC);

-- RLS activée sans politique : aucun accès anon/authenticated, seul le service role lit et écrit.
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Exemple de consultation :
-- SELECT created_at, admin_email, action, target_user_id, ip
-- FROM admin_audit_log ORDER BY created_at DESC LIMIT 100;
