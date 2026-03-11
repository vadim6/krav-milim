/**
 * Chevre group scoring logic.
 */
import type { SeekerResult } from "@/types/shared"

/**
 * Determine whether the Hider wins a chevre round.
 *
 * Rule: Hider wins if fewer than `thresholdPct`% of seekers solved the word.
 * Seekers win (and Hider gets 0 points) if ≥ thresholdPct% solved.
 */
export function computeChevreResult(
  seekerResults: Record<string, SeekerResult>,
  thresholdPct: number,
): boolean {
  const results = Object.values(seekerResults)
  if (results.length === 0) return false

  const solvedCount = results.filter((r) => r.solved).length
  const solvedPct   = (solvedCount / results.length) * 100

  // Hider wins when solve rate < threshold
  return solvedPct < thresholdPct
}

/**
 * Returns the next hider in round-robin order given the member list
 * and the last hider's user_id.
 */
export function nextHider(
  memberIds: string[],
  lastHiderId: string | null,
): string {
  if (memberIds.length === 0) throw new Error("Empty member list")
  if (!lastHiderId) return memberIds[0]

  const idx = memberIds.indexOf(lastHiderId)
  return memberIds[(idx + 1) % memberIds.length]
}
