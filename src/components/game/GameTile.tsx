"use client"

import { useState, useEffect } from "react"
import type { TileState } from "@/types/shared"
import { TILE_FLIP_HALF } from "@/lib/game/constants"

interface Props {
  letter:     string
  state:      TileState
  delay?:     number    // ms stagger delay for the flip
  revealed:   boolean   // true for all completed rows
  animating?: boolean   // true only while this specific row's flip is in progress
}

const STATE_CLASSES: Record<TileState, string> = {
  correct: "tile-correct",
  present: "tile-present",
  absent:  "tile-absent",
  empty:   "tile-empty",
  tbd:     "tile-tbd",
}

export default function GameTile({ letter, state, delay = 0, revealed, animating = false }: Props) {
  // showColor tracks whether the result color class should be applied.
  // For pre-existing rows it's true from the start.
  // For the animating row it flips to true at the midpoint of the tile's flip.
  const [showColor, setShowColor] = useState(revealed && !animating)

  useEffect(() => {
    if (!animating) {
      // Row is no longer animating — apply color immediately (covers isRevealing→false transition)
      setShowColor(revealed)
      return
    }
    // Animating: hide color, then reveal it at the exact midpoint of this tile's flip
    setShowColor(false)
    const t = setTimeout(() => setShowColor(true), delay + TILE_FLIP_HALF)
    return () => clearTimeout(t)
  }, [animating, revealed, delay])

  const stateClass = showColor
    ? STATE_CLASSES[state]
    : letter ? "tile-tbd" : "tile-empty"

  const animClass = animating && letter
    ? "tile-flip"
    : !revealed && letter
      ? "tile-pop"
      : ""

  return (
    <div
      className={`
        flex h-[68px] w-[68px] items-center justify-center
        border-2 text-2xl font-bold uppercase select-none
        ${stateClass} ${animClass}
      `}
      style={animating && letter ? { animationDelay: `${delay}ms` } : undefined}
      aria-label={letter ? `${letter} ${state}` : "ריק"}
    >
      {letter}
    </div>
  )
}
