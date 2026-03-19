-- Helper for admin config-check: returns scheduled cron job names.
-- SECURITY DEFINER so the service role can reach the cron schema via RPC.
CREATE OR REPLACE FUNCTION public.get_scheduled_cron_jobs()
RETURNS TABLE (jobname text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, cron
AS $$
  SELECT jobname::text FROM cron.job;
$$;

-- Only the service role (used server-side) should call this.
REVOKE EXECUTE ON FUNCTION public.get_scheduled_cron_jobs() FROM PUBLIC, anon, authenticated;
