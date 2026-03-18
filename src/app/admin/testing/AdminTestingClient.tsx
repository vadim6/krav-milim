"use client"

import { useState } from "react"
import GameStatus from "@/components/game/GameStatus"
import { pickStatusText } from "@/lib/game/statusTexts"
import type { StatusText } from "@/lib/game/statusTexts"
import type { GuessHistoryEntry, TileState } from "@/types/shared"

type ConfirmKey = "my_result" | "all_results" | "clean_test_data" | null

const MOCK_TILE_ROWS: TileState[][] = [
  ["absent",  "present", "absent",  "absent",  "correct"],
  ["present", "absent",  "correct", "absent",  "correct"],
  ["correct", "absent",  "correct", "present", "correct"],
  ["correct", "correct", "absent",  "correct", "correct"],
  ["absent",  "correct", "present", "absent",  "correct"],
]

function makeMockHistory(guessCount: number, won: boolean): GuessHistoryEntry[] {
  return Array.from({ length: guessCount }, (_, i) => ({
    guess: "שולחן",
    result: (won && i === guessCount - 1)
      ? (["correct", "correct", "correct", "correct", "correct"] as TileState[])
      : MOCK_TILE_ROWS[i % MOCK_TILE_ROWS.length],
  }))
}

interface PreviewState {
  status:     "won" | "lost"
  guessCount: number
  history:    GuessHistoryEntry[]
  statusText: StatusText
}

