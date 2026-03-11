import type { GuessHistoryEntry, TileState } from "@/types/shared"
import GameTile from "./GameTile"
import { WORD_LENGTH, TILE_STAGGER } from "@/lib/game/constants"
import { BASE_TO_FINAL } from "@/lib/game/hebrew"

interface Props {
  entry?:     GuessHistoryEntry   // undefined = empty row
  current?:   string              // current in-progress guess (base letters)
  invalid?:   boolean             // shake animation
  revealed?:  boolean             // true for completed rows
  animating?: boolean             // true only while this row's flip is in progress
}

/**
 * Only convert the last letter to its final (sofit) form when all 5 positions
 * are filled. This avoids flickering where intermediate letters briefly appear
 * as final forms before the next letter is typed.
 */
function applyFinalForm(word: string): string {
  if (word.length < WORD_LENGTH) return word
  const letters = word.split("")
  const last = letters.length - 1
  letters[last] = BASE_TO_FINAL[letters[last]] ?? letters[last]
  return letters.join("")
}

export default function GameRow({ entry, current = "", invalid, revealed = false, animating = false }: Props) {
  const displayCurrent = applyFinalForm(current)
  const tiles: Array<{ letter: string; state: TileState }> = []

  if (entry) {
    for (let i = 0; i < WORD_LENGTH; i++) {
      tiles.push({ letter: entry.guess[i] ?? "", state: entry.result[i] ?? "absent" })
    }
  } else {
    for (let i = 0; i < WORD_LENGTH; i++) {
      tiles.push({ letter: displayCurrent[i] ?? "", state: "empty" })
    }
  }

  return (
    <div
      className={`flex gap-1.5 justify-center ${invalid ? "row-shake" : ""}`}
      role="row"
    >
      {tiles.map(({ letter, state }, i) => (
        <GameTile
          key={i}
          letter={letter}
          state={entry ? state : letter ? "tbd" : "empty"}
          delay={i * TILE_STAGGER}
          revealed={!!entry && revealed}
          animating={!!entry && animating}
        />
      ))}
    </div>
  )
}
