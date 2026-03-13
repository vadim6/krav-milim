"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

interface Props {
  initialUsername: string
  changedAt: string | null
}

const COOLDOWN_DAYS = 30

function daysLeft(changedAt: string | null): number {
  if (!changedAt) return 0
  const diff = (Date.now() - new Date(changedAt).getTime()) / 86_400_000
  return Math.max(0, Math.ceil(COOLDOWN_DAYS - diff))
}

export default function UsernameEditor({ initialUsername, changedAt }: Props) {
  const [editing, setEditing]         = useState(false)
  const [username, setUsername]       = useState(initialUsername)
  const [input, setInput]             = useState(initialUsername)
  const [checking, setChecking]       = useState(false)
  const [available, setAvailable]     = useState<boolean | null>(null)
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [showTooltip, setShowTooltip] = useState(false)

  const cooldown = daysLeft(changedAt)
  const canEdit  = cooldown === 0

  function handleLockedClick() {
    setShowTooltip(true)
    setTimeout(() => setShowTooltip(false), 3000)
  }

  // Debounced availability check
  useEffect(() => {
    if (!editing) return
    if (input === username || input.length < 2) { setAvailable(null); return }
    const t = setTimeout(async () => {
      setChecking(true)
      const supabase = createClient()
      const { data } = await supabase
        .from("users")
        .select("id")
        .eq("username", input)
        .maybeSingle()
      setAvailable(!data)
      setChecking(false)
    }, 400)
    return () => clearTimeout(t)
  }, [input, editing, username])

  function startEdit() {
    setInput(username)
    setAvailable(null)
    setError(null)
    setEditing(true)
  }

  function cancelEdit() {
    setEditing(false)
    setError(null)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (input === username) { setEditing(false); return }
    if (!available) return
    setSaving(true)
    setError(null)

    const res  = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: input }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? "שגיאה בשמירה")
      setSaving(false)
      return
    }

    setUsername(data.username)
    setEditing(false)
    setSaving(false)
  }

  if (editing) {
    const showFeedback = input !== username && input.length >= 2 && !checking
    return (
      <form onSubmit={handleSave} className="flex items-center gap-2">
        <div className="relative">
          <input
            autoFocus
            type="text"
            minLength={2}
            maxLength={30}
            value={input}
            onChange={(e) => { setInput(e.target.value.trim()); setAvailable(null); setError(null) }}
            className={`rounded-lg border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 dark:bg-gray-800 ${
              showFeedback
                ? available
                  ? "border-green-400 focus:ring-green-500"
                  : "border-red-400 focus:ring-red-400"
                : "border-gray-300 dark:border-gray-600 focus:ring-green-500"
            }`}
          />
          {input.length >= 2 && (
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs">
              {checking ? "⏳" : input === username ? null : available ? "✅" : "❌"}
            </span>
          )}
        </div>
        <button
          type="submit"
          disabled={saving || (input !== username && !available)}
          className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-40 transition-colors"
        >
          {saving ? "שומר…" : "שמור"}
        </button>
        <button
          type="button"
          onClick={cancelEdit}
          className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          ביטול
        </button>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </form>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <h1 className="text-2xl font-bold">{username}</h1>
      <div className="relative">
        <button
          onClick={canEdit ? startEdit : handleLockedClick}
          title={canEdit ? "שנה שם משתמש" : undefined}
          className={`transition-colors ${
            canEdit
              ? "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              : "text-gray-300 dark:text-gray-600 cursor-default"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
        </button>
        {showTooltip && (
          <div className="absolute bottom-full mb-1.5 right-0 whitespace-nowrap rounded-md bg-gray-800 dark:bg-gray-700 px-2.5 py-1 text-xs text-white shadow-md">
            ניתן לשנות בעוד {cooldown} ימים
            <span className="absolute top-full right-2 border-4 border-transparent border-t-gray-800 dark:border-t-gray-700" />
          </div>
        )}
      </div>
    </div>
  )
}
