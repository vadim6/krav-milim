import { Resend } from "resend"
import { createServiceClient } from "@/lib/supabase/service"

// ── Channel senders ────────────────────────────────────────────────────────────

export async function sendTelegram(chatId: bigint, text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN not set")

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId.toString(), text, parse_mode: "HTML" }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Telegram sendMessage failed: ${body}`)
  }
}

export async function sendDiscord(webhookUrl: string, text: string): Promise<void> {
  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: text }),
  })
  if (!res.ok) throw new Error(`Discord webhook failed: ${res.status}`)
}

export async function sendSlack(webhookUrl: string, text: string): Promise<void> {
  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  })
  if (!res.ok) throw new Error(`Slack webhook failed: ${res.status}`)
}

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error("RESEND_API_KEY not set")

  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send({
    from: "קרב מילים <notifications@krav-milim.com>",
    to,
    subject,
    html,
  })
  if (error) throw new Error(`Resend failed: ${error.message}`)
}

// ── High-level dispatcher ──────────────────────────────────────────────────────

export type NotificationEvent = "daily_reminder" | "rival_solved"

interface NotificationPayload {
  message:       string
  emailSubject?: string
  emailHtml?:    string
}

/**
 * Sends a notification to all enabled channels for the given user.
 * Fetches the user's notification_settings row and checks event flags.
 * Silently skips channels that fail — never throws.
 */
export async function sendNotification(
  userId: string,
  event:  NotificationEvent,
  payload: NotificationPayload,
): Promise<void> {
  const service = createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svc = service as any

  const { data: settings } = await svc
    .from("notification_settings")
    .select("telegram_chat_id, discord_webhook_url, slack_webhook_url, email_enabled, notify_daily_reminder, notify_rival_solved")
    .eq("user_id", userId)
    .single()

  if (!settings) return

  // Check event preference
  if (event === "daily_reminder" && !settings.notify_daily_reminder) return
  if (event === "rival_solved"   && !settings.notify_rival_solved)   return

  const { message, emailSubject, emailHtml } = payload
  const sends: Promise<void>[] = []

  if (settings.telegram_chat_id) {
    sends.push(sendTelegram(BigInt(settings.telegram_chat_id), message).catch(console.error))
  }
  if (settings.discord_webhook_url) {
    sends.push(sendDiscord(settings.discord_webhook_url, message).catch(console.error))
  }
  if (settings.slack_webhook_url) {
    sends.push(sendSlack(settings.slack_webhook_url, message).catch(console.error))
  }
  if (settings.email_enabled) {
    // Fetch user email from users table
    const { data: userRow } = await service.from("users").select("email").eq("id", userId).single()
    if (userRow?.email) {
      sends.push(
        sendEmail(
          userRow.email,
          emailSubject ?? "התראה מקרב מילים",
          emailHtml ?? `<p dir="rtl">${message}</p>`,
        ).catch(console.error),
      )
    }
  }

  await Promise.allSettled(sends)
}
