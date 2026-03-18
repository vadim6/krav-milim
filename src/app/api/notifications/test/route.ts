import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { sendTelegram, sendDiscord, sendSlack } from "@/lib/notifications/send"

const TEST_MESSAGE = "✅ קרב מילים — הודעת בדיקה. ההתראות שלך עובדות!"

/**
 * POST /api/notifications/test
 * Sends a test message to a single channel for the current user.
 * Body: { channel: "telegram" | "discord" | "slack" }
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: { channel: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { channel } = body
  if (!["telegram", "discord", "slack"].includes(channel)) {
    return NextResponse.json({ error: "Invalid channel" }, { status: 400 })
  }

  const service = createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: settings } = await (service as any)
    .from("notification_settings")
    .select("telegram_chat_id, discord_webhook_url, slack_webhook_url")
    .eq("user_id", user.id)
    .maybeSingle()

  if (!settings) {
    return NextResponse.json({ error: "No notification settings found" }, { status: 404 })
  }

  try {
    if (channel === "telegram") {
      if (!settings.telegram_chat_id) {
        return NextResponse.json({ error: "Telegram not linked" }, { status: 400 })
      }
      await sendTelegram(BigInt(settings.telegram_chat_id), TEST_MESSAGE)
    } else if (channel === "discord") {
      if (!settings.discord_webhook_url) {
        return NextResponse.json({ error: "Discord not configured" }, { status: 400 })
      }
      await sendDiscord(settings.discord_webhook_url, TEST_MESSAGE)
    } else if (channel === "slack") {
      if (!settings.slack_webhook_url) {
        return NextResponse.json({ error: "Slack not configured" }, { status: 400 })
      }
      await sendSlack(settings.slack_webhook_url, TEST_MESSAGE)
    }
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Send failed" }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
