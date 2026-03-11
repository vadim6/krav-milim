"use client"

import { useState, useEffect, useTransition } from "react"

interface WordRow {
  id:         string
  word:       string
  date:       string | null
  source:     string
  created_at: string
}

function todayStr() {
  return new Date().toISOString().split("T")[0]
}

export default function AdminWordsPage() {
  const [words, setWords]                     = useState<WordRow[]>([])
  const [newWord, setNewWord]                 = useState("")
  const [newDate, setNewDate]                 = useState(todayStr())
  const [poolRemaining, setPoolRemaining]     = useState<number | null>(null)
  const [error, setError]                     = useState<string | null>(null)
  const [success, setSuccess]                 = useState<string | null>(null)
  const [confirmPickNow, setConfirmPickNow]   = useState(false)
  const [confirmPickToday, setConfirmPickToday] = useState(false)
  const [isPending, startTransition]          = useTransition()

  async function loadWords() {
    const [wordsRes, statsRes] = await Promise.all([
      fetch("/api/admin/words"),
      fetch("/api/admin/stats"),
    ])
    if (wordsRes.ok) setWords(await wordsRes.json())
    if (statsRes.ok) {
      const stats = await statsRes.json()
      setPoolRemaining(stats.poolRemaining ?? null)
    }
  }

  useEffect(() => { loadWords() }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const res = await fetch("/api/admin/words", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ word: newWord.trim(), date: newDate }),
      })
      if (!res.ok) {
        const { error } = await res.json()
        setError(error ?? "שגיאה")
      } else {
        setSuccess(`המילה "${newWord}" נוספה ל-${newDate}`)
        setNewWord("")
        await loadWords()
      }
    })
  }

  async function handlePickNow() {
    setError(null)
    setSuccess(null)
    setConfirmPickNow(false)
    const res = await fetch("/api/admin/words?action=pick_now", { method: "PUT" })
    if (!res.ok) {
      const { error } = await res.json()
      setError(error ?? "שגיאה")
    } else {
      const { message } = await res.json()
      setSuccess(message)
      await loadWords()
    }
  }

  async function handlePickToday() {
    setError(null)
    setSuccess(null)
    setConfirmPickToday(false)
    const res = await fetch("/api/admin/words?action=pick_today", { method: "PUT" })
    if (!res.ok) {
      const { error } = await res.json()
      setError(error ?? "שגיאה")
    } else {
      const { message } = await res.json()
      setSuccess(message)
      await loadWords()
    }
  }

  async function handleDelete(id: string, word: string) {
    setError(null)
    const res = await fetch(`/api/admin/words?id=${id}`, { method: "DELETE" })
    if (!res.ok) {
      const { error } = await res.json()
      setError(error ?? "שגיאה")
    } else {
      await loadWords()
    }
  }

  const upcoming = words.filter(w => w.date && w.date >= todayStr()).sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))
  const past     = words.filter(w => w.date && w.date < todayStr()).sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))

  const poolLow = poolRemaining !== null && poolRemaining < 30

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-8">
      <h1 className="text-2xl font-bold">ניהול מילים יומיות</h1>

      {/* Pool stats */}
      <div className={`flex items-center justify-between p-4 rounded-xl border ${poolLow ? "border-red-500/50 bg-red-900/10" : "border-gray-700 bg-gray-900"}`}>
        <div>
          <p className="text-sm text-gray-400">מילים בבריכה (לא מתוזמנות)</p>
          <p className={`text-2xl font-bold ${poolLow ? "text-red-400" : "text-white"}`}>
            {poolRemaining === null ? "…" : poolRemaining.toLocaleString()}
          </p>
          {poolLow && (
            <p className="text-red-400 text-xs mt-1">אזהרה: פחות מ-30 מילים נותרו</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          {/* Pick today */}
          {confirmPickToday ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-orange-300">בחר מילה אקראית להיום?</span>
              <button onClick={() => setConfirmPickToday(false)} className="text-sm px-3 py-1.5 rounded-lg border border-gray-600 text-gray-300 hover:border-gray-400 transition-colors">ביטול</button>
              <button onClick={handlePickToday} className="text-sm px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-medium transition-colors">אישור</button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmPickToday(true)}
              disabled={!poolRemaining}
              className="text-sm px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-600 disabled:opacity-40 text-white transition-colors"
            >
              בחר מילה להיום
            </button>
          )}
          {/* Pick tomorrow */}
          {confirmPickNow ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-orange-300">בחר מילה אקראית למחר?</span>
              <button onClick={() => setConfirmPickNow(false)} className="text-sm px-3 py-1.5 rounded-lg border border-gray-600 text-gray-300 hover:border-gray-400 transition-colors">ביטול</button>
              <button onClick={handlePickNow} className="text-sm px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-medium transition-colors">אישור</button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmPickNow(true)}
              disabled={!poolRemaining}
              className="text-sm px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-white transition-colors"
            >
              בחר מילה למחר
            </button>
          )}
        </div>
      </div>

      {/* Feedback */}
      {error   && <p className="text-red-400 text-sm">{error}</p>}
      {success && <p className="text-green-400 text-sm">{success}</p>}

      {/* Add form */}
      <form onSubmit={handleAdd} className="flex flex-col gap-3 bg-gray-900 p-5 rounded-xl">
        <h2 className="font-semibold text-gray-300">הוסף מילה ידנית</h2>
        <div className="flex gap-3">
          <input
            value={newWord}
            onChange={e => setNewWord(e.target.value)}
            placeholder="מילה (5 אותיות)"
            maxLength={6}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-right text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            required
            dir="rtl"
          />
          <input
            type="date"
            value={newDate}
            onChange={e => setNewDate(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
            required
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="self-start bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg font-medium transition-colors"
        >
          {isPending ? "מוסיף…" : "הוסף"}
        </button>
      </form>

      {/* Upcoming words */}
      <section>
        <h2 className="font-semibold text-gray-300 mb-3">מילים קרובות ({upcoming.length})</h2>
        {upcoming.length === 0
          ? <p className="text-gray-500 text-sm">אין מילים מתוזמנות</p>
          : <WordTable rows={upcoming} onDelete={handleDelete} highlight />
        }
      </section>

      {/* Past words */}
      <section>
        <h2 className="font-semibold text-gray-300 mb-3">מילים שעברו ({past.length})</h2>
        {past.length === 0
          ? <p className="text-gray-500 text-sm">אין מילים</p>
          : <WordTable rows={past} onDelete={handleDelete} />
        }
      </section>
    </div>
  )
}

function WordTable({
  rows,
  onDelete,
  highlight = false,
}: {
  rows:      WordRow[]
  onDelete:  (id: string, word: string) => void
  highlight?: boolean
}) {
  const today = todayStr()
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-gray-500 border-b border-gray-800">
          <th className="text-right pb-2 font-normal">מילה</th>
          <th className="text-right pb-2 font-normal">תאריך</th>
          <th className="pb-2" />
        </tr>
      </thead>
      <tbody>
        {rows.map(w => (
          <tr
            key={w.id}
            className={`border-b border-gray-800/50 ${highlight && w.date === today ? "bg-yellow-900/20" : ""}`}
          >
            <td className="py-2 font-bold text-base tracking-wider">{w.word}</td>
            <td className="py-2 text-gray-400">
              {w.date ?? "—"}
              {highlight && w.date === today && <span className="mr-2 text-yellow-400 text-xs">היום</span>}
            </td>
            <td className="py-2 text-left">
              <button
                onClick={() => onDelete(w.id, w.word)}
                className="text-gray-600 hover:text-red-400 transition-colors text-xs"
              >
                מחק
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
