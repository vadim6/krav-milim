-- Fix nemesis_summary: pending rounds (one result missing) were counted as draws
-- and inflated rounds_played. Only count rounds where both players have finished.
CREATE OR REPLACE VIEW nemesis_summary AS
SELECT
  nr.id                                                    AS rivalry_id,
  nr.challenger_id,
  uc.username                                              AS challenger_username,
  nr.receiver_id,
  ur.username                                              AS receiver_username,
  nr.status,
  COUNT(ns.id) FILTER (
    WHERE ns.challenger_result_id IS NOT NULL AND ns.receiver_result_id IS NOT NULL
  )                                                        AS rounds_played,
  COUNT(ns.id) FILTER (WHERE ns.winner_id = nr.challenger_id) AS challenger_wins,
  COUNT(ns.id) FILTER (WHERE ns.winner_id = nr.receiver_id)   AS receiver_wins,
  COUNT(ns.id) FILTER (
    WHERE ns.winner_id IS NULL
      AND ns.challenger_result_id IS NOT NULL
      AND ns.receiver_result_id IS NOT NULL
  )                                                        AS draws
FROM nemesis_rivalries nr
JOIN  users uc ON uc.id = nr.challenger_id
JOIN  users ur ON ur.id = nr.receiver_id
LEFT JOIN nemesis_scores ns ON ns.rivalry_id = nr.id
GROUP BY nr.id, nr.challenger_id, uc.username, nr.receiver_id, ur.username, nr.status;
