"use client"

import { useEffect, useState } from "react"
import type { RevealedLetters, GuessHistoryEntry } from "@/types/shared"
import { HEBREW_KEYBOARD_ROWS, KEY_ENTER, KEY_DELETE, TILE_FLIP_HALF, TILE_STAGGER } from "@/lib/game/constants"
import { normalizeHebrew } from "@/lib/game/hebrew"

interface Props {
  revealedLetters:      RevealedLetters
  prevRevealedLetters?: RevealedLetters    // state before the animating row was added
  animatingEntry?:      GuessHistoryEntry  // the row currently flipping
  isRevealing:          boolean
  onKey:                (key: string) => void
}

type KeyState = "correct" | "present" | "absent" | "unused"

const STATE_PRIORITY: Record<KeyState, number> = { correct: 3, present: 2, absent: 1, unused: 0 }

function stateOf(letter: string, revealed: RevealedLetters): KeyState {
  if (revealed.correct.includes(letter)) return "correct"
  if (revealed.present.includes(letter)) return "present"
  if (revealed.absent.includes(letter))  return "absent"
  return "unused"
}

const keyColors: Record<KeyState, string> = {
  correct: "bg-[var(--tile-correct)] text-white",
  present: "bg-[var(--tile-present)] text-white",
  absent:  "bg-[var(--tile-absent)]  text-white",
  unused:  "bg-[var(--key-bg)]       text-[var(--key-text)]",
}

const baseKey = "flex items-center justify-center rounded h-14 text-base font-bold hover:opacity-80 active:scale-95 transition select-none cursor-pointer"

export default function HebrewKeyboard({
  revealedLetters,
  prevRevealedLetters,
  animatingEntry,
  isRevealing,
  onKey,
}: Props) {
  // `displayed` is what the keyboard actually renders.
  // During a flip it lags behind revealedLetters and catches up one key at a time.
  const [displayed, setDisplayed] = useState<RevealedLetters>(revealedLetters)

  // Physical keyboard support
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (e.key === "Enter")     { onKey(KEY_ENTER);  return }
      if (e.key === "Backspace") { onKey(KEY_DELETE); return }
      if (e.key.length === 1)    { onKey(normalizeHebrew(e.key)) }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onKey])

  // Sync key colors: stagger each key in sync with its tile's flip midpoint
  useEffect(() => {
    if (!isRevealing || !animatingEntry || !prevRevealedLetters) {
      setDisplayed(revealedLetters)
      return
    }

    // Reset to pre-guess state while tiles are flipping
    setDisplayed(prevRevealedLetters)

    // Each letter's key color appears at the exact moment its tile reveals color
    const timers: ReturnType<typeof setTimeout>[] = []

    animatingEntry.guess.split("").forEach((rawLetter, i) => {
      const letter   = normalizeHebrew(rawLetter)
      const newState = animatingEntry.result[i] as KeyState | undefined
      if (!newState || newState === "empty" || newState === "tbd") return

      timers.push(setTimeout(() => {
        setDisplayed(prev => {
          // Only upgrade a key's state (correct > present > absent), never downgrade
          if ((STATE_PRIORITY[newState] ?? 0) <= STATE_PRIORITY[stateOf(letter, prev)]) return prev

          const next: RevealedLetters = {
            correct: [...prev.correct],
            present: [...prev.present],
            absent:  [...prev.absent],
          }
          if (newState === "correct") {
            if (!next.correct.includes(letter)) next.correct.push(letter)
            next.present = next.present.filter(l => l !== letter)
            next.absent  = next.absent.filter(l => l !== letter)
          } else if (newState === "present") {
            if (!next.present.includes(letter)) next.present.push(letter)
            next.absent = next.absent.filter(l => l !== letter)
          } else if (newState === "absent") {
            if (!next.absent.includes(letter)) next.absent.push(letter)
          }
          return next
        })
      }, i * TILE_STAGGER + TILE_FLIP_HALF))
    })

    return () => timers.forEach(clearTimeout)
  }, [isRevealing, animatingEntry, prevRevealedLetters, revealedLetters])

  return (
    <div className="flex flex-col gap-1.5 w-full max-w-[500px]" dir="rtl">
      {HEBREW_KEYBOARD_ROWS.map((row, ri) => (
        <div key={ri} className="flex justify-center gap-1">
          {ri === 2 && (
            <button
              onClick={() => onKey(KEY_ENTER)}
              className={`${baseKey} flex-[1.6] bg-gray-300 dark:bg-gray-600 text-sm`}
              aria-label="Enter"
            >
              ↵ Enter
            </button>
          )}

          {row.map((letter) => (
            <button
              key={letter}
              onClick={() => onKey(letter)}
              className={`${baseKey} flex-1 ${keyColors[stateOf(normalizeHebrew(letter), displayed)]}`}
              aria-label={letter}
            >
              {letter}
            </button>
          ))}

          {ri === 2 && (
            <button
              onClick={() => onKey(KEY_DELETE)}
              className={`${baseKey} flex-[1.6] bg-gray-300 dark:bg-gray-600 text-sm`}
              aria-label="מחק"
            >
              ⌫
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
