-- Fix RLS init plan performance warning on notification_settings.
-- Wrapping auth.uid() in (select ...) causes Postgres to evaluate it once
-- per query rather than once per row.

DROP POLICY "users manage own notification settings" ON notification_settings;

CREATE POLICY "users manage own notification settings"
  ON notification_settings FOR ALL
  USING (user_id = (select auth.uid()));

-- Add missing index on telegram_link_tokens.user_id (unindexed FK).
-- The token route queries this column with .delete().eq("user_id", ...).
CREATE INDEX telegram_link_tokens_user_id_idx ON telegram_link_tokens (user_id);

-- Drop expires_at index — no app code filters by expires_at directly;
-- tokens are fetched by primary key (token) and deleted by user_id.
DROP INDEX IF EXISTS telegram_link_tokens_expires_at_idx;
