"use client"

import { useMemo } from "react"
import { createAvatar } from "@dicebear/core"
import { resolveOptions } from "@/lib/avatar/resolve"
import type { OptionDef, StyleConfig } from "@/lib/avatar/styles"

interface Props {
  opt:      OptionDef
  style:    StyleConfig
  current:  string[]
  onChange: (key: string, value: string[]) => void
}

const NULLABLE_KEYS = new Set(["facialHair", "accessories", "mask"])

function toDataUri(svg: string): string {
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`
}

function cropSvg(svg: string, viewBox: string): string {
  return svg.replace(/viewBox="[^"]*"/, `viewBox="${viewBox}"`)
}

export default function VisualOptionPicker({ opt, style, current, onChange }: Props) {
  const isNullable = NULLABLE_KEYS.has(opt.key)

  // Generate all thumbnails once on mount (synchronous, fast: ~1ms per avatar)
  const previews = useMemo<string[]>(() => {
    return opt.values.map((val) => {
      const avatar = createAvatar(style.module, {
        size: 280,
        ...resolveOptions({ ...style.previewBase, [opt.key]: [val] }),
      })
      const svg = opt.viewBox ? cropSvg(avatar.toString(), opt.viewBox) : avatar.toString()
      return toDataUri(svg)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opt.key, opt.viewBox, style.id])

  function select(val: string) {
    if (!isNullable && current.includes(val)) return
    onChange(opt.key, current.includes(val) ? [] : [val])
  }

  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">{opt.label}</p>
      <div className="flex flex-wrap gap-1.5">
        {isNullable && (
          <button
            onClick={() => onChange(opt.key, [])}
            className={`shrink-0 w-12 h-12 rounded-lg border-2 text-xs font-medium transition-all ${
              current.length === 0
                ? "border-green-500 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-400"
            }`}
          >
            ללא
          </button>
        )}
        {opt.values.map((val, i) => {
          const isSelected = current.includes(val)
          return (
            <button
              key={val}
              title={val}
              onClick={() => select(val)}
              className={`shrink-0 w-12 h-12 rounded-lg border-2 overflow-hidden transition-all ${
                isSelected
                  ? "border-green-500 scale-105 shadow"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-400"
              }`}
            >
              <img
                src={previews[i]}
                alt={val}
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}
