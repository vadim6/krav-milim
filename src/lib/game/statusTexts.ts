export interface StatusText {
  emoji: string
  title: string
  subtitle?: string   // optional extra line, e.g. for guess count placeholder
}

/**
 * Win messages — subtitle may contain "{guesses}" which callers replace
 * with the actual guess count.
 */
export const WIN_TEXTS: StatusText[] = [
  { emoji: "🎉", title: "כל הכבוד!",         subtitle: "פתרת ב‑{guesses} ניחושים" },
  { emoji: "🔥", title: "מדהים!",             subtitle: "פתרת ב‑{guesses} ניחושים" },
  { emoji: "🧠", title: "גאון!",       subtitle: "פתרת ב‑{guesses} ניחושים" },
  { emoji: "⚡", title: "סוויש!",         subtitle: "פתרת ב‑{guesses} ניחושים" },
  { emoji: "🎯", title: "נייס!",      subtitle: "פתרת ב‑{guesses} ניחושים" },
  { emoji: "🏆", title: "אלוף!",              subtitle: "פתרת ב‑{guesses} ניחושים" },
  { emoji: "🧨", title: "תותח!",             subtitle: "פתרת ב‑{guesses} ניחושים" },
  { emoji: "🦄", title: "יאהו!",             subtitle: "פתרת ב‑{guesses} ניחושים" },
  { emoji: "🌈", title: "מרשים!",             subtitle: "פתרת ב‑{guesses} ניחושים" },
  { emoji: "🦈", title: "כריש!",             subtitle: "פתרת ב‑{guesses} ניחושים" },
]

/** Loss messages */
export const LOSS_TEXTS: StatusText[] = [
  { emoji: "😔", title: "הפסדת הפעם",   subtitle: "תמיד יש את מחר" },
  { emoji: "😤", title: "כמעט!",        subtitle: "נתראה מחר" },
  { emoji: "🤔", title: "מילה קשה...",  subtitle: "מחר יום חדש" },
  { emoji: "💪", title: "אל ייאוש!",   subtitle: "מחר זה היום שלך" },
  { emoji: "🙈", title: "אוי...",        subtitle: "מחר תנצח בטוח" },
  { emoji: "😭", title: "באסה",        subtitle: "מחר זה שלך" },
]

/** Pick a random item from an array (stable for a given session via index seed) */
export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}
