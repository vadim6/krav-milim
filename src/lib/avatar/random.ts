import { AVATAR_STYLES } from "./styles"
import type { AvatarConfig, StyleId } from "./styles"

export function randomAvatarConfig(styleId?: StyleId): AvatarConfig {
  const style = styleId
    ? AVATAR_STYLES.find((s) => s.id === styleId) ?? AVATAR_STYLES[0]
    : AVATAR_STYLES[Math.floor(Math.random() * AVATAR_STYLES.length)]

  const options: Record<string, string[]> = {}
  for (const opt of style.options) {
    // Nullable options (facialHair, accessories) — 40% chance of none
    const isNullable = opt.key === "facialHair" || opt.key === "accessories"
    if (isNullable && Math.random() < 0.4) {
      options[opt.key] = []
    } else {
      options[opt.key] = [opt.values[Math.floor(Math.random() * opt.values.length)]]
    }
  }

  return { style: style.id, options }
}
