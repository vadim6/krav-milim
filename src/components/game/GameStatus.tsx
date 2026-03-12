"use client"

import type { GuessHistoryEntry, TileState } from "@/types/shared"
import type { StatusText } from "@/lib/game/statusTexts"

interface Props {
  status:     "won" | "lost"
  guessCount: number
  guessHistory: GuessHistoryEntry[]
  answer:     string | null
  statusText: StatusText
  onDismiss:  () => void
}

const TILE_EMOJI: Record<string, string> = {
  correct: "🟩",
  present: "🟨",
  absent:  "⬛",
  empty:   "⬜",
  tbd:     "⬜",
}

export default function GameStatus({ status, guessCount, guessHistory, answer, statusText, onDismiss }: Props) {
  const subtitle = statusText.subtitle?.replace("{guesses}", String(guessCount))

  const shareText =
    `קרב מילים — ${status === "won" ? `${guessCount}/6` : "X/6"}\n\n` +
    guessHistory
      .map((row) => row.result.map((s: TileState) => TILE_EMOJI[s] ?? "⬛").join(""))
      .join("\n")

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
        <p className="text-4xl">{statusText.emoji}</p>
        <p className="text-xl font-bold">{statusText.title}</p>

        {subtitle && (
          <p className="text-sm text-gray-500">{subtitle}</p>
        )}

        {status === "lost" && answer && (
          <p className="text-sm text-gray-500">
            המילה הייתה: <span className="font-bold text-[var(--foreground)]">{answer}</span>
          </p>
        )}

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
      </div>
    </div>
  )
}
