import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"

function isValidWebhookUrl(url: string, requiredHost: string): boolean {
  try {
    const { protocol, hostname } = new URL(url)
    return protocol === "https:" && (hostname === requiredHost || hostname.endsWith(`.${requiredHost}`))
  } catch {
    return false
  }
}

/** GET /api/notifications/settings — returns the current user's notification_settings row */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const service = createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (service as any)
    .from("notification_settings")
    .select("telegram_chat_id, discord_webhook_url, slack_webhook_url, email_enabled, notify_daily_reminder, notify_rival_solved, reminder_hour")
    .eq("user_id", user.id)
    .maybeSingle()

  return NextResponse.json(data ?? null)
}

/**
 * PATCH /api/notifications/settings — upserts the current user's notification settings.
 * Accepts:
 *   discord_webhook_url: string | null
 *   slack_webhook_url: string | null
 *   email_enabled: boolean
 *   telegram_linked: false  — clears telegram_chat_id
 *   notify_daily_reminder: boolean
 *   notify_rival_solved: boolean
 *   reminder_hour: number (0-23, Israel local)
 */
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: Record<string, any> = { user_id: user.id }

  if ("discord_webhook_url" in body) {
    const v = body.discord_webhook_url
    if (v !== null && typeof v !== "string") {
      return NextResponse.json({ error: "discord_webhook_url must be string or null" }, { status: 400 })
    }
    if (v !== null && !isValidWebhookUrl(v, "discord.com")) {
      return NextResponse.json({ error: "discord_webhook_url must be an https://discord.com webhook URL" }, { status: 400 })
    }
    updates.discord_webhook_url = v
  }

  if ("slack_webhook_url" in body) {
    const v = body.slack_webhook_url
    if (v !== null && typeof v !== "string") {
      return NextResponse.json({ error: "slack_webhook_url must be string or null" }, { status: 400 })
    }
    if (v !== null && !isValidWebhookUrl(v, "hooks.slack.com")) {
      return NextResponse.json({ error: "slack_webhook_url must be an https://hooks.slack.com webhook URL" }, { status: 400 })
    }
    updates.slack_webhook_url = v
  }

  if ("email_enabled" in body) {
    if (typeof body.email_enabled !== "boolean") {
      return NextResponse.json({ error: "email_enabled must be boolean" }, { status: 400 })
    }
    updates.email_enabled = body.email_enabled
  }

  if ("telegram_linked" in body && body.telegram_linked === false) {
    updates.telegram_chat_id = null
  }

  if ("notify_daily_reminder" in body) {
    if (typeof body.notify_daily_reminder !== "boolean") {
      return NextResponse.json({ error: "notify_daily_reminder must be boolean" }, { status: 400 })
    }
    updates.notify_daily_reminder = body.notify_daily_reminder
  }

  if ("notify_rival_solved" in body) {
    if (typeof body.notify_rival_solved !== "boolean") {
      return NextResponse.json({ error: "notify_rival_solved must be boolean" }, { status: 400 })
    }
    updates.notify_rival_solved = body.notify_rival_solved
  }

  if ("reminder_hour" in body) {
    const h = body.reminder_hour
    if (typeof h !== "number" || !Number.isInteger(h) || h < 0 || h > 23) {
      return NextResponse.json({ error: "reminder_hour must be integer 0-23" }, { status: 400 })
    }
    updates.reminder_hour = h
  }

  const service = createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (service as any)
    .from("notification_settings")
    .upsert([{ ...updates, updated_at: new Date().toISOString() }], { onConflict: "user_id" })
    .select("telegram_chat_id, discord_webhook_url, slack_webhook_url, email_enabled, notify_daily_reminder, notify_rival_solved, reminder_hour")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
