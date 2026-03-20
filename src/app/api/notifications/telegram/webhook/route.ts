import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { sendTelegram } from "@/lib/notifications/send"

/**
 * POST /api/notifications/telegram/webhook
 * Receives Telegram bot updates.
 * Validated via X-Telegram-Bot-Api-Secret-Token header.
 *
 * Flow:
 * 1. Parse message text, extract 6-digit code
 * 2. Look up telegram_link_tokens
 * 3. If found: link chat_id to user, send confirmation
 * 4. If not found: send error message
 */
export async function POST(req: NextRequest) {
  // Validate secret token from Telegram
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET
  if (!expectedSecret) {
    return NextResponse.json({ error: "TELEGRAM_WEBHOOK_SECRET not configured" }, { status: 500 })
  }
  if (req.headers.get("x-telegram-bot-api-secret-token") !== expectedSecret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  let update: TelegramUpdate
  try {
    update = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const message = update?.message
  if (!message?.text || !message?.chat?.id) {
    // Telegram sends various update types; silently ignore non-message updates
    return NextResponse.json({ ok: true })
  }

  const chatId = BigInt(message.chat.id)
  // Extract 6-digit code from message text (strip /start prefix if present)
  const text = message.text.replace(/^\/start\s*/, "").trim()
  const code = text.match(/^\d{6}$/)?.[0]

  if (!code) {
    await sendTelegram(chatId, "שלח קוד 6 ספרות מהפרופיל שלך כדי לקשר את החשבון.").catch(() => {})
    return NextResponse.json({ ok: true })
  }

  const service = createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svc = service as any

  // Look up the token
  const { data: tokenRow } = await svc
    .from("telegram_link_tokens")
    .select("user_id, expires_at, used")
    .eq("token", code)
    .maybeSingle()

  if (!tokenRow || tokenRow.used || new Date(tokenRow.expires_at) < new Date()) {
    await sendTelegram(chatId, "❌ הקוד לא נמצא או פג תוקף. נסה שוב בפרופיל שלך.").catch(() => {})
    return NextResponse.json({ ok: true })
  }

  // Link the chat_id to the user
  await svc
    .from("notification_settings")
    .upsert(
      [{ user_id: tokenRow.user_id, telegram_chat_id: message.chat.id, updated_at: new Date().toISOString() }],
      { onConflict: "user_id" },
    )

  // Mark token as used
  await svc
    .from("telegram_link_tokens")
    .update({ used: true })
    .eq("token", code)

  await sendTelegram(chatId, "✅ חשבונך חובר! תקבל התראות כאן.").catch(() => {})

  return NextResponse.json({ ok: true })
}

interface TelegramUpdate {
  message?: {
    text?: string
    chat?: { id: number }
  }
}
