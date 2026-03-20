-- Enable RLS on telegram_link_tokens.
-- No policies added = deny all via PostgREST. Service role bypasses RLS entirely,
-- so all existing API routes continue to work.

ALTER TABLE telegram_link_tokens ENABLE ROW LEVEL SECURITY;
