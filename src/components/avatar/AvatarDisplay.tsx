"use client"

import { useMemo } from "react"
import { createAvatar } from "@dicebear/core"
import { AVATAR_STYLES } from "@/lib/avatar/styles"
import { resolveOptions } from "@/lib/avatar/resolve"
import type { AvatarConfig } from "@/lib/avatar/styles"

interface Props {
  config:    AvatarConfig | null
  username:  string
  size?:     number
  className?: string
}

const BG_COLORS = [
  "bg-green-200 text-green-700",
  "bg-blue-200 text-blue-700",
  "bg-purple-200 text-purple-700",
  "bg-rose-200 text-rose-700",
  "bg-amber-200 text-amber-700",
]

export default function AvatarDisplay({ config, username, size = 40, className = "" }: Props) {
  const dataUri = useMemo(() => {
    try {
      if (config) {
        const styleEntry = AVATAR_STYLES.find((s) => s.id === config.style)
        if (!styleEntry) throw new Error("unknown style")
        return createAvatar(styleEntry.module, {
          size,
          ...resolveOptions(config.options),
        }).toDataUri()
      }
      // No config — generate a deterministic avatar seeded from the username
      const FALLBACK_BG = ["b6e3f4","c0aede","d1d4f9","ffd5dc","ffdfbf","a8e6cf","ffd3b6","dcedc1"]
      const bg = FALLBACK_BG[username.charCodeAt(0) % FALLBACK_BG.length]
      const fallbackStyle = AVATAR_STYLES[0]
      return createAvatar(fallbackStyle.module, { seed: username, size, backgroundColor: [bg] }).toDataUri()
    } catch {
      return null
    }
  }, [config, username, size])

  const sizeStyle = { width: size, height: size }

  if (dataUri) {
    return (
      <img
        src={dataUri}
        alt={username}
        width={size}
        height={size}
        style={sizeStyle}
        className={`rounded-full object-cover ${className}`}
      />
    )
  }

  // Ultimate fallback: letter circle
  const colorClass = BG_COLORS[(username.charCodeAt(0) ?? 0) % BG_COLORS.length]
  return (
    <div
      style={sizeStyle}
      className={`rounded-full flex items-center justify-center font-bold ${colorClass} ${className}`}
    >
      {username?.[0]?.toUpperCase()}
    </div>
  )
}
