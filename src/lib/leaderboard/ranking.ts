export type SpecialIcon = "crown" | "superman" | null

export interface Medal {
  emoji: string
  label: string
}

/** Returns the medal for a given rank, or null if outside top 3. */
export function getMedal(rank: number | null): Medal | null {
  if (rank == null) return null
  if (rank === 1) return { emoji: "🥇", label: "מקום ראשון" }
  if (rank === 2) return { emoji: "🥈", label: "מקום שני" }
  if (rank === 3) return { emoji: "🥉", label: "מקום שלישי" }
  return null
}

/**
 * When a crown holder occupies rank 1, every other player's effective medal
 * rank shifts down by one (rank 2 gets gold, rank 3 gets silver, etc.).
 */
export function getDisplayMedal(rank: number | null, hasCrown: boolean): Medal | null {
  const effectiveRank = hasCrown && rank != null ? rank - 1 : rank
  return getMedal(effectiveRank)
}

/** Special icon for the weekly leaderboard rank-1 slot. */
export function getWeeklySpecial(rank: number | null, perfectWeek: boolean | null): SpecialIcon {
  if (rank === 1 && perfectWeek) return "crown"
  return null
}

/** Special icon for the monthly leaderboard rank-1 slot. */
export function getMonthlySpecial(
  rank: number | null,
  perfectMonthFull: boolean | null,
  perfectMonthRunning: boolean | null,
): SpecialIcon {
  if (rank === 1 && perfectMonthFull) return "superman"
  if (rank === 1 && perfectMonthRunning) return "crown"
  return null
}

/** Whether any crown holder exists at the top of a leaderboard. */
export function weeklyHasCrown(rows: { perfect_week: boolean | null }[]): boolean {
  return rows[0]?.perfect_week === true
}

export function monthlyHasCrown(
  rows: { perfect_month_full: boolean | null; perfect_month_running: boolean | null }[],
): boolean {
  return rows[0]?.perfect_month_full === true || rows[0]?.perfect_month_running === true
}

/** Whether a streak value should show the fire badge. */
export function showFireBadge(streak: number | null): boolean {
  return streak != null && streak >= 7
}
