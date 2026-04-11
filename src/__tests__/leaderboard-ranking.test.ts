import { describe, it, expect } from "vitest"
import {
  getMedal,
  getDisplayMedal,
  getWeeklySpecial,
  getMonthlySpecial,
  weeklyHasCrown,
  monthlyHasCrown,
  showFireBadge,
} from "@/lib/leaderboard/ranking"

// ── getMedal ─────────────────────────────────────────────────────────────────

describe("getMedal", () => {
  it("returns gold for rank 1", () => {
    expect(getMedal(1)).toEqual({ emoji: "🥇", label: "מקום ראשון" })
  })
  it("returns silver for rank 2", () => {
    expect(getMedal(2)).toEqual({ emoji: "🥈", label: "מקום שני" })
  })
  it("returns bronze for rank 3", () => {
    expect(getMedal(3)).toEqual({ emoji: "🥉", label: "מקום שלישי" })
  })
  it("returns null for rank 4+", () => {
    expect(getMedal(4)).toBeNull()
    expect(getMedal(100)).toBeNull()
  })
  it("returns null for null rank", () => {
    expect(getMedal(null)).toBeNull()
  })
})

// ── getDisplayMedal (crown shift) ─────────────────────────────────────────────

describe("getDisplayMedal", () => {
  it("no crown — same as getMedal", () => {
    expect(getDisplayMedal(1, false)).toEqual({ emoji: "🥇", label: "מקום ראשון" })
    expect(getDisplayMedal(2, false)).toEqual({ emoji: "🥈", label: "מקום שני" })
    expect(getDisplayMedal(4, false)).toBeNull()
  })

  it("with crown — rank 1 gets no medal (crown holder takes it)", () => {
    // rank 1 shifted to effective rank 0 → no medal
    expect(getDisplayMedal(1, true)).toBeNull()
  })
  it("with crown — rank 2 gets gold", () => {
    expect(getDisplayMedal(2, true)).toEqual({ emoji: "🥇", label: "מקום ראשון" })
  })
  it("with crown — rank 3 gets silver", () => {
    expect(getDisplayMedal(3, true)).toEqual({ emoji: "🥈", label: "מקום שני" })
  })
  it("with crown — rank 4 gets bronze", () => {
    expect(getDisplayMedal(4, true)).toEqual({ emoji: "🥉", label: "מקום שלישי" })
  })
  it("with crown — rank 5+ gets nothing", () => {
    expect(getDisplayMedal(5, true)).toBeNull()
  })
  it("with crown — null rank stays null", () => {
    expect(getDisplayMedal(null, true)).toBeNull()
  })
})

// ── getWeeklySpecial ─────────────────────────────────────────────────────────

describe("getWeeklySpecial", () => {
  it("crown for rank 1 with perfect week", () => {
    expect(getWeeklySpecial(1, true)).toBe("crown")
  })
  it("null for rank 1 without perfect week", () => {
    expect(getWeeklySpecial(1, false)).toBeNull()
    expect(getWeeklySpecial(1, null)).toBeNull()
  })
  it("null for rank 2+ even with perfect week", () => {
    expect(getWeeklySpecial(2, true)).toBeNull()
    expect(getWeeklySpecial(3, true)).toBeNull()
  })
})

// ── getMonthlySpecial ────────────────────────────────────────────────────────

describe("getMonthlySpecial", () => {
  it("superman for rank 1 with perfect full month", () => {
    expect(getMonthlySpecial(1, true, true)).toBe("superman")
  })
  it("superman takes priority over crown when both flags are true", () => {
    expect(getMonthlySpecial(1, true, true)).toBe("superman")
  })
  it("crown for rank 1 with running perfect month but not full", () => {
    expect(getMonthlySpecial(1, false, true)).toBe("crown")
  })
  it("null for rank 1 with no perfect flags", () => {
    expect(getMonthlySpecial(1, false, false)).toBeNull()
    expect(getMonthlySpecial(1, null, null)).toBeNull()
  })
  it("null for rank 2+ regardless of flags", () => {
    expect(getMonthlySpecial(2, true, true)).toBeNull()
    expect(getMonthlySpecial(3, false, true)).toBeNull()
  })
})

// ── weeklyHasCrown ───────────────────────────────────────────────────────────

describe("weeklyHasCrown", () => {
  it("true when rank-1 row has perfect_week", () => {
    expect(weeklyHasCrown([{ perfect_week: true }, { perfect_week: false }])).toBe(true)
  })
  it("false when rank-1 row does not have perfect_week", () => {
    expect(weeklyHasCrown([{ perfect_week: false }])).toBe(false)
    expect(weeklyHasCrown([{ perfect_week: null }])).toBe(false)
  })
  it("false for empty array", () => {
    expect(weeklyHasCrown([])).toBe(false)
  })
})

// ── monthlyHasCrown ──────────────────────────────────────────────────────────

describe("monthlyHasCrown", () => {
  it("true when rank-1 has perfect_month_full", () => {
    expect(monthlyHasCrown([{ perfect_month_full: true, perfect_month_running: false }])).toBe(true)
  })
  it("true when rank-1 has perfect_month_running", () => {
    expect(monthlyHasCrown([{ perfect_month_full: false, perfect_month_running: true }])).toBe(true)
  })
  it("false when neither flag is set", () => {
    expect(monthlyHasCrown([{ perfect_month_full: false, perfect_month_running: false }])).toBe(false)
    expect(monthlyHasCrown([{ perfect_month_full: null, perfect_month_running: null }])).toBe(false)
  })
  it("false for empty array", () => {
    expect(monthlyHasCrown([])).toBe(false)
  })
})

// ── showFireBadge ────────────────────────────────────────────────────────────

describe("showFireBadge", () => {
  it("true at exactly 7", () => {
    expect(showFireBadge(7)).toBe(true)
  })
  it("true above 7", () => {
    expect(showFireBadge(30)).toBe(true)
  })
  it("false below 7", () => {
    expect(showFireBadge(6)).toBe(false)
    expect(showFireBadge(1)).toBe(false)
  })
  it("false for null", () => {
    expect(showFireBadge(null)).toBe(false)
  })
})
