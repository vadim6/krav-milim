export const WORD_LENGTH = 5
export const MAX_GUESSES = 6

/** Tile flip animation timing — must stay in sync with globals.css tile-flip keyframe */
export const TILE_FLIP_HALF = 250   // midpoint when tile is face-down; color reveals here
export const TILE_STAGGER   = 300   // delay between each successive tile's flip start

/**
 * Hebrew keyboard rows — RTL layout.
 * Only base forms (no sofiot). Each of the 22 base letters appears exactly once.
 *
 *   Row 1 (6): פ ו ט א ר ק
 *   Row 2 (8): ל ח י ע כ ג ד ש
 *   Row 3 (8): ת צ מ נ ה ב ס ז  + action keys
 */
export const HEBREW_KEYBOARD_ROWS: string[][] = [
  ["פ", "ו", "ט", "א", "ר", "ק"],
  ["ל", "ח", "י", "ע", "כ", "ג", "ד", "ש"],
  ["ת", "צ", "מ", "נ", "ה", "ב", "ס", "ז"],
]

/** Virtual key codes for the on-screen keyboard */
export const KEY_ENTER  = "ENTER"
export const KEY_DELETE = "DELETE"
