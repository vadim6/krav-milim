"use client"

import { useState, useTransition, useEffect, useRef } from "react"

// ── Icons ─────────────────────────────────────────────────────────────────────

function TelegramIcon() {
  return (
    <svg width="25" height="25" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.26 13.28 4.33 12.37c-.634-.197-.646-.634.136-.937l10.84-4.18c.527-.196.99.127.588.968z" />
    </svg>
  )
}

function DiscordIcon() {
  return (
    <svg width="25" height="25" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  )
}

function SlackIcon() {
  return (
    <svg width="25" height="25" viewBox="0 0 24 24" fill="currentColor">
      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zm10.122 2.521a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.268 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zm-2.523 10.122a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.268a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
    </svg>
  )
}

function EmailIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m2 7 10 7 10-7" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface Settings {
  telegram_chat_id:       number | null
  discord_webhook_url:    string | null
  slack_webhook_url:      string | null
  email_enabled:          boolean
  notify_daily_reminder:  boolean
  notify_rival_solved:    boolean
  reminder_hour:          number
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
        checked ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-[left] duration-200 ease-in-out ${
          checked ? "left-0.5" : "left-[22px]"
        }`}
      />
    </button>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function NotificationSettings({
  initialSettings,
  userEmail,
  botName,
}: {
  initialSettings: Settings | null
  userEmail: string
  botName: string
}) {
  const defaultSettings: Settings = {
    telegram_chat_id:      null,
    discord_webhook_url:   null,
    slack_webhook_url:     null,
    email_enabled:         false,
    notify_daily_reminder: true,
    notify_rival_solved:   true,
    reminder_hour:         9,
  }

  const [settings, setSettings] = useState<Settings>(initialSettings ?? defaultSettings)
  const [isPending, startTransition] = useTransition()

  // Telegram linking state
  const [telegramToken, setTelegramToken] = useState<string | null>(null)
  const [tokenCopied, setTokenCopied] = useState(false)
  const [telegramPending, setTelegramPending] = useState(false)

  // Webhook input drafts
  const [discordDraft, setDiscordDraft] = useState(settings.discord_webhook_url ?? "")
  const [slackDraft,   setSlackDraft]   = useState(settings.slack_webhook_url ?? "")

  // Test button cooldowns: null = ready, "sending" = in-flight, "ok" / "err" = result shown briefly
  const [testState, setTestState] = useState<Record<string, "sending" | "ok" | "err">>({})

  // Which channel's instructions panel is open
  const [openHelp, setOpenHelp] = useState<"telegram" | "discord" | "slack" | null>(null)
  function toggleHelp(ch: "telegram" | "discord" | "slack") {
    setOpenHelp((v) => (v === ch ? null : ch))
  }

  async function testChannel(channel: "telegram" | "discord" | "slack") {
    setTestState((s) => ({ ...s, [channel]: "sending" }))
    try {
      const res = await fetch("/api/notifications/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel }),
      })
      setTestState((s) => ({ ...s, [channel]: res.ok ? "ok" : "err" }))
    } catch {
      setTestState((s) => ({ ...s, [channel]: "err" }))
    }
    setTimeout(() => setTestState((s) => { const n = { ...s }; delete n[channel]; return n }), 5000)
  }

  async function patch(updates: Partial<Settings> & { telegram_linked?: false }) {
    const res = await fetch("/api/notifications/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    })
    if (res.ok) {
      const data = await res.json()
      setSettings(data)
    }
  }

  function handleToggle(field: keyof Settings) {
    const newValue = !settings[field]
    startTransition(async () => {
      await patch({ [field]: newValue } as Partial<Settings>)
    })
  }

  // Poll for Telegram link confirmation while token is displayed
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => {
    if (!telegramToken || settings.telegram_chat_id) return
    pollRef.current = setInterval(async () => {
      const res = await fetch("/api/notifications/settings")
      if (!res.ok) return
      const data: Settings = await res.json()
      if (data.telegram_chat_id) {
        setSettings(data)
        setTelegramToken(null)
        clearInterval(pollRef.current!)
      }
    }, 3000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [telegramToken, settings.telegram_chat_id])

  async function handleTelegramLink() {
    setTelegramPending(true)
    try {
      const res = await fetch("/api/notifications/telegram/token", { method: "POST" })
      if (res.ok) {
        const data = await res.json()
        setTelegramToken(data.token)
      }
    } finally {
      setTelegramPending(false)
    }
  }

  async function handleTelegramUnlink() {
    startTransition(async () => {
      await patch({ telegram_linked: false })
      setTelegramToken(null)
    })
  }

  async function copyToken() {
    if (!telegramToken) return
    await navigator.clipboard.writeText(telegramToken)
    setTokenCopied(true)
    setTimeout(() => setTokenCopied(false), 2000)
  }

  async function saveWebhook(type: "discord" | "slack") {
    const url = type === "discord" ? discordDraft : slackDraft
    startTransition(async () => {
      if (type === "discord") {
        await patch({ discord_webhook_url: url || null })
      } else {
        await patch({ slack_webhook_url: url || null })
      }
    })
  }

  async function removeWebhook(type: "discord" | "slack") {
    startTransition(async () => {
      if (type === "discord") {
        await patch({ discord_webhook_url: null })
        setDiscordDraft("")
      } else {
        await patch({ slack_webhook_url: null })
        setSlackDraft("")
      }
    })
  }

  const isLinked = !!settings.telegram_chat_id

  return (
    <div className="space-y-4" dir="rtl">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">התראות</h3>

      {/* ── Channels ─────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">

        {/* Telegram */}
        <div className="p-3 flex items-start gap-3">
          <span className="mt-0.5 text-[#229ED9]"><TelegramIcon /></span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">Telegram</p>
              <button onClick={() => toggleHelp("telegram")} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                הוראות
              </button>
            </div>
            {openHelp === "telegram" && (
              <div className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 space-y-1 leading-relaxed">
                <p>1. פתח שיחה עם הבוט: <a href="https://t.me/KravMilimBot" target="_blank" rel="noopener noreferrer" className="text-[#229ED9] hover:underline" dir="ltr">t.me/KravMilimBot</a></p>
                <p>2. שלח את הפקודה <span className="font-mono">start/</span> בצ׳אט</p>
                <p>3. חזור לכאן, לחץ על &quot;חבר Telegram&quot; וספק את הקוד שיוצג</p>
              </div>
            )}
            {isLinked ? (
              <div className="flex items-center gap-2 mt-1">
                <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                  <CheckIcon /> מחובר
                </span>
                <button
                  onClick={() => testChannel("telegram")}
                  disabled={!!testState["telegram"]}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
                >
                  {testState["telegram"] === "sending" ? "..." : testState["telegram"] === "ok" ? "✓ נשלח" : testState["telegram"] === "err" ? "✗ שגיאה" : "בדוק"}
                </button>
                <button
                  onClick={handleTelegramUnlink}
                  disabled={isPending}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors"
                >
                  נתק
                </button>
              </div>
            ) : telegramToken ? (
              <div className="mt-1 space-y-1">
                <p className="text-xs text-gray-500">שלח את הקוד הזה לבוט <span className="font-mono text-gray-700 dark:text-gray-300">@{botName}</span>:</p>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-bold tracking-widest text-gray-800 dark:text-gray-100">{telegramToken}</span>
                  <button
                    onClick={copyToken}
                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                  >
                    {tokenCopied ? "✓ הועתק" : "העתק"}
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">הקוד תקף ל-10 דקות</p>
              </div>
            ) : (
              <button
                onClick={handleTelegramLink}
                disabled={telegramPending}
                className="mt-1 text-xs text-[#229ED9] hover:underline disabled:opacity-50"
              >
                {telegramPending ? "..." : "חבר Telegram"}
              </button>
            )}
          </div>
        </div>

        {/* Discord */}
        <div className="p-3 flex items-start gap-3">
          <span className="mt-0.5 text-[#5865F2]"><DiscordIcon /></span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">Discord</p>
              <button onClick={() => toggleHelp("discord")} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                הוראות
              </button>
            </div>
            {openHelp === "discord" && (
              <div className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                <p>צור Webhook בהגדרות הערוץ שלך ב-Discord והדבק את ה-URL כאן. <a href="https://support.discord.com/hc/en-us/articles/228383668" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">הוראות Discord ←</a></p>
              </div>
            )}
            {settings.discord_webhook_url ? (
              <div className="flex items-center gap-2 mt-1">
                <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                  <CheckIcon /> מחובר
                </span>
                <button
                  onClick={() => testChannel("discord")}
                  disabled={!!testState["discord"]}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
                >
                  {testState["discord"] === "sending" ? "..." : testState["discord"] === "ok" ? "✓ נשלח" : testState["discord"] === "err" ? "✗ שגיאה" : "בדוק"}
                </button>
                <button
                  onClick={() => removeWebhook("discord")}
                  disabled={isPending}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors"
                >
                  הסר
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="url"
                  value={discordDraft}
                  onChange={(e) => setDiscordDraft(e.target.value)}
                  placeholder="https://discord.com/api/webhooks/..."
                  className="flex-1 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 min-w-0"
                  dir="ltr"
                />
                <button
                  onClick={() => saveWebhook("discord")}
                  disabled={isPending || !discordDraft}
                  className="text-xs text-purple-700 dark:text-purple-400 hover:underline disabled:opacity-40"
                >
                  שמור
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Slack */}
        <div className="p-3 flex items-start gap-3">
          <span className="mt-0.5 text-[#4A154B]"><SlackIcon /></span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">Slack</p>
              <button onClick={() => toggleHelp("slack")} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                הוראות
              </button>
            </div>
            {openHelp === "slack" && (
              <div className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                <p>צור Incoming Webhook באפליקציית Slack והדבק את ה-URL כאן. <a href="https://api.slack.com/messaging/webhooks" target="_blank" rel="noopener noreferrer" className="text-purple-700 dark:text-purple-400 hover:underline">הוראות Slack ←</a></p>
              </div>
            )}
            {settings.slack_webhook_url ? (
              <div className="flex items-center gap-2 mt-1">
                <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                  <CheckIcon /> מחובר
                </span>
                <button
                  onClick={() => testChannel("slack")}
                  disabled={!!testState["slack"]}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
                >
                  {testState["slack"] === "sending" ? "..." : testState["slack"] === "ok" ? "✓ נשלח" : testState["slack"] === "err" ? "✗ שגיאה" : "בדוק"}
                </button>
                <button
                  onClick={() => removeWebhook("slack")}
                  disabled={isPending}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors"
                >
                  הסר
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="url"
                  value={slackDraft}
                  onChange={(e) => setSlackDraft(e.target.value)}
                  placeholder="https://hooks.slack.com/services/..."
                  className="flex-1 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 min-w-0"
                  dir="ltr"
                />
                <button
                  onClick={() => saveWebhook("slack")}
                  disabled={isPending || !slackDraft}
                  className="text-xs text-purple-700 dark:text-purple-400 hover:underline disabled:opacity-40"
                >
                  שמור
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Email */}
        <div className="p-3 flex items-center gap-3">
          <span className="text-gray-500"><EmailIcon /></span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">אימייל</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate" dir="ltr">{userEmail}</p>
          </div>
          <Toggle
            checked={settings.email_enabled}
            onChange={() => handleToggle("email_enabled")}
            disabled={isPending}
          />
        </div>
      </div>
      
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">סוגי התראות</h3>
      
      {/* ── Events ───────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
        
        {/* Daily reminder */}
        <div className="p-3 space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-lg">🎯</span>
            <div className="flex-1">
              <p className="text-sm font-medium">תזכורת יומית</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">תזכורת לשחק את המילה של היום</p>
            </div>
            <Toggle
              checked={settings.notify_daily_reminder}
              onChange={() => handleToggle("notify_daily_reminder")}
              disabled={isPending}
            />
          </div>
          {settings.notify_daily_reminder && (
            <div className="flex items-center gap-2 pr-8">
              <label className="text-xs text-gray-500">שעת תזכורת (שעון ישראל):</label>
              <select
                value={settings.reminder_hour}
                onChange={(e) => {
                  const h = parseInt(e.target.value, 10)
                  startTransition(async () => {
                    await patch({ reminder_hour: h })
                  })
                }}
                disabled={isPending}
                className="text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1"
              >
                {Array.from({ length: 17 }, (_, i) => i + 6).map((h) => (
                  <option key={h} value={h}>
                    {String(h).padStart(2, "0")}:00
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Rival solved */}
        <div className="p-3 flex items-center gap-3">
          <span className="text-lg">⚔️</span>
          <div className="flex-1">
            <p className="text-sm font-medium">יריב פתר</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">כשיריב הנמסיס שלך פותר את המילה</p>
          </div>
          <Toggle
            checked={settings.notify_rival_solved}
            onChange={() => handleToggle("notify_rival_solved")}
            disabled={isPending}
          />
        </div>
      </div>
    </div>
  )
}
