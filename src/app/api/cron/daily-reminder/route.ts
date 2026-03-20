import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { sendNotification } from "@/lib/notifications/send"

/**
 * GET /api/cron/daily-reminder
 * Called by Supabase pg_cron every hour.
 * Sends reminders to users whose preferred reminder_hour matches the current Israel hour
 * and who haven't played today.
 *
 * Protected by Authorization: Bearer <CRON_SECRET>
 */
export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 })
  }
  if (req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const service = createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svc = service as any

  // Get current Israel date and hour
  const israelNow = new Date().toLocaleString("en-US", { timeZone: "Asia/Jerusalem" })
  const currentHour = new Date(israelNow).getHours()

  // Use Israel date (YYYY-MM-DD) to avoid UTC/Israel midnight mismatch
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jerusalem" })

  // Find today's global daily word
  const { data: todayWord } = await service
    .from("words")
    .select("id")
    .eq("source", "daily_global")
    .eq("date", today)
    .maybeSingle()

  // Find all users who:
  // 1. Have daily reminders enabled
  // 2. Prefer this hour
  // 3. Haven't received a reminder today
  // 4. Have at least one channel configured
  const { data: settings } = await svc
    .from("notification_settings")
    .select("user_id, last_reminder_sent_date")
    .eq("notify_daily_reminder", true)
    .eq("reminder_hour", currentHour)
    .or(`last_reminder_sent_date.is.null,last_reminder_sent_date.neq.${today}`)

  if (!settings?.length) {
    return NextResponse.json({ sent: 0 })
  }

  let sent = 0

  for (const row of settings) {
    // Skip if user already played today
    if (todayWord) {
      const { data: played } = await service
        .from("game_results")
        .select("id")
        .eq("user_id", row.user_id)
        .eq("word_id", todayWord.id)
        .maybeSingle()

      if (played) continue
    }

    // Send notification (fire-and-forget style — errors are swallowed inside sendNotification)
    await sendNotification(row.user_id, "daily_reminder", {
      message: "🎯 זמן לשחק! המילה היומית מחכה לך.\nhttps://krav-milim.com/game",
      emailSubject: "תזכורת יומית — קרב מילים",
      emailHtml: `<p dir="rtl">היי! המילה היומית עדיין מחכה לך. <a href="https://krav-milim.com/game">לחץ כאן לשחק</a>.</p>`,
    })

    // Update last_reminder_sent_date
    await svc
      .from("notification_settings")
      .update({ last_reminder_sent_date: today })
      .eq("user_id", row.user_id)

    sent++
  }

  return NextResponse.json({ sent })
}
