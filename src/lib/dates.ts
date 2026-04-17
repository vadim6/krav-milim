const ISRAEL_TZ = "Asia/Jerusalem"

/** Today's date string (YYYY-MM-DD) in Israel time. */
export function israelToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ISRAEL_TZ }).format(new Date())
}

/** Yesterday's date string (YYYY-MM-DD) in Israel time. */
export function israelYesterday(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return new Intl.DateTimeFormat("en-CA", { timeZone: ISRAEL_TZ }).format(d)
}

const HEBREW_MONTHS: Record<number, string> = {
  1:  "ינואר",
  2:  "פברואר",
  3:  "מרץ",
  4:  "אפריל",
  5:  "מאי",
  6:  "יוני",
  7:  "יולי",
  8:  "אוגוסט",
  9:  "ספטמבר",
  10: "אוקטובר",
  11: "נובמבר",
  12: "דצמבר",
}

/** Format a YYYY-MM-DD string as Hebrew date, e.g. "אפריל 15, 2026". */
export function formatHebrewDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number)
  return `${HEBREW_MONTHS[month]} ${day}, ${year}`
}
