import type { RivalryStatus, SeekerResult, NemesisSummaryRow } from "./shared"

export type { RivalryStatus, SeekerResult, NemesisSummaryRow }

export interface ChevreGroupWithMeta {
  id:            string
  name:          string
  threshold_pct: number
  invite_code:   string
  member_count:  number
  my_role:       "admin" | "member"
  today_hider:   string | null  // user_id of today's hider
}

export interface ChevreLeaderboardEntry {
  user_id:      string
  username:     string
  avatar_url:   string | null
  seeker_wins:  number
  seeker_games: number
  hider_wins:   number
  hider_games:  number
}
