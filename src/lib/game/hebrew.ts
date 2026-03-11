/**
 * Hebrew language utilities.
 *
 * Hebrew has 5 letters with distinct final forms (sofiot) used at the
 * end of words. For game purposes final and regular forms are equivalent.
 */

/** Map final form → base form */
export const FINAL_TO_BASE: Record<string, string> = {
  ך: "כ",
  ם: "מ",
  ן: "נ",
  ף: "פ",
  ץ: "צ",
}

/** Map base form → final form */
export const BASE_TO_FINAL: Record<string, string> = {
  כ: "ך",
  מ: "ם",
  נ: "ן",
  פ: "ף",
  צ: "ץ",
}

/** All 27 Hebrew letters (22 base + 5 finals) */
export const HEBREW_ALPHABET =
  "אבגדהוזחטיכלמנסעפצקרשתךםןףץ".split("")

/** All 22 base Hebrew letters */
export const HEBREW_BASE_LETTERS =
  "אבגדהוזחטיכלמנסעפצקרשת".split("")

/**
 * Normalize a Hebrew letter: convert final form to base form.
 * Non-Hebrew characters are returned as-is.
 */
export function normalizeHebrew(letter: string): string {
  return FINAL_TO_BASE[letter] ?? letter
}

/**
 * Normalize every letter in a word.
 */
export function normalizeWord(word: string): string {
  return word.split("").map(normalizeHebrew).join("")
}

/**
 * Returns true if the string contains only valid Hebrew letters
 * (base or final forms, no nikud).
 */
export function isHebrewWord(word: string): boolean {
  return word.split("").every((ch) => HEBREW_ALPHABET.includes(ch))
}
