-- Table de rate limiting pour les routes email
-- max 5 emails / IP / heure par route

CREATE TABLE IF NOT EXISTS email_rate_limits (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  ip         text        NOT NULL,
  route      text        NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS email_rate_limits_ip_route_created
  ON email_rate_limits (ip, route, created_at);

-- Purge automatique des entrées de plus de 2h (évite la croissance infinie)
CREATE OR REPLACE FUNCTION purge_email_rate_limits() RETURNS void
  LANGUAGE sql SECURITY DEFINER AS $$
    DELETE FROM email_rate_limits WHERE created_at < now() - interval '2 hours';
$$;
