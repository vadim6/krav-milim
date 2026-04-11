import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { generateAnonymousName } from "@/lib/anonymousName"

function isAdmin(email: string | undefined) {
  return !!process.env.ADMIN_EMAIL && email === process.env.ADMIN_EMAIL
}

/**
 * DELETE /api/admin/testing?target=my_result
 *   Deletes the admin's game_result for today's word so they can replay it.
 *
 * DELETE /api/admin/testing?target=user_result&userId=<id>
 *   Deletes a specific user's result for today's word.
 */
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!isAdmin(user?.email)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const service = createServiceClient()
  const today   = new Date().toISOString().split("T")[0]
  const target  = req.nextUrl.searchParams.get("target")

  // Resolve today's word id
  const { data: word } = await service
    .from("words")
    .select("id")
    .eq("source", "daily_global")
    .eq("date", today)
    .single()

  if (!word) return NextResponse.json({ error: "No word for today" }, { status: 404 })

  if (target === "my_result") {
    const { error } = await service
      .from("game_results")
      .delete()
      .eq("user_id", user!.id)
      .eq("word_id", word.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, message: "התוצאה שלך נמחקה — תוכל לשחק שוב" })
  }

  if (target === "user_result") {
    const userId = req.nextUrl.searchParams.get("userId")
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 })

    const { error } = await service
      .from("game_results")
      .delete()
      .eq("user_id", userId)
      .eq("word_id", word.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, message: "התוצאה נמחקה" })
  }

  if (target === "all_results") {
    const { error } = await service
      .from("game_results")
      .delete()
      .eq("word_id", word.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, message: "כל התוצאות להיום נמחקו" })
  }

  if (target === "clean_test_data") {
    if (process.env.NODE_ENV !== "development") {
      return NextResponse.json({ error: "Only available in development" }, { status: 403 })
    }
    const { data: { users: authUsers } } = await service.auth.admin.listUsers({ perPage: 200 })
    const testUsers = authUsers.filter(u => u.email?.startsWith("__test_") && u.email.endsWith("@localhost"))
    await Promise.all(testUsers.map(u => service.auth.admin.deleteUser(u.id)))
    // Remove placeholder past words inserted by the seed — identified by language="he-test"
    await service.from("words").delete()
      .eq("source", "daily_global")
      .eq("language", "he-test")
    return NextResponse.json({ ok: true, message: `נמחקו ${testUsers.length} משתמשי בדיקה ומילות בדיקה` })
  }

  return NextResponse.json({ error: "Unknown target" }, { status: 400 })
}

