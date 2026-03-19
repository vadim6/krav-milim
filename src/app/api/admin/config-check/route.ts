import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"

function isAdmin(email: string | undefined) {
  return !!process.env.ADMIN_EMAIL && email === process.env.ADMIN_EMAIL
}

interface ConfigWarning {
  key: string
  label: string
  description: string
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!isAdmin(user?.email)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const warnings: ConfigWarning[] = []

  if (!process.env.CRON_SECRET) {
    warnings.push({
      key: "CRON_SECRET",
      label: "CRON_SECRET חסר",
      description: "נדרש לאימות קריאות cron לשליחת תזכורות יומיות.",
    })
  }

  if (!process.env.TELEGRAM_BOT_TOKEN) {
    warnings.push({
      key: "TELEGRAM_BOT_TOKEN",
      label: "TELEGRAM_BOT_TOKEN חסר",
      description: "נדרש לשליחת התראות Telegram. הגדר במשתני הסביבה של Vercel.",
    })
  }

  if (!process.env.TELEGRAM_WEBHOOK_SECRET) {
    warnings.push({
      key: "TELEGRAM_WEBHOOK_SECRET",
      label: "TELEGRAM_WEBHOOK_SECRET חסר",
      description: "נדרש לאימות בקשות Webhook מ-Telegram. הגדר במשתני הסביבה של Vercel.",
    })
  }

  if (!process.env.RESEND_API_KEY) {
    warnings.push({
      key: "RESEND_API_KEY",
      label: "RESEND_API_KEY חסר",
      description: "נדרש לשליחת התראות אימייל. הגדר במשתני הסביבה של Vercel.",
    })
  }

  // Check pg_cron job
  const service = createServiceClient()
  const { data: cronJobs } = await (service as any).rpc("get_scheduled_cron_jobs")
  const jobNames: string[] = (cronJobs ?? []).map((r: { jobname: string }) => r.jobname)
  if (!jobNames.includes("daily-reminder")) {
    warnings.push({
      key: "CRON_JOB",
      label: "משימת cron לא מוגדרת",
      description: "עבודת daily-reminder לא מתוזמנת ב-pg_cron. הרץ את פקודת cron.schedule ידנית בלוח הבקרה של Supabase.",
    })
  }

  // Check Telegram webhook registration
  if (process.env.TELEGRAM_BOT_TOKEN) {
    try {
      const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://krav-milim.com").replace(/\/$/, "")
      const expectedWebhook = `${appUrl}/api/notifications/telegram/webhook`
      const tgRes = await fetch(
        `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getWebhookInfo`
      )
      if (tgRes.ok) {
        const tgData = await tgRes.json()
        const registeredUrl: string = tgData.result?.url ?? ""
        if (!registeredUrl) {
          warnings.push({
            key: "TELEGRAM_WEBHOOK_URL",
            label: "Telegram Webhook לא מוגדר",
            description: `לא נרשם webhook ל-Telegram. הרץ: curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" -d '{"url":"${expectedWebhook}","secret_token":"<WEBHOOK_SECRET>"}'`,
          })
        } else if (registeredUrl !== expectedWebhook) {
          warnings.push({
            key: "TELEGRAM_WEBHOOK_URL",
            label: "Telegram Webhook מצביע לכתובת שגויה",
            description: `מוגדר: ${registeredUrl} — צפוי: ${expectedWebhook}`,
          })
        }
      }
    } catch {
      // Network error — skip this check silently
    }
  }

  return NextResponse.json({ warnings })
}
