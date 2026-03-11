-- nemesis_scores write policies
-- Participants can insert/update their own result column in a score row.
-- (The server-side submit API uses the service role and bypasses RLS, but
--  having these policies lets the table be used from the client if needed.)

CREATE POLICY "nemesis_scores_insert_participant" ON nemesis_scores FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM nemesis_rivalries nr
      WHERE nr.id = rivalry_id
        AND nr.status = 'active'
        AND auth.uid() IN (nr.challenger_id, nr.receiver_id)
    )
  );

CREATE POLICY "nemesis_scores_update_participant" ON nemesis_scores FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM nemesis_rivalries nr
      WHERE nr.id = rivalry_id
        AND auth.uid() IN (nr.challenger_id, nr.receiver_id)
    )
  );
