-- Add Tier 3 tiebreaker to compute_nemesis_winner:
-- when both players solve in the same number of guesses,
-- the player who accumulated fewer green+yellow tiles wins.
-- (The final winning guess contributes 5 greens to both equally, so no special-casing needed.)
CREATE OR REPLACE FUNCTION public.compute_nemesis_winner()
RETURNS trigger LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  c game_results%ROWTYPE;
  r game_results%ROWTYPE;
  c_hints INT;
  r_hints INT;
BEGIN
  IF NEW.challenger_result_id IS NULL OR NEW.receiver_result_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT * INTO c FROM game_results WHERE id = NEW.challenger_result_id;
  SELECT * INTO r FROM game_results WHERE id = NEW.receiver_result_id;

  NEW.tiebreaker_applied := false;

  -- Tier 1: solved beats unsolved
  IF c.solved AND NOT r.solved THEN NEW.winner_id := c.user_id; RETURN NEW; END IF;
  IF r.solved AND NOT c.solved THEN NEW.winner_id := r.user_id; RETURN NEW; END IF;

  -- Neither solved → draw
  IF NOT c.solved AND NOT r.solved THEN NEW.winner_id := NULL; RETURN NEW; END IF;

  -- Both solved from here on

  -- Tier 2: fewer guesses
  IF c.guesses < r.guesses THEN NEW.winner_id := c.user_id; RETURN NEW; END IF;
  IF r.guesses < c.guesses THEN NEW.winner_id := r.user_id; RETURN NEW; END IF;

  -- Tier 3: fewer green+yellow tiles revealed across all guesses
  SELECT COUNT(*) INTO c_hints
  FROM jsonb_array_elements(c.guess_history) AS entry,
       jsonb_array_elements(entry->'result') AS tile
  WHERE tile::text IN ('"correct"', '"present"');

  SELECT COUNT(*) INTO r_hints
  FROM jsonb_array_elements(r.guess_history) AS entry,
       jsonb_array_elements(entry->'result') AS tile
  WHERE tile::text IN ('"correct"', '"present"');

  IF c_hints < r_hints THEN
    NEW.winner_id := c.user_id;
    NEW.tiebreaker_applied := true;
    RETURN NEW;
  END IF;
  IF r_hints < c_hints THEN
    NEW.winner_id := r.user_id;
    NEW.tiebreaker_applied := true;
    RETURN NEW;
  END IF;

  -- True draw (same guesses, same hint count)
  NEW.winner_id := NULL;
  RETURN NEW;
END;
$$;
