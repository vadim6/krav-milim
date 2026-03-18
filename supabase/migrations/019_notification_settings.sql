-- ── Notification settings ─────────────────────────────────────────────────────

CREATE TABLE notification_settings (
  user_id                  UUID        PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  -- Channels
  telegram_chat_id         BIGINT,
  discord_webhook_url      TEXT,
  slack_webhook_url        TEXT,
  email_enabled            BOOLEAN     NOT NULL DEFAULT false,
  -- Events
  notify_daily_reminder    BOOLEAN     NOT NULL DEFAULT true,
  notify_rival_solved      BOOLEAN     NOT NULL DEFAULT true,
  -- Per-user reminder time (Israel local hour, 0-23; default 9 = 9am)
  reminder_hour            SMALLINT    NOT NULL DEFAULT 9,
  -- Dedup guard: prevents sending more than one reminder per day
  last_reminder_sent_date  DATE,
  -- Timestamps
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own notification settings"
  ON notification_settings FOR ALL
  USING (user_id = auth.uid());

-- ── Telegram linking tokens ────────────────────────────────────────────────────
-- Short-lived 6-digit codes that users paste into the Telegram bot to link accounts.

CREATE TABLE telegram_link_tokens (
  token      TEXT        PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '10 minutes'),
  used       BOOLEAN     NOT NULL DEFAULT false
);

CREATE INDEX telegram_link_tokens_expires_at_idx ON telegram_link_tokens (expires_at);

-- ── pg_cron: hourly daily-reminder job ────────────────────────────────────────
-- Calls the Next.js cron endpoint once per hour; the route itself filters
-- by each user's preferred reminder_hour (Israel local time).
-- Requires pg_net and pg_cron extensions (already enabled in this project).

SELECT cron.schedule(
  'daily-reminder',
  '0 * * * *',
  $$
    SELECT net.http_post(
      url     := current_setting('app.base_url') || '/api/cron/daily-reminder',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.cron_secret'),
        'Content-Type',  'application/json'
      ),
      body    := '{}'::jsonb
    )
  $$
);