/**
 * POST /api/admin/testing?target=seed_leaderboard
 *   Creates 8 fake users with varied game results for today's word.
 *   Only works in NODE_ENV=development.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!isAdmin(user?.email)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const target = req.nextUrl.searchParams.get("target")

  // ── Email test — available in all environments ──────────────────────────────
  if (target === "test_email") {
    const { sendEmail } = await import("@/lib/notifications/send")
    const to = user!.email!
    try {
      await sendEmail(
        to,
        "📧 בדיקת אימייל — קרב מילים",
        `<p dir="rtl">זוהי הודעת בדיקה מקרב מילים. אם קיבלת הודעה זו, שילוב האימייל עובד כראוי ✅</p>`,
      )
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : "Send failed" }, { status: 502 })
    }
    return NextResponse.json({ ok: true, message: `אימייל בדיקה נשלח ל-${to}` })
  }

  // ── Daily reminder test — available in all environments ────────────────────
  if (target === "test_daily_reminder") {
    const { sendNotification } = await import("@/lib/notifications/send")
    try {
      await sendNotification(user!.id, "daily_reminder", {
        message: "🎯 [בדיקה] זמן לשחק! המילה היומית מחכה לך.\nhttps://krav-milim.com/game",
        emailSubject: "[בדיקה] תזכורת יומית — קרב מילים",
        emailHtml: `<p dir="rtl">[הודעת בדיקה] המילה היומית עדיין מחכה לך. <a href="https://krav-milim.com/game">לחץ כאן לשחק</a>.</p>`,
      })
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : "Send failed" }, { status: 502 })
    }
    return NextResponse.json({ ok: true, message: "תזכורת בדיקה נשלחה לכל הערוצים המוגדרים שלך" })
  }

  // ── Force cron run — runs full cron logic but skips hour filter ─────────────
  if (target === "force_cron_reminder") {
    const { sendNotification } = await import("@/lib/notifications/send")
    const service = createServiceClient()
    const today   = new Date().toISOString().split("T")[0]

    const { data: todayWord } = await service
      .from("words")
      .select("id")
      .eq("source", "daily_global")
      .eq("date", today)
      .maybeSingle()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const svc = service as any

    // All users with daily reminders on, not yet reminded today, at least one channel
    const { data: settings } = await svc
      .from("notification_settings")
      .select("user_id")
      .eq("notify_daily_reminder", true)
      .or(`last_reminder_sent_date.is.null,last_reminder_sent_date.neq.${today}`)

    if (!settings?.length) {
      return NextResponse.json({ ok: true, message: "אין משתמשים מוגדרים לתזכורות יומיות" })
    }

    let sent = 0
    for (const row of settings) {
      if (todayWord) {
        const { data: played } = await service
          .from("game_results")
          .select("id")
          .eq("user_id", row.user_id)
          .eq("word_id", todayWord.id)
          .maybeSingle()
        if (played) continue
      }
      await sendNotification(row.user_id, "daily_reminder", {
        message: "🎯 [cron-test] זמן לשחק! המילה היומית מחכה לך.\nhttps://krav-milim.com/game",
        emailSubject: "[cron-test] תזכורת יומית — קרב מילים",
        emailHtml: `<p dir="rtl">[cron-test] המילה היומית עדיין מחכה לך. <a href="https://krav-milim.com/game">לחץ כאן לשחק</a>.</p>`,
      })
      await svc
        .from("notification_settings")
        .update({ last_reminder_sent_date: today })
        .eq("user_id", row.user_id)
      sent++
    }
    return NextResponse.json({ ok: true, message: `נשלחו ${sent} תזכורות (ללא סינון שעה)` })
  }

  // ── Dev-only targets ────────────────────────────────────────────────────────
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Only available in development" }, { status: 403 })
  }

  if (target !== "seed_leaderboard") return NextResponse.json({ error: "Unknown target" }, { status: 400 })

  const service = createServiceClient()
  const today   = new Date().toISOString().split("T")[0]

  const { data: word } = await service
    .from("words")
    .select("id")
    .eq("source", "daily_global")
    .eq("date", today)
    .single()

  if (!word) return NextResponse.json({ error: "No word for today" }, { status: 404 })

  // Extend coverage to: max(30 days, days since 1st of current month)
  // This ensures full-month data for monthly leaderboard + 30 days for all-time history.
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const daysSinceMonthStart = Math.floor((now.getTime() - monthStart.getTime()) / 86400000)
  const daysBack = Math.max(30, daysSinceMonthStart)

  const pastDates = Array.from({ length: daysBack }, (_, i) => {
    const d = new Date(Date.now() - (i + 1) * 86400000)
    return d.toISOString().split("T")[0]
  })
  // Encode a date as a unique 5-Hebrew-char placeholder word.
  // Uses year-offset, month, day-tens, day-units, fixed suffix — unique per calendar date.
  // Identified for cleanup by language="he-test" (not by word value).
  const HE_LETTERS = 'אבגדהוזחטיכלמנסעפצקרשת'
  function makePlaceholderWord(date: string): string {
    const [y, m, d] = date.split('-').map(Number)
    return [
      HE_LETTERS[(y - 2025) % 22],
      HE_LETTERS[(m - 1) % 22],
      HE_LETTERS[Math.floor((d - 1) / 10) % 22],
      HE_LETTERS[(d - 1) % 10],
      HE_LETTERS[(m + d) % 22],
    ].join('')
  }

  const { data: existingPastWords } = await service
    .from("words")
    .select("id, date")
    .eq("source", "daily_global")
    .in("date", pastDates)
  const existingDates = new Set((existingPastWords ?? []).map(w => w.date as string))
  let wordInsertErrors = 0
  for (const date of pastDates) {
    if (existingDates.has(date)) continue
    const { error: wErr } = await service.from("words").insert({
      word:     makePlaceholderWord(date),
      language: "he-test",
      source:   "daily_global",
      date,
    })
    if (wErr) wordInsertErrors++
  }
  // Re-fetch to get ids for all past days (real + newly seeded)
  const { data: pastWords } = await service
    .from("words")
    .select("id, date")
    .eq("source", "daily_global")
    .in("date", pastDates)
  const pastWordsByDate = new Map((pastWords ?? []).map(w => [w.date as string, w.id as string]))

  // Helper: randomize guesses around a player's average (clamped 1–6)
  function randGuesses(avg: number, solved: boolean): number {
    if (!solved) return 6
    const g = Math.round(avg + (Math.random() - 0.5) * 2)
    return Math.max(1, Math.min(6, g))
  }

  // Helper: random duration in seconds for a solved game
  function randDuration(minSecs: number, maxSecs: number): number {
    return Math.floor(minSecs + Math.random() * (maxSecs - minSecs))
  }

  // 16 players covering all leaderboard ranking scenarios:
  // - gibor_badge (hard_mode games)
  // - perfect_games (1-guess solves for weekly/monthly tiebreaker)
  // - duration_seconds (daily speed tiebreaker)
  // - intentional ties at multiple tiers (slots 3+4, 7+8, 13+14)
  // - full gamification tier range (👑 💎 🥇 🥈 🥉)
  const profiles = [
    // slot, todaySolved, todayGuesses, playRate, solveRate, avgGuesses, hardModeRate, minSecs, maxSecs
    { slot:  1, solved: true,  guesses: 1, playRate: 1.00, solveRate: 1.00, avgGuesses: 1, hardModeRate: 1.0, minSecs:  15, maxSecs:  45 }, // perfect gibor 👑
    { slot:  2, solved: true,  guesses: 2, playRate: 0.95, solveRate: 0.95, avgGuesses: 2, hardModeRate: 0.5, minSecs:  20, maxSecs:  90 }, // speed demon 💎
    { slot:  3, solved: true,  guesses: 3, playRate: 0.85, solveRate: 0.90, avgGuesses: 3, hardModeRate: 0.3, minSecs:  60, maxSecs: 150 }, // consistent A 🥇 (ties with 4)
    { slot:  4, solved: true,  guesses: 3, playRate: 0.85, solveRate: 0.90, avgGuesses: 3, hardModeRate: 0.3, minSecs:  60, maxSecs: 150 }, // consistent B 🥇 (ties with 3)
    { slot:  5, solved: true,  guesses: 4, playRate: 0.95, solveRate: 0.70, avgGuesses: 4, hardModeRate: 0.2, minSecs:  80, maxSecs: 180 }, // daily warrior 🥈 (high play, lower win)
    { slot:  6, solved: true,  guesses: 2, playRate: 0.50, solveRate: 0.90, avgGuesses: 2, hardModeRate: 0.2, minSecs:  40, maxSecs: 120 }, // lucky guesser 🥈 (few games, efficient)
    { slot:  7, solved: true,  guesses: 3, playRate: 0.70, solveRate: 0.75, avgGuesses: 3, hardModeRate: 0.1, minSecs:  70, maxSecs: 160 }, // mid tier A 🥉 (ties with 8)
    { slot:  8, solved: true,  guesses: 3, playRate: 0.70, solveRate: 0.75, avgGuesses: 3, hardModeRate: 0.1, minSecs:  70, maxSecs: 160 }, // mid tier B 🥉 (ties with 7)
    { slot:  9, solved: true,  guesses: 4, playRate: 0.80, solveRate: 0.70, avgGuesses: 4, hardModeRate: 0.9, minSecs:  90, maxSecs: 200 }, // hard moder (gibor_badge candidate)
    { slot: 10, solved: true,  guesses: 5, playRate: 0.75, solveRate: 0.80, avgGuesses: 5, hardModeRate: 0.0, minSecs: 150, maxSecs: 360 }, // slow solver
    { slot: 11, solved: true,  guesses: 4, playRate: 1.00, solveRate: 0.60, avgGuesses: 4, hardModeRate: 0.0, minSecs: 100, maxSecs: 250 }, // streaker (plays every day)
    { slot: 12, solved: true,  guesses: 2, playRate: 0.40, solveRate: 0.85, avgGuesses: 2, hardModeRate: 0.1, minSecs:  50, maxSecs: 130 }, // weekend player (sporadic but good)
    { slot: 13, solved: true,  guesses: 5, playRate: 0.30, solveRate: 0.60, avgGuesses: 5, hardModeRate: 0.0, minSecs: 120, maxSecs: 300 }, // casual A (ties with 14)
    { slot: 14, solved: true,  guesses: 5, playRate: 0.30, solveRate: 0.60, avgGuesses: 5, hardModeRate: 0.0, minSecs: 120, maxSecs: 300 }, // casual B (ties with 13)
    { slot: 15, solved: false, guesses: 6, playRate: 0.15, solveRate: 0.50, avgGuesses: 6, hardModeRate: 0.0, minSecs: 200, maxSecs: 400 }, // rare visitor
    { slot: 16, solved: false, guesses: 6, playRate: 0.25, solveRate: 0.15, avgGuesses: 6, hardModeRate: 0.0, minSecs: 200, maxSecs: 400 }, // never wins
  ]

  // Fetch all existing test auth users once (avoid N list calls)
  const { data: { users: allAuthUsers } } = await service.auth.admin.listUsers({ perPage: 200 })

  let seeded = 0
  for (const p of profiles) {
    const email = `__test_${p.slot}__@localhost`

    // Create auth user if not exists
    let userId: string
    const found = allAuthUsers.find(u => u.email === email)
    if (found) {
      userId = found.id
    } else {
      const { data: created, error } = await service.auth.admin.createUser({
        email,
        password: "test-only",
        email_confirm: true,
      })
      if (error || !created.user) continue
      userId = created.user.id
    }

    const { playRate, solveRate, avgGuesses, hardModeRate, minSecs, maxSecs } = p

    // Clear any existing past results for this user so re-seeding is idempotent
    if (pastWordsByDate.size > 0) {
      await service.from("game_results").delete()
        .eq("user_id", userId)
        .in("word_id", [...pastWordsByDate.values()])
    }

    const solvedDates = new Set<string>()
    for (const [date, wordId] of pastWordsByDate) {
      if (Math.random() > playRate) continue
      const pastSolved   = Math.random() < solveRate
      const pastGuesses  = randGuesses(avgGuesses, pastSolved)
      const pastHardMode = Math.random() < hardModeRate
      const pastDuration = pastSolved ? randDuration(minSecs, maxSecs) : null
      const pastHistory  = Array.from({ length: pastGuesses }, (_, i) => ({
        guess:  "אבגדה",
        result: i === pastGuesses - 1 && pastSolved
          ? ["correct", "correct", "correct", "correct", "correct"]
          : ["absent",  "absent",  "absent",  "absent",  "absent"],
      }))
      await service.from("game_results").insert({
        user_id:          userId,
        word_id:          wordId,
        solved:           pastSolved,
        guesses:          pastGuesses,
        guess_history:    pastHistory,
        hard_mode:        pastHardMode,
        duration_seconds: pastDuration,
      })
      if (pastSolved) solvedDates.add(date)
    }

    // Include today in solved set if the user solved today
    if (p.solved) solvedDates.add(today)

    // Compute current_streak: consecutive solved days ending today (or yesterday)
    let currentStreak = 0
    const cursor = new Date(today)
    if (!solvedDates.has(today)) cursor.setDate(cursor.getDate() - 1)
    while (solvedDates.has(cursor.toISOString().split("T")[0])) {
      currentStreak++
      cursor.setDate(cursor.getDate() - 1)
    }

    // Compute best_streak: longest run of consecutive solved dates
    const sortedSolved = [...solvedDates].sort()
    let bestStreak = 0, run = 0
    for (let i = 0; i < sortedSolved.length; i++) {
      if (i === 0) {
        run = 1
      } else {
        const diff = Math.round(
          (new Date(sortedSolved[i]).getTime() - new Date(sortedSolved[i - 1]).getTime()) / 86400000
        )
        run = diff === 1 ? run + 1 : 1
      }
      if (run > bestStreak) bestStreak = run
    }

    const lastSolvedDate = sortedSolved.length > 0 ? sortedSolved[sortedSolved.length - 1] : null

    // Upsert into users table with computed streak values
    await service.from("users").upsert({
      id:               userId,
      email,
      username:         generateAnonymousName(),
      current_streak:   currentStreak,
      best_streak:      bestStreak,
      last_solved_date: lastSolvedDate,
    }, { onConflict: "id", ignoreDuplicates: false })

    // Delete existing result for today (allow re-seeding)
    await service.from("game_results").delete()
      .eq("user_id", userId).eq("word_id", word.id)

    // Insert today's game result with hard_mode and duration
    const todayGuesses  = p.solved ? randGuesses(avgGuesses, true) : 6
    const todayHardMode = Math.random() < hardModeRate
    const todayDuration = p.solved ? randDuration(minSecs, maxSecs) : null
    const guessHistory  = Array.from({ length: todayGuesses }, (_, i) => ({
      guess:  "אבגדה",
      result: i === todayGuesses - 1 && p.solved
        ? ["correct", "correct", "correct", "correct", "correct"]
        : ["absent",  "absent",  "absent",  "absent",  "absent"],
    }))

    await service.from("game_results").insert({
      user_id:          userId,
      word_id:          word.id,
      solved:           p.solved,
      guesses:          todayGuesses,
      guess_history:    guessHistory,
      hard_mode:        todayHardMode,
      duration_seconds: todayDuration,
    })

    seeded++
  }

  const errNote = wordInsertErrors > 0 ? ` | שגיאות הכנסת מילים: ${wordInsertErrors}` : ''
  return NextResponse.json({ ok: true, message: `הוזרקו ${seeded} שחקני בדיקה לכל הדירוגים (${pastWordsByDate.size} ימים קודמים${errNote})` })
}
