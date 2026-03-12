import { readFileSync } from "fs"
import path from "path"
import { normalizeWord } from "./hebrew"

let cachedSet: Set<string> | null = null

/** Returns a Set of all valid 5-letter Hebrew words. Cached after first load. */
export function getValidWords(): Set<string> {
  if (cachedSet) return cachedSet

  const filePath = path.join(process.cwd(), "word_lists", "full_words_list.txt")
  const raw = readFileSync(filePath, "utf-8")
  cachedSet = new Set(
    raw
      .split("\n")
      .map((w) => normalizeWord(w.trim()))
      .filter(Boolean),
  )
  return cachedSet
}

export function isValidWord(word: string): boolean {
  return getValidWords().has(normalizeWord(word))
}
