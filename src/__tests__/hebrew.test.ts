import { describe, it, expect } from "vitest"
import { normalizeWord, normalizeHebrew } from "@/lib/game/hebrew"

describe("normalizeHebrew", () => {
  it("converts final ך to כ", () => expect(normalizeHebrew("ך")).toBe("כ"))
  it("converts final ם to מ", () => expect(normalizeHebrew("ם")).toBe("מ"))
  it("converts final ן to נ", () => expect(normalizeHebrew("ן")).toBe("נ"))
  it("converts final ף to פ", () => expect(normalizeHebrew("ף")).toBe("פ"))
  it("converts final ץ to צ", () => expect(normalizeHebrew("ץ")).toBe("צ"))
  it("leaves base-form letters unchanged", () => expect(normalizeHebrew("כ")).toBe("כ"))
  it("leaves non-Hebrew characters unchanged", () => expect(normalizeHebrew("a")).toBe("a"))
})

describe("normalizeWord", () => {
  it("normalizes final forms within a word", () => {
    // שלום ends with ם (final mem) — normalized to מ
    expect(normalizeWord("שלוםמ")).toBe("שלוממ")
  })

  it("leaves a fully base-form word unchanged", () => {
    expect(normalizeWord("שולח")).toBe("שולח")
  })

  it("normalizes multiple final forms in one word", () => {
    // word with ך and ן
    expect(normalizeWord("כךנן")).toBe("ככננ")
  })
})
