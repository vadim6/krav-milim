"use client"

import { useState, useMemo, useCallback } from "react"
import { createPortal } from "react-dom"
import { createAvatar } from "@dicebear/core"
import { AVATAR_STYLES } from "@/lib/avatar/styles"
import { randomAvatarConfig } from "@/lib/avatar/random"
import { resolveOptions } from "@/lib/avatar/resolve"
import VisualOptionPicker from "./VisualOptionPicker"
import type { AvatarConfig, StyleConfig } from "@/lib/avatar/styles"

interface Props {
  initialConfig: AvatarConfig | null
  username:      string
}

function buildPreview(style: StyleConfig, options: Record<string, string[]>): string {
  try {
    return createAvatar(style.module, { size: 160, ...resolveOptions(options) }).toDataUri()
  } catch {
    return ""
  }
}

function initOptions(style: StyleConfig, config: AvatarConfig | null): Record<string, string[]> {
  const base: Record<string, string[]> = {}
  for (const opt of style.options) {
    const fromConfig = config?.style === style.id
      ? (config.options[opt.key] as string[] | string | undefined)
      : undefined
    const defaultVal = style.defaultOptions[opt.key]

    if (Array.isArray(fromConfig))      base[opt.key] = fromConfig
    else if (typeof fromConfig === "string") base[opt.key] = [fromConfig]
    else if (Array.isArray(defaultVal)) base[opt.key] = defaultVal
    else if (typeof defaultVal === "string") base[opt.key] = [defaultVal]
    else                                base[opt.key] = []
  }
  return base
}

export default function AvatarBuilder({ initialConfig, username }: Props) {
  const [open, setOpen]     = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  const initialStyleId = initialConfig?.style ?? AVATAR_STYLES[0].id
  const [activeStyleId, setActiveStyleId] = useState(initialStyleId)

  const activeStyle = AVATAR_STYLES.find((s) => s.id === activeStyleId) ?? AVATAR_STYLES[0]

  const [options, setOptions] = useState<Record<string, string[]>>(
    () => initOptions(activeStyle, initialConfig)
  )

  function switchStyle(styleId: string) {
    const style = AVATAR_STYLES.find((s) => s.id === styleId)!
    setActiveStyleId(styleId as AvatarConfig["style"])
    setOptions(initOptions(style, initialConfig?.style === styleId ? initialConfig : null))
  }

  const previewUri = useMemo(() => buildPreview(activeStyle, options), [activeStyle, options])

  const NULLABLE_SWATCH_KEYS = new Set(["facialHair", "accessories", "mask"])

  function toggleOption(key: string, value: string) {
    setOptions((prev) => {
      const current = prev[key] ?? []
      if (!NULLABLE_SWATCH_KEYS.has(key) && current.includes(value)) return prev
      const next = current.includes(value) ? [] : [value]
      return { ...prev, [key]: next }
    })
  }

  const handleRandomize = useCallback(() => {
    const cfg     = randomAvatarConfig(activeStyleId as AvatarConfig["style"])
    const style   = AVATAR_STYLES.find((s) => s.id === cfg.style)!
    const newOpts: Record<string, string[]> = {}
    for (const opt of style.options) {
      const val = cfg.options[opt.key]
      newOpts[opt.key] = Array.isArray(val) ? val : val ? [val as string] : []
    }
    setOptions(newOpts)
  }, [activeStyleId])

  async function handleSave() {
    setSaving(true)
    setError(null)
    const config: AvatarConfig = { style: activeStyleId as AvatarConfig["style"], options }
    const res  = await fetch("/api/users/me", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ avatar_config: config }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? "שגיאה בשמירה"); setSaving(false); return }
    setSaving(false)
    setOpen(false)
    // Reload to show updated avatar on profile
    window.location.reload()
  }

  const modal = open ? (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold">ערוך אווטאר</h2>
          <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">✕</button>
        </div>

        <div className="flex flex-col md:flex-row overflow-hidden flex-1 min-h-0">
          {/* Preview panel */}
          <div className="flex flex-col items-center gap-3 p-4 border-b md:border-b-0 md:border-l border-gray-200 dark:border-gray-700 md:w-48 shrink-0">
            {previewUri ? (
              <img src={previewUri} alt="preview" width={120} height={120} className="rounded-full" />
            ) : (
              <div className="w-[120px] h-[120px] rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-3xl font-bold">
                {username?.[0]?.toUpperCase()}
              </div>
            )}
            <button
              onClick={handleRandomize}
              className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              🎲 אקראי
            </button>

            {/* Style tabs */}
            <div className="flex flex-col gap-1 w-full">
              {AVATAR_STYLES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => switchStyle(s.id)}
                  className={`text-xs px-2 py-1.5 rounded-lg transition-colors ${
                    activeStyleId === s.id
                      ? "bg-green-600 text-white"
                      : "border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Options panel */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeStyle.options.map((opt) => {
              const selected = options[opt.key] ?? []

              if (opt.type === "swatches") {
                return (
                  <div key={opt.key}>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">{opt.label}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {opt.values.map((hex) => {
                        const isTransparent = hex === "transparent"
                        const isSelected    = selected.includes(hex)
                        return (
                          <button
                            key={hex}
                            title={isTransparent ? "שקוף" : `#${hex}`}
                            onClick={() => toggleOption(opt.key, hex)}
                            style={isTransparent ? {} : { backgroundColor: `#${hex}` }}
                            className={`w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center ${
                              isSelected
                                ? "border-green-500 scale-110 shadow"
                                : "border-gray-300 dark:border-gray-600 hover:border-gray-400"
                            } ${isTransparent ? "bg-white dark:bg-gray-800" : ""}`}
                          >
                            {isTransparent && <span className="text-gray-400 text-[10px] leading-none">∅</span>}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              }

              // visual — image grid thumbnails
              return (
                <VisualOptionPicker
                  key={opt.key}
                  opt={opt}
                  style={activeStyle}
                  current={selected}
                  onChange={(key, val) => setOptions((p) => ({ ...p, [key]: val }))}
                />
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-2 mr-auto">
            <button
              onClick={() => setOpen(false)}
              className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              ביטול
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-40 transition-colors"
            >
              {saving ? "שומר…" : "שמור"}
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="ערוך אווטאר"
        className="absolute inset-0 rounded-full bg-black/0 hover:bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
      >
        <span className="text-white text-xs font-semibold">✏️</span>
      </button>
      {open && typeof window !== "undefined" && createPortal(modal, document.body)}
    </>
  )
}
