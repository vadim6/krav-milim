export interface StatusText {
  emoji: string
  title: string
  subtitle?: string
}

const WIN_TITLE_POOL: Array<{ emoji: string; title: string }> = [
  { emoji: "🎉", title: "כל הכבוד!" },
  { emoji: "🔥", title: "מדהים!" },
  { emoji: "🧠", title: "מושלם!" },
  { emoji: "⚡", title: "סוויש!" },
  { emoji: "🎯", title: "בול!" },
  { emoji: "🏆", title: "וואו!" },
  { emoji: "🧨", title: "פגז!" },
  { emoji: "🦄", title: "יאהו!" },
  { emoji: "🌈", title: "מרשים!" },
  { emoji: "🤩", title: "מצוין!" },
  { emoji: "😎", title: "קול!" },
  { emoji: "🔥", title: "אש!" },
  { emoji: "🚀", title: "שלמות!" },
  { emoji: "🍻", title: "הידד!" },
  { emoji: "👑", title: "אין עליך!" },
  { emoji: "🥳", title: "עלא כיפק!" },
  { emoji: "🤘", title: "בום!" },
  { emoji: "😍", title: "מרגש!" },
]

const WIN_SUBTITLE_POOL: string[] = [
  "פתרת ב‑{guesses} ניחושים",
  "רק {guesses} ניחושים!",
  "פיצחת אותה ב‑{guesses}!",
  "ב‑{guesses} ניחושים בדיוק",
  "{guesses} ניחושים מושלמים",
  "{guesses} ניחושים מוצלחים",
]

const LOSS_TITLE_POOL: Array<{ emoji: string; title: string }> = [
  { emoji: "😔", title: "הפסדת הפעם" },
  { emoji: "😤", title: "אוף!" },
  { emoji: "🤔", title: "מילה קשה..." },
  { emoji: "💪", title: "אל ייאוש!" },
  { emoji: "🙈", title: "אוי..." },
  { emoji: "😭", title: "באסה" },
  { emoji: "😩", title: "כמעט!" },
  { emoji: "😱", title: "אוי לא" },
  { emoji: "😵‍💫", title: "נו באמת!" },
  { emoji: "😵", title: "כל כך קרוב" },
  { emoji: "🤕", title: "אבוי!" },
  { emoji: "😳", title: "מצער" },
  { emoji: "🤬", title: "לאאאא!" },
]

const LOSS_SUBTITLE_POOL: string[] = [
  "תמיד יש את מחר",
  "נתראה מחר",
  "מחר יום חדש",
  "מחר זה היום שלך",
  "הניסיון הבא שלך מחכה",
  "מחר זה שלך",
  "אל ייאוש, מחר זה היום",
]

/**
 * Pick (and remember) a win/loss message for a given word.
 * Persists the selection in localStorage so the same message shows on refresh.
 * Storage format: "titleIdx,subtitleIdx" — old single-integer values are ignored.
 */
export function pickStatusText(
  type: "won" | "lost",
  lsKey: string,
): StatusText {
  const titlePool   = type === "won" ? WIN_TITLE_POOL   : LOSS_TITLE_POOL
  const subtitlePool = type === "won" ? WIN_SUBTITLE_POOL : LOSS_SUBTITLE_POOL

  const stored = typeof window !== "undefined" ? localStorage.getItem(lsKey) : null
  if (stored !== null) {
    const [ti, si] = stored.split(",").map(Number)
    if (!isNaN(ti) && !isNaN(si) && ti < titlePool.length && si < subtitlePool.length) {
      return { ...titlePool[ti], subtitle: subtitlePool[si] }
    }
  }

  const ti = Math.floor(Math.random() * titlePool.length)
  const si = Math.floor(Math.random() * subtitlePool.length)
  if (typeof window !== "undefined") localStorage.setItem(lsKey, `${ti},${si}`)
  return { ...titlePool[ti], subtitle: subtitlePool[si] }
}
