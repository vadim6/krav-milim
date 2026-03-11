"use client"

import type { GuessHistoryEntry, TileState } from "@/types/shared"

interface Props {
  status:       "won" | "lost"
  guessCount:   number
  guessHistory: GuessHistoryEntry[]
}

const TILE_EMOJI: Record<string, string> = {
  correct: "🟩",
  present: "🟨",
  absent:  "⬛",
  empty:   "⬜",
  tbd:     "⬜",
}

export default function GameStatus({ status, guessCount, guessHistory }: Props) {
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
    <div className="flex flex-col items-center gap-3 rounded-2xl border p-6 text-center w-full max-w-xs">
      {status === "won" ? (
        <>
          <p className="text-3xl">🎉</p>
          <p className="text-xl font-bold">כל הכבוד!</p>
          <p className="text-sm text-gray-500">פתרת ב‑{guessCount} ניחושים</p>
        </>
      ) : (
        <>
          <p className="text-3xl">😔</p>
          <p className="text-xl font-bold">הפסדת הפעם</p>
        </>
      )}

      <button
        onClick={handleShare}
        className="mt-2 rounded-lg bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-700 transition-colors"
      >
        שתף תוצאה
      </button>
    </div>
  )
}
