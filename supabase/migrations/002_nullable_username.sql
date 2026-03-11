-- ============================================================
-- Migration 002: nullable username + updated auth trigger
-- ============================================================
-- Reason: Google OAuth and magic-link users don't supply a
-- username at sign-up. We leave it NULL and redirect them to
-- /onboarding to pick a nickname before they can play.
-- ============================================================

-- 1. Drop the NOT NULL constraint on username
ALTER TABLE users ALTER COLUMN username DROP NOT NULL;

-- 2. Update the trigger so it no longer guesses a username from
--    the email prefix (which can collide). Username stays NULL
--    until the user completes onboarding.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    -- Only set username if explicitly supplied (password signup path).
    -- Google OAuth and magic-link leave it NULL → onboarding required.
    NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'username', '')), '')
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$;
