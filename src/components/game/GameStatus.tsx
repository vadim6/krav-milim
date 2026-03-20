"use client"

import Link from "next/link"
import type { GuessHistoryEntry, TileState } from "@/types/shared"
import type { StatusText } from "@/lib/game/statusTexts"

interface Props {
  status:     "won" | "lost"
  guessCount: number
  guessHistory: GuessHistoryEntry[]
  answer:     string | null
  statusText: StatusText
  streakData: { currentStreak: number; bestStreak: number } | null
  isDemo?:    boolean
  onDismiss:  () => void
}

const TILE_EMOJI: Record<string, string> = {
  correct: "🟩",
  present: "🟨",
  absent:  "⬛",
  empty:   "⬜",
  tbd:     "⬜",
}

export default function GameStatus({ status, guessCount, guessHistory, answer, statusText, streakData, isDemo, onDismiss }: Props) {
  const subtitle = statusText.subtitle?.replace("{guesses}", String(guessCount))

  const dateStr = new Date().toLocaleDateString("he-IL", { day: "numeric", month: "numeric", year: "numeric" })
  const attemptsLine = status === "won"
    ? `${guessCount} מתוך 6 ניסיונות`
    : `\u200FX מתוך 6 ניסיונות`

  const shareText =
    `קרב מילים — ${dateStr}\n\n` +
    `${attemptsLine}\n\n` +
    guessHistory
      .map((row) => [...row.result].reverse().map((s: TileState) => TILE_EMOJI[s] ?? "⬛").join(""))
      .join("\n") +
    `\n\nhttps://krav-milim.com/game`

  async function handleShare() {
    if (navigator.share) {
      await navigator.share({ text: shareText })
    } else {
      await navigator.clipboard.writeText(shareText)
      alert("הועתק ללוח!")
    }
  }

  return (
    /* Backdrop — click outside card to dismiss */
    <div
      className="absolute inset-0 z-40 flex items-center justify-center"
      onClick={onDismiss}
    >
      {/* Card — stop propagation so clicking inside doesn't dismiss */}
      <div
        className="flex flex-col items-center gap-3 rounded-2xl border border-gray-700 bg-[var(--background)] p-6 text-center w-full max-w-[260px] mx-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {streakData !== null && !isDemo && (
          <div className="w-full flex justify-center gap-6 pb-1 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-2xl font-bold">{streakData.currentStreak}</span>
              <span className="text-xs text-gray-500">רצף נוכחי</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-2xl font-bold">{streakData.bestStreak}</span>
              <span className="text-xs text-gray-500">רצף שיא</span>
            </div>
          </div>
        )}

        <p className="text-4xl">{statusText.emoji}</p>
        <p className="text-xl font-bold whitespace-pre-line">
          {isDemo
            ? status === "won" ? "כל הכבוד!\nרוצה להתחרות באמת?" : "הפעם לא...\nנסה שוב עם חשבון"
            : statusText.title}
        </p>

        {!isDemo && subtitle && (
          <p className="text-sm text-gray-500">{subtitle}</p>
        )}

        {status === "lost" && answer && (
          <p className="text-sm text-gray-500">
            המילה הייתה: <span className="font-bold text-[var(--foreground)]">{answer}</span>
          </p>
        )}

        {isDemo ? (
          <div className="flex flex-col gap-2 mt-2 w-full">
            <Link
              href="/signup"
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition-colors text-center"
            >
              הירשם כדי להתחרות ←
            </Link>
            <Link
              href="/demo/leaderboard"
              className="rounded-lg border border-gray-600 px-4 py-2 text-sm font-semibold text-gray-300 hover:border-gray-400 transition-colors text-center"
            >
              ראה את הדירוג
            </Link>
            <button
              onClick={onDismiss}
              className="text-xs text-gray-500 hover:text-gray-400 transition-colors mt-1"
            >
              סגור
            </button>
          </div>
        ) : (
          <div className="flex gap-2 mt-2">
            <button
              onClick={onDismiss}
              className="rounded-lg border border-gray-400 dark:border-gray-600 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:border-gray-600 dark:hover:border-gray-400 transition-colors"
            >
              סגור
            </button>
            <button
              onClick={handleShare}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition-colors"
            >
              שתף תוצאה
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
