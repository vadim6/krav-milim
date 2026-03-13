/** Options whose visibility is gated by a separate *Probability key (0–100). */
const PROBABILITY_PAIRS: Array<{ key: string; probKey: string }> = [
  { key: "facialHair",  probKey: "facialHairProbability"  },
  { key: "accessories", probKey: "accessoriesProbability" },
  { key: "mask",        probKey: "maskProbability"        },
]

/**
 * Spreads raw option arrays into a DiceBear-compatible options object and
 * injects the correct *Probability values so nullable options (beard,
 * accessories) are always shown/hidden deterministically.
 */
export function resolveOptions(
  options: Record<string, string | string[]>,
): Record<string, unknown> {
  const resolved: Record<string, unknown> = { ...options }

  for (const { key, probKey } of PROBABILITY_PAIRS) {
    if (key in resolved) {
      const val = resolved[key]
      const hasValue = Array.isArray(val) ? val.length > 0 : Boolean(val)
      resolved[probKey] = hasValue ? 100 : 0
    }
  }

  return resolved
}
