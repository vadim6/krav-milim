"use client"

import { useState, useEffect, useTransition } from "react"

interface WordRow {
  id:         string
  word:       string
  date:       string | null
  source:     string
  created_at: string
}

export default function AdminWordsPage() {
  const [words, setWords]         = useState<WordRow[]>([])
  const [newWord, setNewWord]     = useState("")
  const [newDate, setNewDate]     = useState(todayStr())
  const [error, setError]         = useState<string | null>(null)
  const [success, setSuccess]     = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function todayStr() {
    return new Date().toISOString().split("T")[0]
  }

  async function loadWords() {
    const res = await fetch("/api/admin/words")
    if (res.ok) setWords(await res.json())
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

  async function handleDelete(id: string, word: string) {
    if (!confirm(`למחוק את המילה "${word}"?`)) return
    setError(null)
    const res = await fetch(`/api/admin/words?id=${id}`, { method: "DELETE" })
    if (!res.ok) {
      const { error } = await res.json()
      setError(error ?? "שגיאה")
    } else {
      await loadWords()
    }
  }

  const upcoming = words.filter(w => w.date && w.date >= todayStr()).sort((a, b) => a.date!.localeCompare(b.date!))
  const past     = words.filter(w => !w.date || w.date < todayStr()).sort((a, b) => b.date!.localeCompare(a.date!))

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-8">
      <h1 className="text-2xl font-bold">ניהול מילים יומיות</h1>

      {/* Add form */}
      <form onSubmit={handleAdd} className="flex flex-col gap-3 bg-gray-900 p-5 rounded-xl">
        <h2 className="font-semibold text-gray-300">הוסף מילה חדשה</h2>
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
        {error   && <p className="text-red-400 text-sm">{error}</p>}
        {success && <p className="text-green-400 text-sm">{success}</p>}
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
  const today = new Date().toISOString().split("T")[0]
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
