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
    if (!config) return null
    const styleEntry = AVATAR_STYLES.find((s) => s.id === config.style)
    if (!styleEntry) return null
    try {
      const avatar = createAvatar(styleEntry.module, {
        size,
        ...resolveOptions(config.options),
      })
      return avatar.toDataUri()
    } catch {
      return null
    }
  }, [config, size])

  const colorClass = BG_COLORS[(username.charCodeAt(0) ?? 0) % BG_COLORS.length]
  const sizeStyle  = { width: size, height: size }

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

  return (
    <div
      style={sizeStyle}
      className={`rounded-full flex items-center justify-center font-bold ${colorClass} ${className}`}
    >
      {username?.[0]?.toUpperCase()}
    </div>
  )
}