export default function AdminTestingClient({ isDev }: { isDev: boolean }) {
  const [confirming, setConfirming] = useState<ConfirmKey>(null)
  const [loading, setLoading]       = useState(false)
  const [message, setMessage]       = useState<string | null>(null)
  const [error, setError]           = useState<string | null>(null)
  const [preview, setPreview]       = useState<PreviewState | null>(null)

  async function execute(target: "my_result" | "all_results" | "clean_test_data") {
    setLoading(true)
    setMessage(null)
    setError(null)
    setConfirming(null)
    const res  = await fetch(`/api/admin/testing?target=${target}`, { method: "DELETE" })
    const data = await res.json()
    if (res.ok) setMessage(data.message)
    else setError(data.error)
    setLoading(false)
  }

  async function seedLeaderboard() {
    setLoading(true)
    setMessage(null)
    setError(null)
    const res  = await fetch("/api/admin/testing?target=seed_leaderboard", { method: "POST" })
    const data = await res.json()
    if (res.ok) setMessage(data.message)
    else setError(data.error)
    setLoading(false)
  }

  function showPreview(status: "won" | "lost") {
    // Clear cached key so every click shows a fresh random combo
    localStorage.removeItem("krav-milim-preview-status")
    const guessCount = status === "won" ? Math.floor(Math.random() * 6) + 1 : 6
    setPreview({
      status,
      guessCount,
      history:    makeMockHistory(guessCount, status === "won"),
      statusText: pickStatusText(status, "krav-milim-preview-status"),
    })
  }

  return (
    <div className="relative max-w-lg flex flex-col gap-8">
      <h1 className="text-2xl font-bold">בדיקות</h1>

      <section className="bg-gray-900 rounded-xl p-5 flex flex-col gap-4">
        <h2 className="font-semibold text-gray-300">משחק היום</h2>

        {/* Reset my result */}
        <div className="flex flex-col gap-2">
          <p className="text-sm text-gray-500">
            מחק את תוצאת המשחק שלך להיום כדי שתוכל לשחק שוב.
          </p>
          {confirming === "my_result" ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-300">בטוח?</span>
              <button
                onClick={() => execute("my_result")}
                disabled={loading}
                className="bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
              >
                כן, מחק
              </button>
              <button
                onClick={() => setConfirming(null)}
                className="text-gray-400 hover:text-gray-200 text-sm transition-colors"
              >
                ביטול
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setMessage(null); setError(null); setConfirming("my_result") }}
              disabled={loading}
              className="self-start bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white px-5 py-2 rounded-lg font-medium transition-colors"
            >
              אפס את התוצאה שלי להיום
            </button>
          )}
        </div>

        {/* Reset all results */}
        <div className="flex flex-col gap-2 border-t border-gray-800 pt-4">
          <p className="text-sm text-gray-500">
            מחק את כל תוצאות המשחק של כל המשתמשים להיום. שימושי לאחר החלפת מילה.
          </p>
          {confirming === "all_results" ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-yellow-400">מחיקת תוצאות כל המשתמשים — בטוח?</span>
              <button
                onClick={() => execute("all_results")}
                disabled={loading}
                className="bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
              >
                כן, מחק הכל
              </button>
              <button
                onClick={() => setConfirming(null)}
                className="text-gray-400 hover:text-gray-200 text-sm transition-colors"
              >
                ביטול
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setMessage(null); setError(null); setConfirming("all_results") }}
              disabled={loading}
              className="self-start bg-red-900 hover:bg-red-800 disabled:opacity-50 text-white px-5 py-2 rounded-lg font-medium transition-colors"
            >
              אפס תוצאות כל המשתמשים להיום
            </button>
          )}
        </div>

        {message && <p className="text-green-400 text-sm">{message}</p>}
        {error   && <p className="text-red-400 text-sm">{error}</p>}
      </section>

      {isDev && (
        <section className="bg-gray-900 rounded-xl p-5 flex flex-col gap-4 border border-yellow-800/40">
          <h2 className="font-semibold text-yellow-400">נתוני בדיקה <span className="text-xs font-normal text-gray-500">(dev only)</span></h2>

          <div className="flex flex-col gap-2">
            <p className="text-sm text-gray-500">
              הזרק 8 שחקני בדיקה עם תוצאות שונות להיום — שימושי לבדיקת דירוג, עיצוב, ומיגרציות DB.
            </p>
            <button
              onClick={seedLeaderboard}
              disabled={loading}
              className="self-start bg-yellow-700 hover:bg-yellow-600 disabled:opacity-50 text-white px-5 py-2 rounded-lg font-medium transition-colors"
            >
              הזרק שחקנים לדירוג היומי
            </button>
          </div>

          <div className="flex flex-col gap-2 border-t border-gray-800 pt-4">
            <p className="text-sm text-gray-500">
              מחק את כל משתמשי הבדיקה ותוצאותיהם.
            </p>
            {confirming === "clean_test_data" ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-300">בטוח?</span>
                <button
                  onClick={() => execute("clean_test_data")}
                  disabled={loading}
                  className="bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                >
                  כן, נקה
                </button>
                <button
                  onClick={() => setConfirming(null)}
                  className="text-gray-400 hover:text-gray-200 text-sm transition-colors"
                >
                  ביטול
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setMessage(null); setError(null); setConfirming("clean_test_data") }}
                disabled={loading}
                className="self-start bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white px-5 py-2 rounded-lg font-medium transition-colors"
              >
                נקה נתוני בדיקה
              </button>
            )}
          </div>

          <div className="flex flex-col gap-2 border-t border-gray-800 pt-4">
            <p className="text-sm text-gray-500">
              תצוגה מקדימה של פופ-אפ סיום משחק.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => showPreview("won")}
                className="bg-green-800 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                פופ-אפ ניצחון
              </button>
              <button
                onClick={() => showPreview("lost")}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                פופ-אפ הפסד
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="bg-gray-900 rounded-xl p-5 flex flex-col gap-4">
        <h2 className="font-semibold text-gray-300">בדיקת התראות</h2>
        <div className="flex flex-col gap-2">
          <p className="text-sm text-gray-500">
            שלח תזכורת יומית לכל הערוצים המוגדרים בפרופיל שלך (Telegram, Discord, Slack, אימייל).
            בודק את כל הצינור — הגדרות, שליחה, קבלה.
          </p>
          <button
            onClick={async () => {
              setLoading(true); setMessage(null); setError(null)
              const res = await fetch("/api/admin/testing?target=test_daily_reminder", { method: "POST" })
              const data = await res.json()
              if (res.ok) setMessage(data.message); else setError(data.error)
              setLoading(false)
            }}
            disabled={loading}
            className="self-start bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white px-5 py-2 rounded-lg font-medium transition-colors"
          >
            שלח תזכורת בדיקה
          </button>
        </div>

        <div className="flex flex-col gap-2 border-t border-gray-800 pt-4">
          <p className="text-sm text-gray-500">
            הרץ את ה-cron ידנית — שולח תזכורת לכל המשתמשים שלא שיחקו היום, ללא סינון שעה.
          </p>
          <button
            onClick={async () => {
              setLoading(true); setMessage(null); setError(null)
              const res = await fetch("/api/admin/testing?target=force_cron_reminder", { method: "POST" })
              const data = await res.json()
              if (res.ok) setMessage(data.message); else setError(data.error)
              setLoading(false)
            }}
            disabled={loading}
            className="self-start bg-indigo-700 hover:bg-indigo-600 disabled:opacity-50 text-white px-5 py-2 rounded-lg font-medium transition-colors"
          >
            הרץ cron ידנית (ללא סינון שעה)
          </button>
        </div>

        <div className="flex flex-col gap-2 border-t border-gray-800 pt-4">
          <p className="text-sm text-gray-500">שלח אימייל בדיקה בלבד לכתובת שלך דרך Resend.</p>
          <button
            onClick={async () => {
              setLoading(true); setMessage(null); setError(null)
              const res = await fetch("/api/admin/testing?target=test_email", { method: "POST" })
              const data = await res.json()
              if (res.ok) setMessage(data.message); else setError(data.error)
              setLoading(false)
            }}
            disabled={loading}
            className="self-start bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white px-5 py-2 rounded-lg font-medium transition-colors"
          >
            שלח אימייל בדיקה
          </button>
        </div>
        {message && <p className="text-green-400 text-sm">{message}</p>}
        {error   && <p className="text-red-400 text-sm">{error}</p>}
      </section>

      <section className="bg-gray-900 rounded-xl p-5 flex flex-col gap-3">
        <h2 className="font-semibold text-gray-300">קיצורי דרך</h2>
        <div className="flex flex-col gap-2 text-sm text-gray-400">
          <a href="/game"        className="hover:text-white transition-colors">← חזור למשחק</a>
          <a href="/admin/words" className="hover:text-white transition-colors">← ניהול מילים</a>
        </div>
      </section>

      {preview && (
        <GameStatus
          status={preview.status}
          guessCount={preview.guessCount}
          guessHistory={preview.history}
          answer="שולחן"
          statusText={preview.statusText}
          streakData={{ currentStreak: 3, bestStreak: 7 }}
          onDismiss={() => setPreview(null)}
        />
      )}
    </div>
  )
}
